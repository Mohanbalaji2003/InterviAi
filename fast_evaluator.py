"""Local descriptive answer evaluator for a fast InterviAI interview loop."""

import re


def _norm(text):
    return re.sub(r"[^a-z0-9+#.]", " ", (text or "").lower())


def evaluate_descriptive_answer_fast(question_data, candidate_answer):
    answer = (candidate_answer or "").strip()
    text = _norm(answer)
    keywords = [_norm(k).strip() for k in question_data.get("keywords", []) if k]
    keywords = [k for k in keywords if k]

    matched = [k for k in keywords if k in text]
    coverage = len(matched) / len(keywords) if keywords else 0.0

    # Reward useful technical detail without pretending keyword matching is a human grader.
    word_count = len(answer.split())
    depth_bonus = 1 if word_count >= 70 else 0
    clarity_bonus = 1 if 20 <= word_count <= 250 else 0

    correctness = min(10.0, 3.0 + coverage * 6.0 + depth_bonus)
    technical_depth = min(10.0, 2.5 + coverage * 6.5 + depth_bonus)
    relevance = min(10.0, 5.0 + coverage * 5.0)
    clarity = min(10.0, 6.0 + clarity_bonus + min(word_count, 120) / 120 * 3.0)
    overall = round((correctness + technical_depth + relevance + clarity) / 4, 1)

    missing = [k for k in keywords if k not in text]

    return {
        "correctness": round(correctness, 1),
        "technical_depth": round(technical_depth, 1),
        "relevance": round(relevance, 1),
        "clarity": round(clarity, 1),
        "overall_score": overall,
        "feedback": "Local adaptive scoring used during the live interview.",
        "strengths": matched[:4],
        "missing_concepts": missing[:3],
        "improvement_suggestion": "Strengthen the missing technical points and explain the reasoning with a concrete example.",
        "evaluation_mode": "local_fast"
    }
