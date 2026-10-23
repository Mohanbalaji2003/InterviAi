import os
import json

from dotenv import load_dotenv
from google import genai

from concept_taxonomy import (
    CONCEPT_TAXONOMY,
    get_all_topics
)


# ==================================================
# LOAD API KEY
# ==================================================

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:

    raise ValueError(
        "GEMINI_API_KEY is not set."
    )


client = genai.Client(
    api_key=api_key
)

MODEL_NAME = "gemini-3.6-flash"


def _generate_content(prompt, retries=2):
    """Call Gemini with a small retry policy for transient failures."""
    last_error = None

    for attempt in range(retries + 1):
        try:
            return client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt
            )
        except Exception as error:
            last_error = error
            message = str(error).lower()
            transient = any(
                token in message
                for token in ["503", "unavailable", "429", "resource exhausted", "timeout"]
            )
            if not transient or attempt == retries:
                raise

            import time
            time.sleep(1.5 * (attempt + 1))

    raise last_error


# ==================================================
# TEST GEMINI
# ==================================================

def test_gemini():

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=(
            "Say hello to InterviAI in one sentence."
        )
    )

    return response.text.strip()


# ==================================================
# BUILD TAXONOMY TEXT
# ==================================================

def build_taxonomy_text():

    lines = []

    for topic, concepts in (
        CONCEPT_TAXONOMY.items()
    ):

        lines.append(
            f"{topic}:"
        )

        for concept in concepts:

            lines.append(
                f"  - {concept}"
            )


    return "\n".join(lines)


# ==================================================
# GENERATE QUESTION
# ==================================================

def generate_interview_question(
    job_role,
    candidate_skills,
    missing_skills,
    candidate_type,
    experience_years,
    experience_role,
    difficulty,
    question_type,
    focus_topic=None,
    focus_concept=None,
    resume_text=None,
    project_evidence=None,
    previous_questions=None,
):
    taxonomy_text = build_taxonomy_text()

    focus_instruction = ""
    if focus_topic:
        focus_instruction += f"\nThe candidate showed weakness in topic: {focus_topic}.\n"
    if focus_concept:
        focus_instruction += f"\nIMPORTANT: The candidate showed weakness in concept: {focus_concept}. The question MUST test this.\n"

    evidence_instruction = ""
    if resume_text:
        evidence_instruction += f"\nRESUME CONTEXT:\n{resume_text[:1500]}\n"
    if project_evidence:
        evidence_instruction += f"\nPROJECT EVIDENCE CHUNKS:\n{project_evidence[:2000]}\n"

    dedup_instruction = ""
    if previous_questions:
        prior_list = "\n".join(f"- {q}" for q in previous_questions[-10:])
        dedup_instruction = f"\nDO NOT ASK ANY QUESTION SIMILAR TO THESE PRIOR QUESTIONS:\n{prior_list}\n"

    if question_type == "MCQ":
        prompt = f"""
You are an expert technical interviewer.
Generate ONE multiple-choice technical interview question tailored specifically to the target role and candidate evidence.

TARGET ROLE:
{job_role}

CANDIDATE TYPE:
{candidate_type} ({experience_years} experience in {experience_role})

CANDIDATE SKILLS:
{", ".join(candidate_skills) if candidate_skills else "General"}

MISSING SKILLS FOR ROLE:
{", ".join(missing_skills) if missing_skills else "None"}

REQUESTED DIFFICULTY:
{difficulty}

REQUESTED QUESTION TYPE:
MCQ

CONTROLLED TOPIC AND CONCEPT TAXONOMY:
{taxonomy_text}
{focus_instruction}
{evidence_instruction}
{dedup_instruction}

RULES:
1. Generate exactly ONE unique MCQ question.
2. If project evidence or resume text is provided, make the question test concepts or tools explicitly mentioned in their resume or project evidence.
3. Match the target role ({job_role}). A Data Analyst question must differ from Data Scientist / Software Engineer.
4. Generate exactly four distinct options with only one correct option.
5. Provide a topic and concept from the taxonomy or matching the project/resume domain.

Return ONLY valid JSON:
{{
    "type": "MCQ",
    "topic": "Machine Learning",
    "concept": "Class Imbalance",
    "difficulty": "{difficulty}",
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "explanation": "Explanation"
}}
"""
    else:
        prompt = f"""
You are an expert technical interviewer.
Generate ONE descriptive technical interview question tailored specifically to the target role and candidate evidence.

TARGET ROLE:
{job_role}

CANDIDATE TYPE:
{candidate_type} ({experience_years} experience in {experience_role})

CANDIDATE SKILLS:
{", ".join(candidate_skills) if candidate_skills else "General"}

MISSING SKILLS FOR ROLE:
{", ".join(missing_skills) if missing_skills else "None"}

REQUESTED DIFFICULTY:
{difficulty}

REQUESTED QUESTION TYPE:
Descriptive

CONTROLLED TOPIC AND CONCEPT TAXONOMY:
{taxonomy_text}
{focus_instruction}
{evidence_instruction}
{dedup_instruction}

RULES:
1. Generate exactly ONE unique descriptive question.
2. If project evidence or resume text is provided, reference specific architecture choices, libraries, datasets, or algorithms from the candidate's work (e.g. "In your project, why did you choose X over Y?").
3. Match the target role ({job_role}).
4. Provide topic and concept.

Return ONLY valid JSON:
{{
    "type": "Descriptive",
    "topic": "System Design",
    "concept": "API Trade-offs",
    "difficulty": "{difficulty}",
    "question": "Question text"
}}
"""

    response = _generate_content(prompt)
    response_text = response.text.strip()

    if response_text.startswith("```json"):
        response_text = response_text[7:]
    elif response_text.startswith("```"):
        response_text = response_text[3:]
    if response_text.endswith("```"):
        response_text = response_text[:-3]

    response_text = response_text.strip()
    question_data = json.loads(response_text)

    # Tolerant fallback for topic/concept matching
    if "topic" not in question_data:
        question_data["topic"] = focus_topic or "Technical Knowledge"
    if "concept" not in question_data:
        question_data["concept"] = focus_concept or "General Concept"

    question_data["difficulty"] = difficulty

    if question_data.get("type") == "MCQ":
        if "options" not in question_data or len(question_data["options"]) != 4:
            raise ValueError("Invalid MCQ options returned")
        if "correct_answer" not in question_data:
            question_data["correct_answer"] = question_data["options"][0]
        if "explanation" not in question_data:
            question_data["explanation"] = "Correct answer based on technical principles."

    return question_data



