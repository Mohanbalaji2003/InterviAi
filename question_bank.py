import json

from gemini_service import build_taxonomy_text, _generate_content
from concept_taxonomy import CONCEPT_TAXONOMY


def _clean_json(text):
    text = (text or "").strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def _validate_question(q, difficulty=None):
    required = ["type", "topic", "concept", "difficulty", "question"]
    for field in required:
        if field not in q:
            raise ValueError(f"Question missing field: {field}")

    if q["type"] not in {"MCQ", "Descriptive"}:
        raise ValueError(f"Invalid question type: {q['type']}")

    topic = q["topic"]
    concept = q["concept"]
    if topic not in CONCEPT_TAXONOMY:
        raise ValueError(f"Invalid topic: {topic}")
    if concept not in CONCEPT_TAXONOMY[topic]:
        raise ValueError(f"Invalid concept '{concept}' for topic '{topic}'")

    if q["type"] == "MCQ":
        if len(q.get("options", [])) != 4:
            raise ValueError("MCQ must contain exactly 4 options")
        if not q.get("correct_answer"):
            raise ValueError("MCQ missing correct_answer")
        if not q.get("explanation"):
            raise ValueError("MCQ missing explanation")

    if difficulty:
        q["difficulty"] = difficulty
    return q


def generate_question_bank(
    job_role,
    candidate_skills,
    missing_skills,
    candidate_type,
    experience_years,
    experience_role,
    total_questions,
):
    """Generate a larger mixed bank once, so the interview can run mostly locally."""
    bank_size = max(total_questions + 3, 12)
    if total_questions >= 15:
        bank_size = 20

    taxonomy = build_taxonomy_text()

    prompt = f"""
You are designing a high-quality technical interview question bank for an adaptive interview system.

TARGET ROLE: {job_role}
CANDIDATE TYPE: {candidate_type}
EXPERIENCE: {experience_years}
EXPERIENCE ROLE: {experience_role}
CANDIDATE SKILLS: {", ".join(candidate_skills) if candidate_skills else "None"}
MISSING SKILLS: {", ".join(missing_skills) if missing_skills else "None"}

Generate EXACTLY {bank_size} UNIQUE questions.
The bank will be used locally during an adaptive interview, so provide a useful mixture:
- roughly half MCQ and half Descriptive
- a mixture of Easy, Medium, and Hard
- broad topic coverage relevant to the target role
- avoid near-duplicate questions
- practical interview-style questions, not trivia
- Easy: fundamentals
- Medium: application/scenarios
- Hard: reasoning, debugging, optimization, architecture or trade-offs when relevant
- fresher questions must not assume production experience

CONTROLLED TAXONOMY:
{taxonomy}

STRICT RULES:
1. Every topic must exactly match a taxonomy topic.
2. Every concept must exactly match a concept under that topic.
3. MCQs have exactly four options and one correct answer.
4. Descriptive questions must not include an answer.
5. Each question must have a difficulty of Easy, Medium, or Hard.
6. Return ONLY valid JSON. No markdown.

Return:
{{
  "questions": [
    {{
      "type": "MCQ",
      "topic": "Machine Learning",
      "concept": "Overfitting",
      "difficulty": "Medium",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "Why A is correct"
    }},
    {{
      "type": "Descriptive",
      "topic": "SQL",
      "concept": "JOINs",
      "difficulty": "Hard",
      "question": "Question text"
    }}
  ]
}}
"""

    response = _generate_content(prompt)
    raw = _clean_json(response.text)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Gemini returned invalid question bank JSON:\n{raw}") from exc

    questions = data.get("questions")
    if not isinstance(questions, list) or not questions:
        raise ValueError("Gemini returned an empty question bank")

    validated = []
    seen = set()
    for question in questions:
        q = _validate_question(question)
        key = q["question"].strip().lower()
        if key in seen:
            continue
        seen.add(key)
        validated.append(q)

    if len(validated) < total_questions:
        raise ValueError(
            f"Question bank contains only {len(validated)} usable questions; "
            f"need at least {total_questions}."
        )

    return validated
