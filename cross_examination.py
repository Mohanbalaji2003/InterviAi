"""
Resume Claim Cross-Examination Engine.

Creates fast, deterministic follow-up questions from claims that are
partially supported or unverified against project evidence.

No LLM call is required during the interview.
"""

import re
from typing import Dict, List


def _keywords(text: str) -> List[str]:
    words = re.findall(r"[A-Za-z][A-Za-z0-9+#.-]{2,}", text.lower())
    stop = {
        "the", "and", "for", "with", "using", "used", "from", "this",
        "that", "into", "have", "has", "was", "were", "built", "developed",
        "implemented", "created", "project", "system",
    }
    seen = []
    for word in words:
        if word not in stop and word not in seen:
            seen.append(word)
    return seen[:8]


def build_cross_examination_bank(
    verification_results: List[Dict],
    count: int = 4,
) -> List[Dict]:
    """
    Turn uncertain resume claims into evidence-based challenge questions.

    The questions ask the candidate to substantiate, explain, or reproduce
    the claim; they do not assert that an unverified claim is false.
    """
    bank = []

    priority = [
        item for item in verification_results
        if item.get("status") in {"Partially Supported", "Unverified"}
    ]

    if not priority:
        priority = [
            item for item in verification_results
            if item.get("status") == "Supported"
        ]

    for item in priority:
        claim = item.get("claim", "").strip()
        if not claim:
            continue

        status = item.get("status", "Unverified")
        evidence = item.get("evidence", "").strip()
        keywords = _keywords(claim)

        if status == "Unverified":
            question = (
                "Your resume states: "
                f"“{claim}” "
                "Can you walk through exactly what you personally implemented, "
                "including the key technical steps and decisions?"
            )
            difficulty = "Hard"
            concept = "Resume Ownership"
        else:
            question = (
                "Your resume states: "
                f"“{claim}” "
                "Explain how this was implemented in the project and point to "
                "the evidence or result that demonstrates the claim."
            )
            difficulty = "Medium"
            concept = "Resume Evidence"

        bank.append(
            {
                "type": "Descriptive",
                "topic": "Resume Cross-Examination",
                "concept": concept,
                "difficulty": difficulty,
                "question": question,
                "keywords": keywords + [
                    "implementation",
                    "evidence",
                    "personal contribution",
                ],
                "evidence": evidence[:500],
                "claim_status": status,
                "claim": claim,
            }
        )

        if len(bank) >= count:
            break

    return bank
