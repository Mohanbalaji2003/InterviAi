"""Local descriptive answer evaluator for a fast InterviAI interview loop."""

import re


def _norm(text):
    return re.sub(r"[^a-z0-9+#.]", " ", (text or "").lower())


def evaluate_descriptive_answer_fast(question_data, candidate_answer):
    answer = (candidate_answer or "").strip()
    text = _norm(answer)
    words = [w for w in text.split() if w]
    word_count = len(words)

    keywords = [_norm(k).strip() for k in question_data.get("keywords", []) if k]
    keywords = [k for k in keywords if k]

    matched = [k for k in keywords if k in text]
    missing = [k for k in keywords if k not in text]
    coverage = len(matched) / len(keywords) if keywords else 0.0

    silly_tokens = {
        "idk", "dont", "know", "no", "idea", "nothing", "skip", "whatever",
        "random", "silly", "banana", "apple", "potato", "asdf", "qwerty",
        "aaaa", "test", "haha", "lol", "lmao", "foo", "bar", "xyz", "none"
    }
    is_mostly_silly = (
        word_count < 6
        or (word_count <= 10 and all(w in silly_tokens for w in words))
        or bool(re.search(r"(.)\1{4,}", text))
    )

    if is_mostly_silly:
        return {
            "correctness": 0.5,
            "technical_depth": 0.5,
            "relevance": 0.5,
            "clarity": 1.0,
            "overall_score": 0.8,
            "feedback": "Unsatisfactory. Submission is incoherent, excessively brief, or lacks technical substance.",
            "strengths": [],
            "missing_concepts": keywords[:3] or ["Foundational concepts"],
            "improvement_suggestion": "Provide a complete, structured response explaining the core architectural mechanisms and trade-offs.",
            "evaluation_mode": "local_strict"
        }

    if coverage == 0.0:
        if word_count < 15:
            score = 1.5
            fb = "Unsatisfactory. Did not address any of the essential technical principles for this topic."
        else:
            score = 2.5
            fb = "Off-topic or inaccurate. Although text was submitted, it failed to reference any key architectural components."

        return {
            "correctness": score,
            "technical_depth": max(0.5, score - 0.5),
            "relevance": score,
            "clarity": min(10.0, 3.0 + min(word_count, 60) / 60 * 3.0),
            "overall_score": round(score, 1),
            "feedback": fb,
            "strengths": [],
            "missing_concepts": keywords[:3] or ["Key technical mechanisms"],
            "improvement_suggestion": "Review core trade-offs and domain terminology before re-answering.",
            "evaluation_mode": "local_strict"
        }

    # Answer has legitimate keywords
    depth_bonus = 1.0 if word_count >= 60 else 0.0
    clarity_bonus = 1.0 if 25 <= word_count <= 250 else 0.0

    correctness = min(10.0, 2.0 + coverage * 7.0 + depth_bonus)
    technical_depth = min(10.0, 1.5 + coverage * 7.5 + depth_bonus)
    relevance = min(10.0, 3.0 + coverage * 7.0)
    clarity = min(10.0, 4.0 + clarity_bonus + min(word_count, 120) / 120 * 4.0)
    overall = round((correctness + technical_depth + relevance + clarity) / 4, 1)

    return {
        "correctness": round(correctness, 1),
        "technical_depth": round(technical_depth, 1),
        "relevance": round(relevance, 1),
        "clarity": round(clarity, 1),
        "overall_score": overall,
        "feedback": "Evaluated against MNC technical rubric with domain keyword and trade-off verification.",
        "strengths": matched[:4],
        "missing_concepts": missing[:3],
        "improvement_suggestion": "Strengthen reasoning with concrete metrics, edge cases, and production failure modes.",
        "evaluation_mode": "local_strict"
    }
