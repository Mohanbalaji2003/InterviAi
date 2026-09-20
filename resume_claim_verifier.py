
"""
Local resume-claim extraction and project-evidence verification.

No Gemini call is required. This keeps the feature fast and makes it
usable even during temporary API outages.

Verification labels:
- Supported: strong lexical/semantic overlap with project evidence.
- Partially Supported: some evidence overlaps, but the claim is not fully grounded.
- Unverified: no sufficiently relevant project evidence was found.

Important: this module does not claim that an unverified statement is false.
"""

import re
from collections import OrderedDict
from typing import Dict, List


def _clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def extract_resume_claims(resume_text: str, max_claims: int = 12) -> List[str]:
    """
    Extract likely achievement/technology/project claims from a resume.

    This is intentionally deterministic for the MVP. It favors bullet-like
    lines and sentences containing project/technical action language.
    """
    raw_lines = [line.strip() for line in (resume_text or "").splitlines()]
    candidates = []

    action_terms = (
        "built", "developed", "created", "implemented", "designed",
        "trained", "deployed", "achieved", "improved", "automated",
        "analyzed", "predicted", "integrated", "using", "used",
        "worked", "developed", "engineered", "optimized", "led",
    )

    metric_pattern = re.compile(
        r"\b\d+(?:\.\d+)?\s*%|\b\d+(?:\.\d+)?\s*(?:accuracy|f1|precision|recall|years?)\b",
        re.I,
    )

    for line in raw_lines:
        line = re.sub(r"^[•●▪◦\-\*]+\s*", "", line)
        line = _clean_text(line)

        if len(line) < 25 or len(line) > 350:
            continue

        low = line.lower()
        has_action = any(term in low for term in action_terms)
        has_metric = bool(metric_pattern.search(line))
        has_tech = any(
            tech in low
            for tech in (
                "python", "sql", "tensorflow", "pytorch", "scikit-learn",
                "random forest", "cnn", "machine learning", "deep learning",
                "streamlit", "fastapi", "docker", "power bi", "pandas",
                "numpy", "opencv", "nlp", "rag", "api", "postgresql",
            )
        )

        if has_action or has_metric or has_tech:
            candidates.append(line)

    # Fallback: sentence-based extraction if bullets didn't work.
    if not candidates:
        sentences = re.split(r"(?<=[.!?])\s+", _clean_text(resume_text))
        for sentence in sentences:
            if 30 <= len(sentence) <= 350:
                low = sentence.lower()
                if any(term in low for term in action_terms):
                    candidates.append(sentence)

    # De-duplicate while preserving order.
    unique = list(OrderedDict.fromkeys(candidates))
    return unique[:max_claims]


def verify_claims(
    claims: List[str],
    rag,
    support_threshold: float = 0.20,
    partial_threshold: float = 0.08,
) -> List[Dict]:
    """
    Verify each resume claim against project evidence using the existing
    local TF-IDF retrieval index.
    """
    results = []

    for claim in claims:
        evidence = rag.retrieve(claim, top_k=3)

        best = evidence[0] if evidence else None
        score = float(best["score"]) if best else 0.0

        if score >= support_threshold:
            status = "Supported"
        elif score >= partial_threshold:
            status = "Partially Supported"
        else:
            status = "Unverified"

        results.append(
            {
                "claim": claim,
                "status": status,
                "match_score": round(score, 4),
                "evidence": best["text"][:700] if best else "",
                "source": best["source"] if best else "",
            }
        )

    return results


def get_claim_summary(results: List[Dict]) -> Dict:
    counts = {
        "Supported": 0,
        "Partially Supported": 0,
        "Unverified": 0,
    }

    for item in results:
        status = item["status"]
        counts[status] = counts.get(status, 0) + 1

    total = len(results)
    supported = counts["Supported"]
    partial = counts["Partially Supported"]

    confidence = (
        ((supported + 0.5 * partial) / total) * 100
        if total else 0.0
    )

    return {
        "total_claims": total,
        "supported": supported,
        "partially_supported": partial,
        "unverified": counts["Unverified"],
        "verification_confidence": round(confidence, 1),
    }
