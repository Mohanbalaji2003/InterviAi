"""
Project Defense RAG for InterviAI.

MVP architecture:
1. Extract text from uploaded project files.
2. Chunk the text.
3. Build a local TF-IDF retrieval index.
4. Retrieve project evidence for interview themes.
5. Use ONE Gemini call to generate a small grounded project-defense bank.
6. Serve those questions locally during the interview.

This keeps retrieval fast and limits expensive LLM calls.
"""

import json
import os
import re
from pathlib import Path
from dataclasses import dataclass
from typing import List, Dict, Tuple

import fitz
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from dotenv import load_dotenv
from google import genai


@dataclass
class ProjectChunk:
    chunk_id: int
    text: str
    source: str


class ProjectDefenseRAG:
    def __init__(self, max_chunk_chars: int = 1400, overlap: int = 200):
        self.max_chunk_chars = max_chunk_chars
        self.overlap = overlap
        self.chunks: List[ProjectChunk] = []
        self.vectorizer = None
        self.matrix = None

    def add_text(self, text: str, source: str):
        text = re.sub(r"\s+", " ", text or "").strip()
        if not text:
            return

        start = 0
        chunk_id = len(self.chunks)

        while start < len(text):
            end = min(len(text), start + self.max_chunk_chars)
            chunk = text[start:end].strip()

            if chunk:
                self.chunks.append(
                    ProjectChunk(
                        chunk_id=chunk_id,
                        text=chunk,
                        source=source,
                    )
                )
                chunk_id += 1

            if end >= len(text):
                break

            start = max(end - self.overlap, start + 1)

    def build_index(self):
        if not self.chunks:
            raise ValueError("No project content was extracted.")

        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            max_features=8000,
        )
        self.matrix = self.vectorizer.fit_transform(
            [chunk.text for chunk in self.chunks]
        )

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict]:
        if self.matrix is None:
            self.build_index()

        query_vector = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vector, self.matrix)[0]

        ranked = sorted(
            enumerate(scores),
            key=lambda item: item[1],
            reverse=True,
        )[:top_k]

        results = []
        for index, score in ranked:
            chunk = self.chunks[index]
            results.append(
                {
                    "score": round(float(score), 4),
                    "text": chunk.text,
                    "source": chunk.source,
                    "chunk_id": chunk.chunk_id,
                }
            )

        return results

    def build_theme_contexts(self) -> Dict[str, List[Dict]]:
        themes = {
            "project_overview": "project goal problem statement system purpose",
            "architecture": "architecture pipeline components backend frontend database API model",
            "data": "dataset data collection preprocessing cleaning features labels split",
            "model": "model algorithm training hyperparameter optimization why chosen",
            "evaluation": "accuracy precision recall F1 validation test results limitations",
            "deployment": "deployment production API Docker cloud scalability monitoring",
        }

        return {
            theme: self.retrieve(query, top_k=3)
            for theme, query in themes.items()
        }


def extract_project_text(uploaded_files) -> str:
    """Extract text from PDF, TXT, MD, PY, JSON and CSV uploads."""
    text_parts = []

    for uploaded_file in uploaded_files:
        name = uploaded_file.name
        suffix = Path(name).suffix.lower()

        if suffix == ".pdf":
            pdf = fitz.open(
                stream=uploaded_file.getvalue(),
                filetype="pdf",
            )
            pages = []
            for page in pdf:
                pages.append(page.get_text())
            text_parts.append(f"FILE: {name}\n" + "\n".join(pages))
            pdf.close()

        elif suffix in {".txt", ".md", ".py", ".json", ".csv"}:
            raw = uploaded_file.getvalue()
            text_parts.append(
                f"FILE: {name}\n" +
                raw.decode("utf-8", errors="ignore")
            )

    combined = "\n\n".join(text_parts).strip()

    if not combined:
        raise ValueError(
            "No readable text found. Upload a PDF, README, TXT, MD, PY, JSON or CSV."
        )

    return combined


def _clean_json(text: str) -> str:
    text = (text or "").strip()

    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]

    if text.endswith("```"):
        text = text[:-3]

    return text.strip()


