import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Skip header and footer on cover page

        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#718096"))

        # Running Top Header
        self.drawString(36, 762, "INTERVIAI | TECHNICAL ARCHITECTURE & PROJECT DEFENSE REPORT")
        self.setFont("Helvetica", 8)
        self.drawRightString(576, 762, "INTERVIEW PREPARATION DOSSIER")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.75)
        self.line(36, 756, 576, 756)

        # Running Bottom Footer
        self.line(36, 42, 576, 42)
        self.setFont("Helvetica", 8)
        self.drawString(36, 30, "Confidential - Prepared for Technical Interviews & Project Defense")
        self.drawRightString(576, 30, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def create_report(output_filename="InterviAI_Technical_Project_Report.pdf"):
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    # Define custom high-polish styles
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=26,
        leading=32,
        textColor=colors.HexColor("#1A202C")
    )

    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=18,
        textColor=colors.HexColor("#4A5568")
    )

    h1_style = ParagraphStyle(
        "SectionH1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=20,
        textColor=colors.HexColor("#4C1D95"),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        "SectionH2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor("#2D3748"),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        "BulletText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=13,
        textColor=colors.HexColor("#2D3748"),
        leftIndent=12,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        "CodeBlock",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#0F172A"),
        backColor=colors.HexColor("#F1F5F9"),
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=6
    )

    callout_style = ParagraphStyle(
        "CalloutText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#1E293B")
    )

    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#2D3748")
    )

    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#1A202C")
    )

    story = []

    # =========================================================================
    # COVER / HEADER BLOCK
    # =========================================================================
    story.append(Spacer(1, 15))
    story.append(Paragraph("INTERVIAI &bull; SYSTEM ARCHITECTURE REPORT", ParagraphStyle("Meta", fontName="Helvetica-Bold", fontSize=9, textColor=colors.HexColor("#7C3AED"), leading=12)))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Adaptive AI Interview & Candidate Intelligence Platform", title_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Deep Technical Dossier: Large Language Models, Local RAG, FastAPI Architecture, Python Algorithmic Engines, and Relational Database Schemas for Technical Interview Defense", subtitle_style))
    story.append(Spacer(1, 10))

    meta_table_data = [
        [
            Paragraph("<b>Author / Candidate:</b> Mohan Balaji", body_style),
            Paragraph("<b>Target Roles:</b> Data Scientist, ML / AI Engineer, Full Stack", body_style),
        ],
        [
            Paragraph("<b>Core Stack:</b> Gemini 3.6 Flash &bull; TF-IDF RAG &bull; FastAPI &bull; PostgreSQL", body_style),
            Paragraph("<b>Frontend:</b> Next.js 16 App Router &bull; TypeScript &bull; WebRTC/Media", body_style),
        ],
        [
            Paragraph("<b>Date:</b> November 2026", body_style),
            Paragraph("<b>Status:</b> Production Ready & Deployed (intervi-ai-theta.vercel.app)", body_style),
        ]
    ]
    meta_table = Table(meta_table_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#E2E8F0")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#7C3AED"), spaceBefore=4, spaceAfter=12))

    # =========================================================================
    # SECTION 1: EXECUTIVE SUMMARY & HIGH-LEVEL ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("1. Executive Summary & System Topology", h1_style))
    story.append(Paragraph(
        "<b>InterviAI</b> is an enterprise-grade candidate assessment platform designed to eliminate static question banks and subjective interview grading. It unifies adaptive dynamic questioning, local document retrieval for project defense, deterministic resume claim extraction, multimodal live video assessment, and multi-factor candidate intelligence scoring into an integrated platform.",
        body_style
    ))

    arch_table_data = [
        [Paragraph("Layer", table_header_style), Paragraph("Component", table_header_style), Paragraph("Implementation Details & Technologies", table_header_style)],
        [Paragraph("Client / UI", table_cell_bold), Paragraph("Next.js 16 App Router", table_cell_style), Paragraph("TypeScript, Tailwind CSS, MediaDevices (Webcam/Audio), SpeechRecognition API, Web Audio API VU Meter, client-side session fallbacks.", table_cell_style)],
        [Paragraph("API Gateway", table_cell_bold), Paragraph("FastAPI (Async Python)", table_cell_style), Paragraph("Uvicorn ASGI, RESTful JSON endpoints, Pydantic v2 data validation, CORS middleware, token & cookie session auth, streaming responses.", table_cell_style)],
        [Paragraph("Intelligence", table_cell_bold), Paragraph("Adaptive Engine & Taxonomy", table_cell_style), Paragraph("Dynamic Markov-style difficulty state machine, concept normalizer (30+ topics), fast heuristic rubric evaluator, multi-factor intelligence engine.", table_cell_style)],
        [Paragraph("AI / LLM", table_cell_bold), Paragraph("Google GenAI (Gemini)", table_cell_style), Paragraph("Gemini 3.6 Flash with exponential retry backoff, few-shot prompting, structured JSON schema response enforcement, project defense generation.", table_cell_style)],
        [Paragraph("RAG Engine", table_cell_bold), Paragraph("Project Defense RAG", table_cell_style), Paragraph("PyMuPDF (fitz) extraction, sliding window chunking (1400 chars, 200 overlap), bi-gram TF-IDF vector space, cosine similarity ranking.", table_cell_style)],
        [Paragraph("Verification", table_cell_bold), Paragraph("Resume Claim Verifier", table_cell_style), Paragraph("Deterministic regex & action-term parser, lexical/semantic overlap scoring against RAG evidence, tiered claim verdicts (Supported / Partial / Unverified).", table_cell_style)],
        [Paragraph("Database", table_cell_bold), Paragraph("SQLAlchemy ORM + Fallback", table_cell_style), Paragraph("PostgreSQL primary with connection pre-ping; runtime automatic fallback to SQLite (interviai.db) ensuring zero-downtime availability.", table_cell_style)],
    ]
    t_arch = Table(arch_table_data, colWidths=[70, 110, 360])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#4C1D95")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 2: LLM (LARGE LANGUAGE MODEL) ENGINEERING
    # =========================================================================
    story.append(Paragraph("2. Large Language Model (LLM) Engineering", h1_style))
    story.append(Paragraph(
        "<b>Model Choice & Integration:</b> InterviAI integrates Google's GenAI SDK using <code>gemini-3.6-flash</code>. This model was chosen because technical interview platforms require sub-second generation latency, high structural compliance for JSON decoding, and reliable long-context reasoning over candidate project files without incurring exorbitant cloud costs.",
        body_style
    ))
    story.append(Paragraph("Key LLM Design Patterns Implemented in <code>gemini_service.py</code>:", h2_style))
    story.append(Paragraph("<b>1. Resilient Retry Handler (<code>_generate_content</code>):</b> Implements exponential backoff to handle transient network spikes, 429 rate limits, and 503 gateway timeouts gracefully:", bullet_style))
    story.append(Paragraph(
"""def _generate_content(prompt, retries=2):
    for attempt in range(retries + 1):
        try:
            return client.models.generate_content(model="gemini-3.6-flash", contents=prompt)
        except Exception as error:
            if any(t in str(error).lower() for t in ["503", "429", "timeout"]) and attempt < retries:
                time.sleep(1.5 * (attempt + 1))
            else: raise""",
        code_style
    ))
    story.append(Paragraph("<b>2. Strict JSON Schema Formatting:</b> LLMs inherently output markdown code blocks (<code>```json ... ```</code>). InterviAI employs regex clean-up stripping code fences before feeding text to <code>json.loads()</code>, guaranteeing runtime stability.", bullet_style))
    story.append(Paragraph("<b>3. Rubric-Based Descriptive Answer Evaluation:</b> Rather than naive string matching, descriptive questions are evaluated across 4 orthogonal dimensions: Technical Correctness (0-4 pts), Architectural Depth & Trade-offs (0-3 pts), STAR Delivery / Communication (0-2 pts), and Technical Keyword Grounding (0-1 pt).", bullet_style))
    story.append(Paragraph("<b>4. Dual-Tier Hybrid Latency Guardrail (<code>fast_evaluator.py</code>):</b> To protect against API rate limits or offline conditions, descriptive evaluations first pass through an instant, deterministic heuristic evaluator that measures token length, concept coverage, syntax depth, and gibberish rejection in under <b>2ms</b> before invoking cloud LLMs.", bullet_style))
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 3: RAG (RETRIEVAL-AUGMENTED GENERATION) & EVIDENCE ENGINE
    # =========================================================================
    story.append(Paragraph("3. Retrieval-Augmented Generation (RAG) & Evidence Grounding", h1_style))
    story.append(Paragraph(
        "InterviAI features a localized, high-velocity RAG pipeline in <code>project_defense_rag.py</code> and <code>resume_claim_verifier.py</code>. It is engineered to allow candidates to upload real project source code, PDF architecture documentation, or READMEs, extracting ground-truth technical evidence to cross-examine their claims.",
        body_style
    ))

    rag_steps = [
        [Paragraph("Step", table_header_style), Paragraph("RAG Stage", table_header_style), Paragraph("Mechanism & Mathematical Formulation", table_header_style)],
        [Paragraph("1", table_cell_bold), Paragraph("Document Ingestion", table_cell_style), Paragraph("PyMuPDF (fitz) extracts text blocks page-by-page from candidate PDFs. Whitespace normalization collapses redundant newlines.", table_cell_style)],
        [Paragraph("2", table_cell_bold), Paragraph("Sliding Chunking", table_cell_style), Paragraph("Text is segmented with <code>max_chunk_chars=1400</code> and <code>overlap=200</code>. Overlap ensures entity definitions and code snippets spanning chunk boundaries are not truncated.", table_cell_style)],
        [Paragraph("3", table_cell_bold), Paragraph("Vector Indexing", table_cell_style), Paragraph("Scikit-learn <code>TfidfVectorizer(ngram_range=(1,2), max_features=8000, stop_words='english')</code> transforms chunks into a dense sparse matrix representing unigram and bigram frequency.", table_cell_style)],
        [Paragraph("4", table_cell_bold), Paragraph("Cosine Retrieval", table_cell_style), Paragraph("Queries are vectorized and evaluated via Cosine Similarity: <i>sim(q, d) = (q &bull; d) / (||q|| * ||d||)</i>. The top-K (top_k=3) chunks form the retrieved evidence context.", table_cell_style)],
        [Paragraph("5", table_cell_bold), Paragraph("Claim Verification", table_cell_style), Paragraph("Resume claims are matched against retrieved project chunks. Score >= 0.20 = Supported; 0.08 <= Score < 0.20 = Partially Supported; Score < 0.08 = Unverified.", table_cell_style)],
        [Paragraph("6", table_cell_bold), Paragraph("Cross-Examination", table_cell_style), Paragraph("Unverified and partially supported claims trigger targeted probing questions in <code>cross_examination.py</code> to test whether the candidate truly authored the work.", table_cell_style)],
    ]
    t_rag = Table(rag_steps, colWidths=[30, 110, 400])
    t_rag.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#4C1D95")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_rag)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 4: API ARCHITECTURE & FASTAPI SERVICES
    # =========================================================================
    story.append(Paragraph("4. Backend API Architecture (FastAPI & Services)", h1_style))
    story.append(Paragraph(
        "The backend API (<code>interviai_api.py</code>) is built on FastAPI, chosen for its native asynchronous ASGI concurrency, strict Pydantic v2 data serialization, and automatic OpenAPI schema documentation. It handles authentication, interview lifecycle orchestration, multipart file parsing, and LLM chatbot streaming.",
        body_style
    ))

    api_endpoints = [
        [Paragraph("Method & Endpoint", table_header_style), Paragraph("Category", table_header_style), Paragraph("Description & Architectural Significance", table_header_style)],
        [Paragraph("<code>POST /auth/register</code>", table_cell_bold), Paragraph("Auth", table_cell_style), Paragraph("Hashes password with SHA256+Salt, provisions User + linked Candidate record, returns session token.", table_cell_style)],
        [Paragraph("<code>POST /auth/login</code>", table_cell_bold), Paragraph("Auth", table_cell_style), Paragraph("Validates credentials, creates AuthSession record, sets HttpOnly cookie and Bearer response token.", table_cell_style)],
        [Paragraph("<code>POST /interviews</code>", table_cell_bold), Paragraph("Session", table_cell_style), Paragraph("Initializes adaptive session with target role, starting difficulty, question count, and project defense flag.", table_cell_style)],
        [Paragraph("<code>GET /interviews/{id}/questions/next</code>", table_cell_bold), Paragraph("Adaptive", table_cell_style), Paragraph("Evaluates prior answer history, selects next optimal difficulty and topic from concept taxonomy.", table_cell_style)],
        [Paragraph("<code>POST /interviews/{id}/answers</code>", table_cell_bold), Paragraph("Evaluation", table_cell_style), Paragraph("Grades candidate answer (MCQ / Descriptive), records score, triggers adaptive engine state transition.", table_cell_style)],
        [Paragraph("<code>POST /interviews/{id}/finish</code>", table_cell_bold), Paragraph("Intelligence", table_cell_style), Paragraph("Compiles multi-factor intelligence scorecard, readiness score (0-100), strengths, and gap analysis.", table_cell_style)],
        [Paragraph("<code>POST /upload/resume</code>", table_cell_bold), Paragraph("Ingestion", table_cell_style), Paragraph("Multipart file upload; PyMuPDF extracts text; regex extractor parses skills and candidate claims.", table_cell_style)],
        [Paragraph("<code>POST /upload/project</code>", table_cell_bold), Paragraph("RAG", table_cell_style), Paragraph("Extracts and chunks project files, builds local TF-IDF vector matrix, binds to candidate workspace.", table_cell_style)],
        [Paragraph("<code>POST /chatbot/message</code>", table_cell_bold), Paragraph("Assistant", table_cell_style), Paragraph("Retrieves candidate profile, latest interview gaps, and project RAG context to formulate grounded advice.", table_cell_style)],
    ]
    t_api = Table(api_endpoints, colWidths=[150, 60, 330])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#4C1D95")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_api)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 5: PYTHON ENGINEERING & ALGORITHMIC DESIGN
    # =========================================================================
    story.append(Paragraph("5. Python Engineering, Algorithmic Scoring & Heuristics", h1_style))
    story.append(Paragraph(
        "InterviAI is architected with strict object-oriented and modular Python patterns. Core mathematical formulas govern the candidate's journey from starting question to final readiness score.",
        body_style
    ))
    story.append(Paragraph("Core Mathematical Models & Algorithms:", h2_style))
    story.append(Paragraph("<b>1. Adaptive Difficulty State Machine (<code>adaptive_engine.py</code>):</b>", bullet_style))
    story.append(Paragraph(
        "Difficulty transitions follow a 3-tier discrete Markov ladder [Easy &harr; Medium &harr; Hard]. If answer score &ge; 8.0/10, difficulty increases; if score &lt; 5.0/10, difficulty decreases; scores in [5.0, 7.9] preserve current difficulty. Question format alternates between MCQ (concept verification) and Descriptive (architectural depth) based on performance.",
        body_style
    ))
    story.append(Paragraph("<b>2. Weighted Candidate Readiness Formulation (<code>candidate_intelligence.py</code>):</b>", bullet_style))
    story.append(Paragraph(
        "The overall role readiness score (0 to 100%) is computed via a multi-factor weighted linear combination:<br/>"
        "&bull; <b>Technical Knowledge & Correctness:</b> 40% weighting (accuracy across adaptive interview questions)<br/>"
        "&bull; <b>Project Understanding & Architecture:</b> 30% weighting (defense of system trade-offs and code design)<br/>"
        "&bull; <b>Resume Claim Evidence Confidence:</b> 30% weighting (ratio of supported claims verified against RAG text)<br/>"
        "<b>Formula:</b> <i>Readiness = (Score_Tech * 0.40) + (Score_Project * 0.30) + (Score_Evidence * 0.30)</i>",
        body_style
    ))
    story.append(Paragraph("<b>3. Concept Taxonomy & Normalization (<code>concept_taxonomy.py</code>):</b>", bullet_style))
    story.append(Paragraph(
        "A hierarchical ontology maps 30+ technical topics (e.g. <i>Python &rarr; Data Types, OOP, Generators; SQL &rarr; Window Functions, Indexing; MLOps &rarr; Docker, Model Drift</i>) to prevent duplicate questioning and identify specific skill gaps.",
        body_style
    ))
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 6: DATABASE ARCHITECTURE & SCHEMA DESIGN
    # =========================================================================
    story.append(Paragraph("6. Database Architecture & Relational Persistence", h1_style))
    story.append(Paragraph(
        "Data persistence is managed via SQLAlchemy 2.0 ORM in <code>database.py</code>. The architecture incorporates an enterprise-grade connection fallback strategy to guarantee uptime under all development, cloud, and containerized deployment environments.",
        body_style
    ))
    story.append(Paragraph("Zero-Downtime Database Fallback Architecture:", h2_style))
    story.append(Paragraph(
        "On application startup, <code>database.py</code> attempts to connect to the primary PostgreSQL cluster specified in <code>DATABASE_URL</code> using <code>pool_pre_ping=True</code>. If PostgreSQL is unreachable (e.g. port blocked, network isolation, local permissions), it catches the exception and immediately initializes a high-performance local SQLite engine (<code>interviai.db</code>). This guarantees the API and tests never fail due to database unavailability.",
        body_style
    ))

    db_models = [
        [Paragraph("Table Name", table_header_style), Paragraph("Entity / Role", table_header_style), Paragraph("Key Fields & Relational Integrity Constraints", table_header_style)],
        [Paragraph("<code>users</code>", table_cell_bold), Paragraph("Account Identity", table_cell_style), Paragraph("id (PK), email (UQ, IDX), name, password_hash, candidate_id (FK), created_at, last_login_at.", table_cell_style)],
        [Paragraph("<code>candidates</code>", table_cell_bold), Paragraph("Profile & Files", table_cell_style), Paragraph("id (PK), user_id (FK), target_role, skills (JSON), active_resume_filename, active_project_name, active_project_files (JSON).", table_cell_style)],
        [Paragraph("<code>auth_sessions</code>", table_cell_bold), Paragraph("Session Tokens", table_cell_style), Paragraph("id (PK), user_id (FK), token_hash (UQ, IDX), created_at, expires_at (cascade on user deletion).", table_cell_style)],
        [Paragraph("<code>interviews</code>", table_cell_bold), Paragraph("Assessment Record", table_cell_style), Paragraph("id (PK), candidate_id (FK), job_role, total_questions, status, overall_score, readiness_score, report_data (JSON).", table_cell_style)],
        [Paragraph("<code>interview_questions</code>", table_cell_bold), Paragraph("Q&A Audit Trail", table_cell_style), Paragraph("id (PK), interview_id (FK), question_number, question_type, difficulty, topic, score, answer_text, evaluation (JSON).", table_cell_style)],
        [Paragraph("<code>resume_claims</code>", table_cell_bold), Paragraph("Claim Verification", table_cell_style), Paragraph("id (PK), interview_id (FK), claim_text, status (Supported/Partial/Unverified), match_score, evidence snippet.", table_cell_style)],
        [Paragraph("<code>uploaded_files</code>", table_cell_bold), Paragraph("Binary File Store", table_cell_style), Paragraph("id (PK), user_id (FK), file_type, filename, size_bytes, content (LargeBinary blob), is_active.", table_cell_style)],
        [Paragraph("<code>chat_messages</code>", table_cell_bold), Paragraph("Assistant History", table_cell_style), Paragraph("id (PK), user_id (FK), role ('user'/'assistant'), message, citations (JSON), created_at.", table_cell_style)],
    ]
    t_db = Table(db_models, colWidths=[110, 100, 330])
    t_db.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#4C1D95")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_db)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 7: SENIOR INTERVIEW DEFENSE & TOP 10 TALKING POINTS
    # =========================================================================
    story.append(Paragraph("7. Senior Engineering Defense: Top 10 Technical Interview Questions", h1_style))
    story.append(Paragraph(
        "These are the most critical system design, trade-off, and algorithmic questions an interviewer or hiring manager will ask about InterviAI, accompanied by battle-tested answers:",
        body_style
    ))

    qa_list = [
        ("Q1: Why use TF-IDF retrieval for local RAG instead of Pinecone, Chroma, or Weaviate?",
         "Answer: In an assessment session, privacy, zero external cloud dependencies, and sub-10ms response times are paramount. A candidate's project report is typically 5 to 50 pages (10k to 100k tokens). Building a local TF-IDF bi-gram vector matrix takes <50ms, requires zero network I/O, costs $0, and avoids vector database cold-start latency. For multi-million document corpora, we would migrate to HNSW vector indexing in pgvector; for single-candidate project defense, local TF-IDF provides optimal latency and zero operational overhead."),

        ("Q2: How do you prevent and mitigate LLM hallucinations during automated answer grading?",
         "Answer: We employ a multi-layered defense: (1) Constrained JSON schema output preventing free-form drift; (2) Grounded rubric prompt conditioning with explicit penalties for ungrounded assertions; (3) Keyword & semantic overlap verification against validated concept taxonomies; (4) Pre-evaluation heuristic filters (in fast_evaluator.py) that flag low-effort, repetitive, or gibberish submissions before cloud inference; (5) Full QA audit logging in the database so candidates and recruiters can inspect exact grading justifications."),

        ("Q3: How is data isolation and security maintained in a multi-tenant environment?",
         "Answer: Every database entity (Candidate, Interview, UploadedFile, ChatMessage) enforces foreign key constraints referencing the authenticated User ID. All API endpoints resolve the candidate workspace exclusively through the verified JWT Bearer token or encrypted HttpOnly cookie session. In test_user_isolation_and_rag.py, automated integration tests explicitly assert that User A cannot read, query, or verify against User B's project files or interview records."),

        ("Q4: Explain how your adaptive difficulty algorithm makes decisions in real time.",
         "Answer: It operates as a deterministic state machine: starting from the candidate's chosen difficulty (Easy/Medium/Hard), each answer is scored on a 0-10 scale. A score >= 8.0 indicates mastery and triggers an upward transition on the 3-state ladder. A score < 5.0 indicates a knowledge gap, triggering downward difficulty transition to test fundamentals. Questions alternate between MCQ (broad verification) and Descriptive (depth of trade-offs), while Question 3 dynamically injects a grounded project defense probe."),

        ("Q5: How does the resume claim verification algorithm compute its confidence score?",
         "Answer: extract_resume_claims uses regex to identify action verbs (e.g. 'architected', 'trained', 'optimized') and quantitative metrics ('94% accuracy', 'reduced latency by 40%'). Each claim is queried against the project RAG vector space. Chunks with cosine similarity >= 0.20 are labeled 'Supported', while scores in [0.08, 0.20) are 'Partially Supported'. The aggregate confidence score is: (Supported + 0.5 * Partial) / Total_Claims * 100."),

        ("Q6: How does the application handle offline scenarios or Google Gemini API rate limits?",
         "Answer: Dual-tier redundancy. First, retry policies with exponential backoff mitigate transient 429/503 errors. Second, if the external LLM is completely unreachable, fast_interview_bank.py and fast_evaluator.py seamlessly take over on the client and backend, serving pre-authored role-specific questions and heuristic evaluations without interrupting the interview."),

        ("Q7: How did you design the database fallback mechanism and why?",
         "Answer: In production cloud containers or local developer workstations, PostgreSQL may be temporarily unavailable or blocked by IPv6 permission issues. database.py attempts a pool_pre_ping connection test. Upon catching OperationalError, it automatically falls back to an embedded SQLite database (interviai.db) and dynamically applies idempotent DDL column migrations. This ensures 100% build and runtime resilience."),

        ("Q8: How does the live AI Video Interview work under the hood?",
         "Answer: Built using WebRTC/MediaDevices APIs, accessing the candidate's webcam and microphone with an HTML5 MediaRecorder. An AudioContext AnalyserNode computes real-time frequency data to drive a live VU meter. If the browser lacks permissions or physical hardware, a virtual studio camera smoothly activates. Answer recordings, duration, and notes are analyzed against expected architectural keypoints, producing a structured MNC benchmark score."),

        ("Q9: What are the primary performance bottlenecks and how did you optimize them?",
         "Answer: The primary bottlenecks were LLM generation latency (~1.5-3.0s) and large PDF parsing. We optimized this by: (1) Caching extracted resume text and RAG vector matrices in candidate records; (2) Pre-generating question batches rather than calling the LLM synchronously per question; (3) Using Next.js Turbopack/webpack with zero-runtime Google Fonts fallback to eliminate render-blocking network requests."),

        ("Q10: If you had 3 more months on this project, what architectural upgrades would you implement?",
         "Answer: (1) Replace local TF-IDF with pgvector in PostgreSQL for hybrid sparse+dense semantic retrieval with HNSW indexing; (2) Implement real-time WebRTC audio streaming to Google Gemini Multimodal Live API for natural conversational interruption; (3) Add distributed task queues (Celery + Redis) for asynchronous batch candidate evaluation reports; (4) Introduce automated code execution sandbox (Docker/gVisor) for live programming challenges.")
    ]

    for title, text in qa_list:
        qa_box_data = [
            [Paragraph(f"<b>{title}</b>", ParagraphStyle("QTitle", fontName="Helvetica-Bold", fontSize=9, textColor=colors.HexColor("#4C1D95"), leading=12))],
            [Paragraph(text, ParagraphStyle("QAns", fontName="Helvetica", fontSize=8, textColor=colors.HexColor("#1F2937"), leading=11.5))]
        ]
        t_qa = Table(qa_box_data, colWidths=[540])
        t_qa.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F3E8FF")),
            ('BACKGROUND', (0,1), (-1,1), colors.HexColor("#FAF5FF")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#DDD6FE")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#DDD6FE")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 7),
            ('RIGHTPADDING', (0,0), (-1,-1), 7),
        ]))
        story.append(t_qa)
        story.append(Spacer(1, 6))

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Report successfully compiled: {output_filename}")

if __name__ == "__main__":
    out_name = sys.argv[1] if len(sys.argv) > 1 else "InterviAI_Technical_Project_Report.pdf"
    create_report(out_name)
