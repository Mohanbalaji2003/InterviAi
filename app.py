import os
import requests
import streamlit as st
import fitz
import matplotlib.pyplot as plt

from Skill_extractor import extract_skills
from role_skills import get_required_skills

from gemini_service import evaluate_mcq
from fast_evaluator import evaluate_descriptive_answer_fast

from adaptive_engine import (
    get_next_difficulty,
    get_next_question_type,
    get_next_focus,
)

from interview_engine import InterviewSession
from candidate_profile import CandidateProfile
from concept_normalizer import normalize_concepts
from fast_interview_bank import get_fast_question_bank
from project_defense_rag import ProjectDefenseRAG, extract_project_text, generate_project_defense_bank
from resume_claim_verifier import extract_resume_claims, verify_claims, get_claim_summary
from cross_examination import build_cross_examination_bank
from candidate_intelligence import CandidateIntelligenceEngine


# =========================================================
# BACKEND API CONFIGURATION
# =========================================================

API_BASE_URL = os.getenv(
    "INTERVIAI_API_URL",
    "http://127.0.0.1:8000",
)


def api_post(path, payload=None):
    """Send a POST request to the InterviAI backend."""
    response = requests.post(
        f"{API_BASE_URL}{path}",
        json=payload,
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def api_get(path):
    """Send a GET request to the InterviAI backend."""
    response = requests.get(
        f"{API_BASE_URL}{path}",
        timeout=10,
    )
    response.raise_for_status()
    return response.json()



st.set_page_config(
    page_title="InterviAI",
    page_icon="🎯",
    layout="wide"
)


# =========================================================
# SESSION STATE
# =========================================================

defaults = {
    "interview_session": None,
    "candidate_profile": CandidateProfile(),
    "current_question_data": None,
    "question_bank": [],
    "used_question_indexes": [],
    "bank_ready": False,
    "next_difficulty": None,
    "next_question_type": None,
    "next_focus_topic": None,
    "interview_complete": False,
    "project_rag": None,
    "project_defense_bank": [],
    "project_defense_enabled": False,
    "project_ready": False,
    "resume_claims": [],
    "claim_verification": [],
    "claim_summary": None,
    "cross_examination_bank": [],
    "backend_candidate_id": None,
    "backend_interview_id": None,
    "claims_saved_to_backend": False,
    "interview_saved_to_backend": False,
}

for key, value in defaults.items():
    if key not in st.session_state:
        st.session_state[key] = value


st.title("🎯 InterviAI")
st.subheader("Adaptive AI Interview & Candidate Assessment System")
st.write(
    "InterviAI analyzes your profile, adapts interview difficulty, "
    "and can defend your projects using retrieval-grounded questions."
)


# =========================================================
# RESUME
# =========================================================

st.header("📄 Upload Your Resume")

uploaded_file = st.file_uploader(
    "Upload your Resume",
    type=["pdf"],
)

if uploaded_file is None:
    st.info("👆 Upload your resume PDF to begin.")
    st.stop()

pdf = fitz.open(
    stream=uploaded_file.getvalue(),
    filetype="pdf",
)

resume_text = "".join(page.get_text() for page in pdf)
pdf.close()

st.header("🧠 Detected Skills")
skills = extract_skills(resume_text)

if skills:
    columns = st.columns(3)
    for index, skill in enumerate(skills):
        with columns[index % 3]:
            st.success(skill)
else:
    st.warning("No skills were detected from the resume.")


# =========================================================
# ROLE
# =========================================================

st.header("🎯 Target Job Role")

job_role = st.selectbox(
    "Select your target role",
    [
        "Data Scientist",
        "Data Analyst",
        "Machine Learning Engineer",
        "AI Engineer",
        "Software Engineer",
    ],
)


st.header("👤 Candidate Profile")

candidate_type = st.radio(
    "Candidate Type",
    ["Fresher", "Experienced"],
    horizontal=True,
)

experience_years = "0 years"
experience_role = "Not Applicable"

if candidate_type == "Experienced":
    experience_years = st.selectbox(
        "Years of Experience",
        ["1 year", "2 years", "3-5 years", "5+ years"],
    )
    experience_role = st.selectbox(
        "Experience Role",
        [
            "Data Analyst",
            "Data Scientist",
            "Machine Learning Engineer",
            "AI Engineer",
            "Software Engineer",
            "Other",
        ],
    )


# =========================================================
# PROJECT DEFENSE
# =========================================================

st.header("🧪 Project Defense Mode")

project_files = st.file_uploader(
    "Upload project report / README / relevant project files",
    type=["pdf", "txt", "md", "py", "json", "csv"],
    accept_multiple_files=True,
    help="Upload your project report, README, or selected source/data files.",
)

project_col1, project_col2 = st.columns(2)

with project_col1:
    build_project = st.button(
        "🧠 Build Project Knowledge",
        disabled=not project_files,
    )

with project_col2:
    enable_project_defense = st.checkbox(
        "Use Project Defense",
        value=False,
        disabled=not st.session_state.project_ready,
    )

if build_project:
    with st.spinner("Indexing your project..."):
        try:
            project_text = extract_project_text(project_files)

            rag = ProjectDefenseRAG()
            # One upload event -> one local index.
            rag.add_text(
                project_text,
                source="uploaded-project-files",
            )
            rag.build_index()

            defense_bank = generate_project_defense_bank(
                rag=rag,
                job_role=job_role,
                candidate_skills=skills,
                count=6,
            )

            st.session_state.project_rag = rag
            st.session_state.project_defense_bank = defense_bank
            st.session_state.project_ready = True
            st.session_state.project_defense_enabled = True

            st.success(
                f"Project knowledge ready: "
                f"{len(rag.chunks)} evidence chunks, "
                f"{len(defense_bank)} grounded defense questions."
            )

        except Exception as e:
            st.error(f"Project knowledge build failed: {e}")

# Preserve checkbox state after the widget is rendered.
if st.session_state.project_ready:
    st.session_state.project_defense_enabled = enable_project_defense


    verify_claim_button = st.button(
        "🔍 Prepare Resume Claim Verification",
        key="verify_resume_claims",
    )

    if verify_claim_button:
        with st.spinner("Checking resume claims against project evidence..."):
            try:
                claims = extract_resume_claims(resume_text)
                results = verify_claims(
                    claims=claims,
                    rag=st.session_state.project_rag,
                )
                st.session_state.resume_claims = claims
                st.session_state.claim_verification = results
                st.session_state.claim_summary = get_claim_summary(results)
                st.session_state.cross_examination_bank = build_cross_examination_bank(
                    st.session_state.claim_verification,
                    count=4,
                )
                st.success("Resume claims prepared for the final assessment.")

            except Exception as e:
                st.error(f"Claim verification failed: {e}")



# =========================================================
# INTERVIEW SETTINGS
# =========================================================

st.header("⚙️ Interview Settings")

starting_difficulty = st.selectbox(
    "Starting Difficulty",
    ["Easy", "Medium", "Hard"],
)

total_questions = st.selectbox(
    "Number of Questions",
    [5, 10, 15],
    index=1,
)


# =========================================================
# ROLE GAP
# =========================================================

required_skills = get_required_skills(job_role)

matched_skills = [
    skill for skill in required_skills
    if skill in skills
]

missing_skills = [
    skill for skill in required_skills
    if skill not in skills
]

st.header("📊 Skill Gap Analysis")

for skill in required_skills:
    st.write("✅" if skill in skills else "❌", skill)

st.subheader("⚠️ Missing Skills")

if missing_skills:
    for skill in missing_skills:
        st.write("⚠️", skill)
else:
    st.success("No major skill gaps detected.")

readiness_score = (
    len(matched_skills) / len(required_skills) * 100
    if required_skills else 0
)

st.header("📈 Role Readiness")
st.progress(int(readiness_score))
st.metric("Estimated Role Readiness", f"{readiness_score:.1f}%")


# =========================================================
# FAST QUESTION SELECTION
# =========================================================

def choose_question(
    bank,
    desired_type,
    desired_difficulty,
    focus_concept=None,
    used_indexes=None,
):
    if used_indexes is None:
        used_indexes = set()

    unused = [
        (index, q)
        for index, q in enumerate(bank)
        if index not in used_indexes
    ]

    if not unused:
        return None, None

    candidates = [
        (i, q)
        for i, q in unused
        if q.get("type") == desired_type
        and q.get("difficulty") == desired_difficulty
    ]

    if focus_concept:
        focused = [
            (i, q)
            for i, q in candidates
            if q.get("concept", "").lower() == str(focus_concept).lower()
        ]
        if focused:
            return focused[0]

    if candidates:
        return candidates[0]

    candidates = [
        (i, q)
        for i, q in unused
        if q.get("type") == desired_type
    ]
    if candidates:
        return candidates[0]

    candidates = [
        (i, q)
        for i, q in unused
        if q.get("difficulty") == desired_difficulty
    ]
    if candidates:
        return candidates[0]

    return unused[0]


def activate_question(session, question_index, question_data):
    session.set_current_question(
        question_data,
        question_data["difficulty"],
    )
    st.session_state.used_question_indexes.append(question_index)
    st.session_state.current_question_data = question_data


def compose_live_bank(job_role):
    bank = get_fast_question_bank(job_role)

    if st.session_state.cross_examination_bank:
        bank = st.session_state.cross_examination_bank + bank

    if st.session_state.project_defense_enabled:
        bank = st.session_state.project_defense_bank + bank

    return bank


# =========================================================
# START INTERVIEW
# =========================================================

st.header("🤖 Adaptive AI Interview")

if st.session_state.interview_session is None:
    st.info(
        "Live questioning is local and fast. Project Defense uses retrieval-grounded "
        "questions prepared before the interview."
    )

    if st.button("🚀 Start Adaptive Interview"):
        session = InterviewSession(total_questions=total_questions)
        profile = CandidateProfile()

        bank = compose_live_bank(job_role)

        if not bank:
            st.error("No interview questions are available.")
            st.stop()

        st.session_state.interview_session = session
        st.session_state.candidate_profile = profile
        st.session_state.interview_complete = False

        # Persist the candidate before creating the interview.
        try:
            candidate_payload = {
                "name": None,
                "email": None,
                "target_role": job_role,
                "candidate_type": candidate_type,
                "experience_years": experience_years,
                "resume_text": resume_text,
                "skills": skills,
            }

            candidate_response = api_post(
                "/candidates",
                candidate_payload,
            )

            st.session_state.backend_candidate_id = candidate_response["id"]

            interview_response = api_post(
                "/interviews",
                {
                    "candidate_id": st.session_state.backend_candidate_id,
                    "job_role": job_role,
                    "total_questions": total_questions,
                },
            )

            st.session_state.backend_interview_id = interview_response["id"]

        except Exception as api_error:
            st.warning(
                "Backend persistence is unavailable, so this session will "
                "continue locally. Start FastAPI to enable database saving."
            )
            st.session_state.backend_candidate_id = None
            st.session_state.backend_interview_id = None
        st.session_state.current_question_data = None
        st.session_state.next_difficulty = starting_difficulty
        st.session_state.next_question_type = "MCQ"
        st.session_state.next_focus_topic = None
        st.session_state.question_bank = bank
        st.session_state.used_question_indexes = []
        st.session_state.bank_ready = True

        selected_index, question_data = choose_question(
            bank,
            "MCQ",
            starting_difficulty,
        )

        # If Project Defense is enabled and there is no MCQ at the requested level,
        # start normally and let adaptation reach project questions later.
        if question_data is None:
            selected_index, question_data = choose_question(
                bank,
                "Descriptive",
                starting_difficulty,
            )

        if question_data is None:
            st.error("Could not select the first interview question.")
            st.stop()

        activate_question(session, selected_index, question_data)
        st.rerun()


# =========================================================
# ACTIVE INTERVIEW
# =========================================================

session = st.session_state.interview_session

if session is not None and not st.session_state.interview_complete:
    completed_questions = len(session.question_history)
    current_question_number = completed_questions + 1

    st.divider()
    st.subheader(
        f"Question {current_question_number} of {session.total_questions}"
    )
    st.progress(completed_questions / session.total_questions)

    question_data = st.session_state.current_question_data

    if question_data is None:
        st.error("The current interview question is missing.")
        st.stop()

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.write(f"**Type:** {question_data['type']}")

    with col2:
        st.write(f"**Difficulty:** {session.current_difficulty}")

    with col3:
        st.write(f"**Topic:** {question_data.get('topic', 'General')}")

    with col4:
        st.write(f"**Concept:** {question_data.get('concept', 'General')}")

    st.info(question_data["question"])

    if question_data["type"] == "MCQ":
        options = question_data.get("options", [])
        if len(options) != 4:
            st.error("Invalid MCQ in the interview bank.")
            st.stop()

        candidate_answer = st.radio(
            "Select your answer:",
            options,
            key=f"mcq_{current_question_number}",
        )
    else:
        candidate_answer = st.text_area(
            "✍️ Your Answer",
            placeholder="Explain your answer clearly...",
            height=220,
            key=f"answer_{current_question_number}",
        )

    if (
        question_data.get("evidence")
        and question_data.get("topic") == "Project Defense"
    ):
        with st.expander("Why this project-defense question?"):
            st.write(question_data["evidence"])

    if st.button(
        "📤 Submit Answer",
        key=f"submit_{current_question_number}",
    ):
        if not candidate_answer or not candidate_answer.strip():
            st.warning("Please provide an answer.")
            st.stop()

        try:
            if question_data["type"] == "MCQ":
                evaluation = evaluate_mcq(
                    correct_answer=question_data["correct_answer"],
                    candidate_answer=candidate_answer,
                    explanation=question_data["explanation"],
                )
            else:
                evaluation = evaluate_descriptive_answer_fast(
                    question_data=question_data,
                    candidate_answer=candidate_answer,
                )

            score = float(evaluation["overall_score"])
            topic = question_data.get("topic", "General Technical Knowledge")
            concept = question_data.get("concept", "General Concept")

            raw_missing = evaluation.get("missing_concepts", [])
            missing_concepts = normalize_concepts(
                raw_missing,
                topic=topic,
                fallback=concept if score < 7 else None,
            )

            session.record_result(
                score=score,
                topic=topic,
                concept=concept,
                missing_concepts=missing_concepts,
            )

            st.session_state.candidate_profile.add_result(
                score=score,
                topic=topic,
                concept=concept,
                question_type=question_data["type"],
                difficulty=session.current_difficulty,
                missing_concepts=missing_concepts,
            )

            # Persist answer/evaluation to the backend when available.
            if st.session_state.backend_interview_id is not None:
                try:
                    api_post(
                        f"/interviews/{st.session_state.backend_interview_id}/answers",
                        {
                            "question_number": current_question_number,
                            "question_type": question_data["type"],
                            "difficulty": session.current_difficulty,
                            "topic": topic,
                            "concept": concept,
                            "question_text": question_data["question"],
                            "answer_text": candidate_answer,
                            "score": score,
                            "evaluation": evaluation,
                        },
                    )
                except Exception as api_error:
                    st.warning(
                        f"Answer could not be saved to the backend: {api_error}"
                    )

            if session.is_finished():
                st.session_state.interview_complete = True
                st.session_state.current_question_data = None
                st.rerun()

            next_difficulty = get_next_difficulty(
                session.current_difficulty,
                score,
            )

            next_question_type = get_next_question_type(
                score,
                session.question_history,
            )

            next_focus_topic = get_next_focus(missing_concepts)

            st.session_state.next_difficulty = next_difficulty
            st.session_state.next_question_type = next_question_type
            st.session_state.next_focus_topic = next_focus_topic

            bank = st.session_state.question_bank
            used = set(st.session_state.used_question_indexes)

            next_index, next_question_data = choose_question(
                bank,
                next_question_type,
                next_difficulty,
                focus_concept=next_focus_topic,
                used_indexes=used,
            )

            if next_question_data is None:
                # Final fallback: any unused question.
                unused = [
                    (i, q)
                    for i, q in enumerate(bank)
                    if i not in used
                ]
                if not unused:
                    st.error("No unused questions remain.")
                    st.stop()
                next_index, next_question_data = unused[0]

            activate_question(
                session,
                next_index,
                next_question_data,
            )

            st.rerun()

        except Exception as e:
            st.error(f"Unable to process your answer: {e}")
            st.code(str(e))



def build_candidate_intelligence():
    profile_data = st.session_state.candidate_profile.get_profile()
    engine = CandidateIntelligenceEngine(
        interview_profile=profile_data,
        claim_summary=st.session_state.claim_summary or {},
        role_readiness=readiness_score,
    )
    return engine.get_report()


# =========================================================
# FINAL REPORT
# =========================================================

session = st.session_state.interview_session

if session is not None and st.session_state.interview_complete:
    profile = st.session_state.candidate_profile.get_profile()
    intelligence = build_candidate_intelligence()

    st.divider()
    st.header("🧠 Candidate Intelligence Report")
    st.write(f"**Role:** {job_role}")
    st.write(f"**Candidate Type:** {candidate_type}")

    overall = float(intelligence["overall_readiness"])
    st.subheader("Overall Role Readiness")
    st.progress(int(overall))
    st.metric("InterviAI Readiness Score", f"{overall:.0f}%", intelligence["performance_level"])

    # Persist final assessment.
    if st.session_state.backend_interview_id is not None:
        try:
            if not st.session_state.get("interview_saved_to_backend", False):
                api_post(
                    f"/interviews/{st.session_state.backend_interview_id}/finish",
                    {
                        "overall_score": float(profile["overall_score"]),
                        "readiness_score": overall,
                    },
                )
                st.session_state.interview_saved_to_backend = True
        except Exception:
            pass

    components = intelligence["components"]
    c1, c2, c3 = st.columns(3)
    with c1:
        st.metric("Technical Knowledge", f"{components['Technical Knowledge']:.0f}%")
        st.metric("Applied Reasoning", f"{components['Applied Reasoning']:.0f}%")
    with c2:
        st.metric("Project Understanding", f"{components['Project Understanding']:.0f}%")
        st.metric("Technical Communication", f"{components['Technical Communication']:.0f}%")
    with c3:
        st.metric("Resume Evidence", f"{components['Resume Evidence Confidence']:.0f}%")
        st.metric("Role Readiness", f"{components['Role Readiness']:.0f}%")

    st.subheader("💪 Strengths")
    for strength in intelligence["strengths"]:
        st.write("✅", strength)

    st.subheader("⚠️ Risk Signals")
    for risk in intelligence["risk_signals"]:
        st.write("⚠️", risk)

    st.subheader("🎯 Recommended Focus")
    for focus in intelligence["recommended_focus"]:
        st.write("→", focus)

    st.subheader("📊 Interview Performance")

    final_score = float(profile["overall_score"])

    col1, col2, col3 = st.columns(3)

    with col1:
        strongest_topics = profile["strongest_topics"]
        if strongest_topics:
            st.success(
                f"💪 Strongest Area\n\n"
                f"**{strongest_topics[0][0]}**\n\n"
                f"{strongest_topics[0][1]:.1f}/10"
            )

    with col2:
        weakest_topics = profile["weakest_topics"]
        if weakest_topics:
            st.error(
                f"⚠️ Weakest Area\n\n"
                f"**{weakest_topics[0][0]}**\n\n"
                f"{weakest_topics[0][1]:.1f}/10"
            )

    with col3:
        weakest_concepts = profile["weakest_concepts"]
        if weakest_concepts:
            st.warning(
                f"🎯 Weakest Concept\n\n"
                f"**{weakest_concepts[0][0]}**\n\n"
                f"{weakest_concepts[0][1]:.1f}/10"
            )

    st.subheader("💪 Strongest Concepts")
    for concept, score in profile["strongest_concepts"]:
        st.write(f"✅ **{concept}** — {score:.1f}/10")

    st.subheader("⚠️ Concepts Requiring Attention")
    for concept, score in profile["weakest_concepts"]:
        st.write(f"⚠️ **{concept}** — {score:.1f}/10")

    st.subheader("🎯 Question Format Performance")
    for question_type, score in profile["question_type_performance"].items():
        st.write(f"**{question_type}** — {score:.1f}/10")

    st.subheader("📈 Difficulty Performance")
    for difficulty, score in profile["difficulty_performance"].items():
        st.write(f"**{difficulty}** — {score:.1f}/10")

    st.subheader("📖 Identified Knowledge Gaps")
    if profile["missing_concepts"]:
        for concept in profile["missing_concepts"]:
            st.write("🔸", concept)
    else:
        st.success("No major knowledge gaps were identified.")

    if st.session_state.claim_summary:
        # Persist verified claims once the final report is rendered.
        if st.session_state.backend_interview_id is not None:
            try:
                if not st.session_state.get("claims_saved_to_backend", False):
                    api_post(
                        f"/interviews/{st.session_state.backend_interview_id}/claims",
                        st.session_state.claim_verification,
                    )
                    st.session_state.claims_saved_to_backend = True
            except Exception:
                pass

        st.subheader("🔎 Resume Claim Verification")
        summary = st.session_state.claim_summary

        st.metric(
            "Resume Evidence Confidence",
            f"{summary['verification_confidence']:.0f}%"
        )

        labels = []
        values = []
        if summary["supported"] > 0:
            labels.append("Supported")
            values.append(summary["supported"])
        if summary["partially_supported"] > 0:
            labels.append("Partially Supported")
            values.append(summary["partially_supported"])
        if summary["unverified"] > 0:
            labels.append("Unverified")
            values.append(summary["unverified"])

        if values:
            fig, ax = plt.subplots(figsize=(5.0, 4.0))
            ax.pie(
                values,
                labels=labels,
                autopct="%1.0f%%",
                startangle=90,
                wedgeprops={"edgecolor": "white", "linewidth": 1},
            )
            ax.set_title("Claim Verification Breakdown")
            ax.axis("equal")
            st.pyplot(fig, use_container_width=False)
            plt.close(fig)

        for item in st.session_state.claim_verification:
            status = item["status"]

            if status == "Supported":
                icon = "✅"
            elif status == "Partially Supported":
                icon = "🟡"
            else:
                icon = "⚠️"

            st.write(
                f"{icon} **{status}** — {item['claim']}"
            )

    st.divider()

    if st.button("🔄 Start New Interview"):
        for key in defaults:
            if key == "candidate_profile":
                st.session_state[key] = CandidateProfile()
            elif key == "interview_session":
                st.session_state[key] = None
            elif key in {"question_bank", "used_question_indexes", "project_defense_bank"}:
                st.session_state[key] = []
            elif key == "project_rag":
                st.session_state[key] = None
            elif key in {"resume_claims", "claim_verification", "cross_examination_bank"}:
                st.session_state[key] = []
            elif key == "claim_summary":
                st.session_state[key] = None
            elif key in {"backend_candidate_id", "backend_interview_id"}:
                st.session_state[key] = None
            elif key in {"claims_saved_to_backend", "interview_saved_to_backend"}:
                st.session_state[key] = False
            elif key in {"bank_ready", "project_defense_enabled", "project_ready", "interview_complete"}:
                st.session_state[key] = False
            else:
                st.session_state[key] = None
        st.rerun()