# ==================================================
# EVALUATE MCQ
# ==================================================

def evaluate_mcq(
    correct_answer,
    candidate_answer,
    explanation
):

    is_correct = (
        candidate_answer.strip().lower()
        ==
        correct_answer.strip().lower()
    )


    if is_correct:

        return {

            "correctness": 10,

            "technical_depth": 8,

            "relevance": 10,

            "clarity": 10,

            "overall_score": 10,

            "feedback": (
                f"Correct answer. {explanation}"
            ),

            "strengths": [
                "Selected the correct answer",
                "Demonstrated understanding"
            ],

            "missing_concepts": [],

            "improvement_suggestion": (
                "Continue to the next question."
            )
        }


    return {

        "correctness": 0,

        "technical_depth": 0,

        "relevance": 5,

        "clarity": 10,

        "overall_score": 2,

        "feedback": (
            f"Incorrect answer. "
            f"The correct answer is: "
            f"{correct_answer}. "
            f"{explanation}"
        ),

        "strengths": [],

        "missing_concepts": [
            "Review the concept tested "
            "by this question"
        ],

        "improvement_suggestion": (
            "Review the underlying concept "
            "and practice similar questions."
        )
    }


# ==================================================
# EVALUATE DESCRIPTIVE ANSWER
# ==================================================

