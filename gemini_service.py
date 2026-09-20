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
    focus_concept=None
):

    taxonomy_text = (
        build_taxonomy_text()
    )


    # --------------------------------------------------
    # FOCUS INSTRUCTIONS
    # --------------------------------------------------

    focus_instruction = ""


    if focus_topic:

        focus_instruction += f"""

The candidate has shown weakness in this topic:

{focus_topic}

Prefer a question from this topic.
"""


    if focus_concept:

        focus_instruction += f"""

IMPORTANT:
The candidate has shown weakness in this concept:

{focus_concept}

The generated question MUST test this concept.
"""


    if not focus_instruction:

        focus_instruction = """

No specific weakness has been identified.
Choose an appropriate topic and concept from
the taxonomy.
"""


    # ==================================================
    # MCQ
    # ==================================================

    if question_type == "MCQ":

        prompt = f"""
You are an expert technical interviewer.

Generate ONE multiple-choice technical interview question.

TARGET ROLE:
{job_role}

CANDIDATE TYPE:
{candidate_type}

EXPERIENCE:
{experience_years}

EXPERIENCE ROLE:
{experience_role}

CANDIDATE SKILLS:
{", ".join(candidate_skills)}

MISSING SKILLS:
{", ".join(missing_skills) if missing_skills else "None"}

REQUESTED DIFFICULTY:
{difficulty}

REQUESTED QUESTION TYPE:
MCQ

CONTROLLED TOPIC AND CONCEPT TAXONOMY:

{taxonomy_text}

{focus_instruction}


RULES:

1. Generate exactly ONE question.
2. Generate exactly four options.
3. Only one option is correct.
4. Do not create ambiguous questions.
5. Match the requested difficulty.
6. Match the candidate's experience.
7. Do not assume production experience from a fresher.
8. Prefer practical technical understanding.
9. The topic MUST exactly match one topic in the taxonomy.
10. The concept MUST exactly match one concept belonging to that topic.
11. Do not invent a topic.
12. Do not invent a concept.

Return ONLY valid JSON:

{{
    "type": "MCQ",
    "topic": "Machine Learning",
    "concept": "Class Imbalance",
    "difficulty": "{difficulty}",
    "question": "Question text",
    "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
    ],
    "correct_answer": "Option A",
    "explanation": "Explanation"
}}
"""


    # ==================================================
    # DESCRIPTIVE
    # ==================================================

    else:

        prompt = f"""
You are an expert technical interviewer.

Generate ONE descriptive technical interview question.

TARGET ROLE:
{job_role}

CANDIDATE TYPE:
{candidate_type}

EXPERIENCE:
{experience_years}

EXPERIENCE ROLE:
{experience_role}

CANDIDATE SKILLS:
{", ".join(candidate_skills)}

MISSING SKILLS:
{", ".join(missing_skills) if missing_skills else "None"}

REQUESTED DIFFICULTY:
{difficulty}

REQUESTED QUESTION TYPE:
Descriptive

CONTROLLED TOPIC AND CONCEPT TAXONOMY:

{taxonomy_text}

{focus_instruction}


DIFFICULTY:

EASY:
Fundamentals and straightforward explanations.

MEDIUM:
Practical application and scenario-based reasoning.

HARD:
Advanced reasoning, debugging, optimization,
architecture, trade-offs, deployment or scalability
when relevant.


RULES:

1. Generate exactly one question.
2. Match the requested difficulty.
3. Match the candidate's experience.
4. Prefer practical questions.
5. Do not assume production experience from freshers.
6. The topic MUST exactly match one topic in the taxonomy.
7. The concept MUST exactly match one concept belonging to that topic.
8. Do not invent a topic.
9. Do not invent a concept.
10. Do not provide the answer.

Return ONLY valid JSON:

{{
    "type": "Descriptive",
    "topic": "Statistics",
    "concept": "Hypothesis Testing",
    "difficulty": "{difficulty}",
    "question": "Question text"
}}
"""


    # ==================================================
    # CALL GEMINI
    # ==================================================

    response = _generate_content(prompt)


    response_text = response.text.strip()


    # ==================================================
    # CLEAN MARKDOWN
    # ==================================================

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


    # ==================================================
    # PARSE JSON
    # ==================================================

    try:

        question_data = json.loads(
            response_text
        )

    except json.JSONDecodeError as error:

        raise ValueError(
            "Gemini returned invalid JSON:\n"
            f"{response_text}"
        ) from error


    # ==================================================
    # VALIDATE BASIC FIELDS
    # ==================================================

    required_fields = [
        "type",
        "topic",
        "concept",
        "difficulty",
        "question"
    ]


    for field in required_fields:

        if field not in question_data:

            raise ValueError(
                f"Gemini response is missing: {field}"
            )


    # ==================================================
    # VALIDATE TOPIC
    # ==================================================

    topic = question_data["topic"]


    if topic not in CONCEPT_TAXONOMY:

        raise ValueError(
            f"Invalid topic returned by Gemini: {topic}"
        )


    # ==================================================
    # VALIDATE CONCEPT
    # ==================================================

    concept = question_data["concept"]


    valid_concepts = (
        CONCEPT_TAXONOMY[topic]
    )


    if concept not in valid_concepts:

        raise ValueError(
            f"Invalid concept '{concept}' "
            f"for topic '{topic}'."
        )


    # ==================================================
    # FORCE DIFFICULTY
    # ==================================================

    question_data["difficulty"] = difficulty


    # ==================================================
    # VALIDATE MCQ
    # ==================================================

    if question_data["type"] == "MCQ":

        if "options" not in question_data:

            raise ValueError(
                "MCQ is missing options."
            )


        if len(
            question_data["options"]
        ) != 4:

            raise ValueError(
                "MCQ must contain exactly 4 options."
            )


        if "correct_answer" not in question_data:

            raise ValueError(
                "MCQ is missing correct_answer."
            )


        if "explanation" not in question_data:

            raise ValueError(
                "MCQ is missing explanation."
            )


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