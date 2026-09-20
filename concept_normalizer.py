"""Normalize Gemini-generated knowledge-gap phrases to the controlled taxonomy."""

from difflib import SequenceMatcher

from concept_taxonomy import CONCEPT_TAXONOMY


def _clean(text: str) -> str:
    if not isinstance(text, str):
        return ""
    return " ".join(text.strip().lower().replace("_", " ").replace("-", " ").split())


ALIASES = {
    "joins": "JOINs",
    "join": "JOINs",
    "sql joins": "JOINs",
    "group by clause": "GROUP BY",
    "having clause": "HAVING",
    "cte": "CTEs",
    "common table expressions": "CTEs",
    "window function": "Window Functions",
    "window functions": "Window Functions",
    "ooad": "Object-Oriented Programming",
    "oop": "Object-Oriented Programming",
    "exception handling in python": "Exception Handling",
    "cross validation": "Cross Validation",
    "cross-validation": "Cross Validation",
    "cnn": "CNN",
    "convolutional neural networks": "CNN",
    "rnn": "RNN",
    "recurrent neural networks": "RNN",
    "long short term memory": "LSTM",
    "long short-term memory": "LSTM",
    "tf idf": "TF-IDF",
    "tf-idf": "TF-IDF",
    "large language models": "LLMs",
    "large language model": "LLMs",
    "vector database": "Vector Databases",
    "vector databases": "Vector Databases",
    "prompt injection attacks": "Prompt Injection",
    "time complexity analysis": "Time Complexity",
    "space complexity analysis": "Space Complexity",
}


def _candidates(topic=None):
    if topic and topic in CONCEPT_TAXONOMY:
        return list(CONCEPT_TAXONOMY[topic])

    all_concepts = []
    for concepts in CONCEPT_TAXONOMY.values():
        all_concepts.extend(concepts)
    return all_concepts


def normalize_concept(value, topic=None):
    if not isinstance(value, str) or not value.strip():
        return None

    cleaned = _clean(value)

    # Exact canonical match.
    for concept in _candidates(topic):
        if _clean(concept) == cleaned:
            return concept

    # Explicit aliases.
    if cleaned in ALIASES:
        alias = ALIASES[cleaned]
        if alias in _candidates(topic):
            return alias

    # Fuzzy match for small wording differences.
    best = None
    best_ratio = 0.0
    for concept in _candidates(topic):
        ratio = SequenceMatcher(None, cleaned, _clean(concept)).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best = concept

    if best and best_ratio >= 0.78:
        return best

    return None


def normalize_concepts(values, topic=None, fallback=None):
    if not isinstance(values, list):
        values = [values] if values else []

    normalized = []
    for value in values:
        concept = normalize_concept(value, topic=topic)
        if concept and concept not in normalized:
            normalized.append(concept)

    # For an incorrect MCQ / low-scoring answer, the tested concept is a
    # reliable fallback when Gemini returns nothing useful.
    if not normalized and fallback:
        fallback_concept = normalize_concept(fallback, topic=topic)
        if fallback_concept:
            normalized.append(fallback_concept)

    return normalized