def evaluate_descriptive_answer(
    question,
    candidate_answer,
    job_role
):

    prompt = f"""
You are an expert technical interviewer.

Evaluate the candidate's answer fairly.

TARGET ROLE:
{job_role}

QUESTION:
{question}

CANDIDATE ANSWER:
{candidate_answer}

Evaluate:

1. Correctness
2. Technical Depth
3. Relevance
4. Clarity

Score each from 0 to 10.

Calculate an overall score from 0 to 10.

Identify the MAIN technical concepts
the candidate failed to demonstrate.

Rules:

- Do not reward confident but incorrect answers.
- Do not penalize concise but technically complete answers.
- Focus on actual technical understanding.
- Keep missing concepts short and specific.
- Do not invent completely unrelated concepts.

Return ONLY valid JSON:

{{
    "correctness": 0,
    "technical_depth": 0,
    "relevance": 0,
    "clarity": 0,
    "overall_score": 0,
    "feedback": "Feedback",
    "strengths": [
        "Strength"
    ],
    "missing_concepts": [
        "Concept"
    ],
    "improvement_suggestion": "Suggestion"
}}
"""


    response = _generate_content(prompt)


    response_text = response.text.strip()


    if response_text.startswith(
        "```json"
    ):

        response_text = response_text[7:]


    elif response_text.startswith(
        "```"
    ):

        response_text = response_text[3:]


    if response_text.endswith(
        "```"
    ):

        response_text = response_text[:-3]


    response_text = response_text.strip()


    try:

        evaluation = json.loads(
            response_text
        )

    except json.JSONDecodeError as error:

        raise ValueError(
            "Gemini returned invalid evaluation JSON:\n"
            f"{response_text}"
        ) from error

    return evaluation


# ==================================================
# CHATBOT ASSISTANT SERVICE
# ==================================================