def generate_project_defense_bank(
    rag: ProjectDefenseRAG,
    job_role: str,
    candidate_skills: List[str],
    count: int = 6,
) -> List[Dict]:
    """
    Generate a small project-defense bank in ONE Gemini call.

    Each generated question includes retrieval evidence and keywords so
    the live answer loop can remain local/fast.
    """
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set.")

    client = genai.Client(api_key=api_key)
    theme_contexts = rag.build_theme_contexts()

    context_blocks = []
    for theme, results in theme_contexts.items():
        context_blocks.append(f"\nTHEME: {theme}")
        for result in results:
            context_blocks.append(
                f"\nSOURCE: {result['source']}\n"
                f"EVIDENCE: {result['text']}"
            )

    context_text = "\n".join(context_blocks)

    prompt = f"""
You are a senior technical interviewer conducting a project-defense interview.

TARGET ROLE:
{job_role}

CANDIDATE SKILLS:
{", ".join(candidate_skills)}

Create exactly {count} project-defense questions grounded ONLY in the supplied project evidence.

The questions should test whether the candidate genuinely understands their own work.

Cover a range of themes:
- project purpose
- architecture/design
- data
- model/algorithm choices
- evaluation/results
- limitations/deployment/trade-offs

Avoid generic textbook questions unless directly tied to the project.
Do not invent technologies, metrics, datasets, architecture components, or results.
Do not reveal the answer.

For each question return:
- theme
- question
- difficulty
- keywords: 4-8 concise answer concepts useful for lightweight local evaluation
- evidence: 1 short source-grounded reason for why the question was asked

Return ONLY JSON as:
{{
  "questions": [
    {{
      "theme": "architecture",
      "question": "...",
      "difficulty": "Medium",
      "keywords": ["..."],
      "evidence": "..."
    }}
  ]
}}

PROJECT EVIDENCE:
{context_text}
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
        )

        data = json.loads(_clean_json(response.text))
        questions = data.get("questions", [])

        if not isinstance(questions, list) or not questions:
            raise ValueError("Gemini returned an empty project-defense bank.")

        normalized = []
        for item in questions:
            if not item.get("question"):
                continue
            normalized.append(
                {
                    "type": "Descriptive",
                    "topic": "Project Defense",
                    "concept": item.get("theme", "Project Understanding"),
                    "difficulty": item.get("difficulty", "Medium"),
                    "question": item["question"],
                    "keywords": item.get("keywords", []),
                    "evidence": item.get("evidence", ""),
                }
            )

        if normalized:
            return normalized

        raise ValueError("Gemini returned no usable project-defense questions.")

    except Exception:
        # Important reliability path:
        # the local RAG index is still useful even when Gemini is temporarily
        # unavailable (for example HTTP 503 high-demand errors).
        return build_local_project_defense_bank(
            rag=rag,
            job_role=job_role,
            count=count,
        )


def build_local_project_defense_bank(
    rag: ProjectDefenseRAG,
    job_role: str,
    count: int = 6,
) -> List[Dict]:
    """
    Deterministic fallback that creates project-defense questions from
    retrieved evidence without making any API call.

    This guarantees that "Build Project Knowledge" can succeed even when
    the LLM provider is temporarily unavailable.
    """
    themes = [
        (
            "project_overview",
            "Easy",
            "Based on your project documentation, what problem is the project designed to solve?",
            ["problem", "goal", "objective", "purpose"],
        ),
        (
            "architecture",
            "Medium",
            "Walk through the architecture or end-to-end workflow of your project and explain why the main components are connected this way.",
            ["architecture", "workflow", "component", "pipeline"],
        ),
        (
            "data",
            "Medium",
            "Explain the dataset or input data used in your project, including the important preprocessing or preparation steps.",
            ["dataset", "data", "preprocessing", "feature", "input"],
        ),
        (
            "model",
            "Medium",
            "Which model or algorithm does your project use, and why was that approach appropriate for this problem?",
            ["model", "algorithm", "random forest", "cnn", "classifier"],
        ),
        (
            "evaluation",
            "Hard",
            "How did you evaluate your project, and what result or metric from the documentation is most important?",
            ["accuracy", "precision", "recall", "f1", "evaluation", "metric"],
        ),
        (
            "limitations",
            "Hard",
            "What is a significant limitation of the current system, and what would you change before deploying it in a real-world environment?",
            ["limitation", "deployment", "production", "scalability", "improvement"],
        ),
    ]

    generated = []

    for theme, difficulty, question, keywords in themes:
        evidence = rag.retrieve(theme.replace("_", " "), top_k=1)

        evidence_text = evidence[0]["text"] if evidence else ""
        source = evidence[0]["source"] if evidence else "uploaded project"

        # Keep the question generic enough to be valid, but attach real retrieved
        # evidence so the live question is grounded in the candidate's material.
        generated.append(
            {
                "type": "Descriptive",
                "topic": "Project Defense",
                "concept": theme,
                "difficulty": difficulty,
                "question": question,
                "keywords": keywords,
                "evidence": (
                    f"Retrieved from {source}: {evidence_text[:500]}"
                    if evidence_text
                    else f"Grounded in the uploaded {source}."
                ),
                "fallback_mode": True,
                "job_role": job_role,
            }
        )

        if len(generated) >= count:
            break

    return generated
