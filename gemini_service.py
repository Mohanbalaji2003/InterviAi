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