def generate_chatbot_reply(
    user_message: str,
    chat_history: list = None,
    candidate_name: str = "Candidate",
    target_role: str = "Software Engineer / Data Scientist",
    resume_context: str = None,
    resume_skills: list = None,
    resume_claims: list = None,
    project_name: str = None,
    project_evidence: str = None,
    report_summary: dict = None,
) -> dict:
    """
    Generate an AI coach response using Gemini, grounded in candidate resume, project evidence,
    and interview assessment results.
    """
    history_lines = []
    if chat_history:
        for item in chat_history[-6:]:
            role_label = "User" if item.get("role") in {"user", "User"} else "InterviAI Assistant"
            history_lines.append(f"{role_label}: {item.get('content') or item.get('message')}")
    history_text = "\n".join(history_lines) if history_lines else "None (New conversation)"

    # Build context briefing
    brief_parts = [
        f"Candidate Name: {candidate_name}",
        f"Target Role: {target_role}",
    ]
    if resume_skills:
        brief_parts.append(f"Resume Detected Skills: {', '.join(resume_skills[:12])}")
    if resume_claims:
        brief_parts.append(f"Resume Claims Sample: {json.dumps(resume_claims[:4])}")
    if resume_context:
        brief_parts.append(f"Resume Text Snippet: {resume_context[:800]}")
    if project_name:
        brief_parts.append(f"Active Project: {project_name}")
    if project_evidence:
        brief_parts.append(f"Project Evidence / Code Chunks (RAG Grounding):\n{project_evidence[:1400]}")
    if report_summary:
        brief_parts.append(f"Latest Assessment Summary: {json.dumps(report_summary)}")

    context_block = "\n".join(brief_parts)

    prompt = f"""
You are the **InterviAI Assistant & MNC Interview Intelligence Coach**.
Your mission is to help candidates:
1. Understand their interview scores, assessment reports, and weak areas.
2. Prepare for FAANG/MNC technical and behavioral interviews (STAR framework, system design trade-offs, algorithms).
3. Explain technical concepts with senior-level depth, concrete examples, and architectural trade-offs.
4. Defend their uploaded resume and projects using specific evidence from their uploaded work.

CANDIDATE CONTEXT:
{context_block}

RECENT CHAT HISTORY:
{history_text}

USER MESSAGE:
"{user_message}"

INSTRUCTIONS:
1. Provide a direct, professional, articulate, and highly practical response.
2. If the user asks about their resume, project, or past interview results, ground your response specifically in the provided CANDIDATE CONTEXT. Mention their specific project name, skills, or metrics if relevant.
3. If they ask about technical concepts, explain clearly: definition, real-world application, failure modes/trade-offs, and FAANG interview expectations.
4. If they ask about weak areas or preparation, provide concrete, actionable drills.
5. Format your response cleanly using GitHub-flavored Markdown (bolding, bullet points, concise paragraphs, backticked code/terms).
6. Provide 2-3 short, relevant follow-up questions the user might want to ask next.

Return ONLY valid JSON:
{{
    "reply": "Your markdown formatted reply here",
    "citations": ["Citation or evidence source if used, else empty array"],
    "suggested_followups": ["Question 1", "Question 2"]
}}
"""

    try:
        response = _generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        data = json.loads(text.strip())
        return {
            "reply": data.get("reply", "").strip(),
            "citations": data.get("citations", []),
            "suggested_followups": data.get("suggested_followups", [
                "How do I improve my weakest concept?",
                "Give me a mock question on my project",
                "How do I structure a STAR response for Amazon/Google?",
            ]),
        }
    except Exception:
        # Graceful fallback response grounded in user's profile
        lower = user_message.lower()
        if "project" in lower and project_name:
            reply = (
                f"### Project Defense Analysis for **{project_name}**\n\n"
                f"Your uploaded project contains technical evidence indexed for adaptive defense. "
                f"In MNC interviews (Google, Amazon, Meta), interviewers will probe:\n\n"
                f"1. **Architectural Rationale**: Why did you choose this tech stack over standard alternatives?\n"
                f"2. **Bottlenecks & Scale**: What happens when database throughput or QPS increases by 10x?\n"
                f"3. **Resilience**: How are failovers, retry loops, and data consistency handled?\n\n"
                f"Would you like to simulate a deep-dive technical question on your project architecture?"
            )
        elif "resume" in lower and resume_skills:
            reply = (
                f"### Resume Verification & Competency Review\n\n"
                f"We analyzed your active resume. Detected core competencies include: **{', '.join(resume_skills[:6])}**.\n\n"
                f"**Key Recruiter Insights:**\n"
                f"- Ensure every bullet point highlights a quantified metric (e.g., latency reduction, cost savings, accuracy gain).\n"
                f"- Be prepared to defend architectural trade-offs for tools listed on your resume.\n"
                f"- Never state 'we designed' when discussing core modules—clearly delineate your personal contributions."
            )
        elif "weak" in lower or "report" in lower or "score" in lower:
            reply = (
                "### Interview Assessment & Weak Area Breakdown\n\n"
                "Your Candidate Intelligence Scorecard evaluates Technical Depth, Applied Reasoning, Project Defense, and Communication.\n\n"
                "**Actionable Next Steps:**\n"
                "1. **Focus on Trade-offs**: When answering system design or architecture questions, state both advantages and limitations.\n"
                "2. **Master the STAR Method**: Dedicate 50% of your response to the **Action** (the specific engineering decisions YOU made).\n"
                "3. **Targeted Drills**: Take another adaptive assessment focusing on your lower-scoring categories."
            )
        else:
            reply = (
                f"### InterviAI Coaching Perspective\n\n"
                f"To excel in interviews for **{target_role}**, structure your answers with systematic rigor:\n\n"
                f"• **Clarify assumptions**: State input edge cases and operational constraints up front.\n"
                f"• **State trade-offs**: Contrast your chosen approach with the brute-force or alternative pattern.\n"
                f"• **Quantify outcomes**: Always articulate the business impact and runtime complexity (Time O(N), Space O(1)).\n\n"
                f"How can I help you prepare further today?"
            )

        return {
            "reply": reply,
            "citations": [f"Evidence from {project_name}"] if project_name else [],
            "suggested_followups": [
                "What claims in my resume might an interviewer probe?",
                "How do I prepare for FAANG system design?",
                "Simulate a hard interview question on my project",
            ],
        }


# ==================================================
# ACTIONABLE PREPARATION PLAN GENERATOR
# ==================================================

def generate_personalized_prep_plan(
    job_role: str,
    overall_score: float,
    readiness_score: float,
    weak_concepts: list = None,
    topic_performance: dict = None,
    candidate_skills: list = None,
) -> dict:
    """
    Generate an actionable 7-day and 30-day interview preparation roadmap.
    """
    prompt = f"""
You are a Staff Technical Hiring Bar Raiser at a top technology company.
Generate an actionable, personalized interview preparation roadmap for a candidate who just completed an adaptive technical assessment.

ASSESSMENT RESULTS:
- Target Job Role: {job_role}
- Overall Score: {overall_score}/10
- Role Readiness Score: {readiness_score}%
- Weak Concepts / Priority Gaps: {json.dumps(weak_concepts or [])}
- Topic Performance: {json.dumps(topic_performance or {})}
- Candidate Skills: {json.dumps(candidate_skills or [])}

INSTRUCTIONS:
Create a high-impact, realistic preparation plan containing:
1. Executive summary of what needs sharpening.
2. 7-Day Sprint Plan (Day 1 to Day 7) with concrete daily focus, study topics, and hands-on exercises.
3. 3 High-Yield STAR Behavioral Practice Prompts tailored to this role.
4. Top 3 Technical Architecture Questions to master before the next interview.

Return ONLY valid JSON:
{{
    "executive_summary": "Summary text",
    "target_role": "{job_role}",
    "readiness_tier": "Tier name",
    "daily_sprint": [
        {{
            "day": "Day 1-2",
            "theme": "Theme title",
            "focus_areas": ["Item 1", "Item 2"],
            "action_item": "Hands-on action item"
        }},
        {{
            "day": "Day 3-4",
            "theme": "Theme title",
            "focus_areas": ["Item 1", "Item 2"],
            "action_item": "Hands-on action item"
        }},
        {{
            "day": "Day 5-6",
            "theme": "Theme title",
            "focus_areas": ["Item 1", "Item 2"],
            "action_item": "Hands-on action item"
        }},
        {{
            "day": "Day 7",
            "theme": "Full Mock Simulation",
            "focus_areas": ["Timed interview", "STAR review"],
            "action_item": "Complete full adaptive retake on InterviAI"
        }}
    ],
    "star_prompts": [
        "Prompt 1",
        "Prompt 2",
        "Prompt 3"
    ],
    "architecture_must_knows": [
        "Architecture concept 1",
        "Architecture concept 2",
        "Architecture concept 3"
    ]
}}
"""

    try:
        response = _generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())
    except Exception:
        # Fallback structured preparation plan
        return {
            "executive_summary": f"Targeted preparation plan for {job_role}. Focus on strengthening foundational trade-offs and project defense evidence.",
            "target_role": job_role,
            "readiness_tier": "Strong Candidate / Level 4 Standard" if readiness_score >= 75 else "Foundational Stage",
            "daily_sprint": [
                {
                    "day": "Day 1-2",
                    "theme": "Core Concepts & Algorithm Foundations",
                    "focus_areas": ["Time and space complexity profiling", "Handling edge cases (empty inputs, concurrency)"],
                    "action_item": "Implement 3 core algorithmic problems from scratch with dry-run proofs.",
                },
                {
                    "day": "Day 3-4",
                    "theme": "Applied System Architecture & Failure Modes",
                    "focus_areas": ["Caching patterns (Redis, Memcached)", "Database indexing and connection pooling"],
                    "action_item": "Diagram the architecture of your primary project, labeling every single-point-of-failure.",
                },
                {
                    "day": "Day 5-6",
                    "theme": "MNC STAR Behavioral & Leadership Defense",
                    "focus_areas": ["Structuring answers into Situation, Task, Action (60%), and Result (20%)", "Quantifying business metrics"],
                    "action_item": "Write down 3 stories using 'I decided' instead of 'we did'.",
                },
                {
                    "day": "Day 7",
                    "theme": "Full Mock Simulation & Retake",
                    "focus_areas": ["Complete 10-question adaptive assessment", "Analyze updated readiness score"],
                    "action_item": "Run an adaptive interview on InterviAI and verify claim grounding.",
                },
            ],
            "star_prompts": [
                "Tell me about a time you had to make a critical architectural trade-off under strict deadline pressure.",
                "Describe a situation where a production system or service failed. How did you diagnose and remediate it?",
                "Give an example of a technical disagreement with a team member and how you resolved it objectively.",
            ],
            "architecture_must_knows": [
                "Horizontal vs vertical scaling trade-offs and distributed cache coherence.",
                "Database isolation levels, read-replicas, and ACID vs BASE trade-offs.",
                "API rate limiting algorithms (Token Bucket, Leaky Bucket, Sliding Window).",
            ],
        }