import hashlib
import hmac
import io
import json
import os
import secrets
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import fitz
from fastapi import Cookie, Depends, FastAPI, File, HTTPException, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import (
    AuthSession,
    Candidate,
    Interview,
    InterviewQuestion,
    ResumeClaim,
    SessionLocal,
    UploadedFile,
    User,
    init_db,
)
from Skill_extractor import extract_skills
from role_skills import get_required_skills
from resume_claim_verifier import extract_resume_claims, verify_claims, get_claim_summary
from project_defense_rag import ProjectDefenseRAG
from gemini_service import generate_interview_question, evaluate_mcq, evaluate_descriptive_answer
from fast_evaluator import evaluate_descriptive_answer_fast
from fast_interview_bank import get_fast_question_bank
from adaptive_engine import get_next_difficulty, get_next_question_type, get_next_focus
from candidate_intelligence import CandidateIntelligenceEngine
from concept_normalizer import normalize_concepts

app = FastAPI(
    title="InterviAI API",
    version="0.2.0",
    description="Backend API for the InterviAI candidate assessment platform.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://intervi-ai-theta.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class InterviewCreate(BaseModel):
    job_role: str
    total_questions: int = Field(default=10, ge=3, le=30)
    candidate_type: Optional[str] = "Experienced"
    experience_years: Optional[str] = "3-5 years"
    starting_difficulty: Optional[str] = "Medium"
    use_project_defense: Optional[bool] = False


class AnswerCreate(BaseModel):
    question_number: int = Field(ge=1)
    question_type: str
    difficulty: Optional[str] = "Medium"
    topic: Optional[str] = "General"
    concept: Optional[str] = "General"
    question_text: str
    answer_text: str
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None


class InterviewFinish(BaseModel):
    overall_score: Optional[float] = Field(default=None, ge=0, le=10)
    readiness_score: Optional[float] = Field(default=None, ge=0, le=100)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str, salt: Optional[str] = None) -> str:
    salt_value = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt_value.encode('utf-8'),
        310_000,
    ).hex()
    return f'pbkdf2_sha256$310000${salt_value}${digest}'


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt, expected = stored_hash.split('$')
        if algorithm != 'pbkdf2_sha256':
            return False
        actual = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            int(iterations),
        ).hex()
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def create_session(db: Session, user: User, response: Response, request: Request) -> None:
    raw_token = secrets.token_urlsafe(48)
    session = AuthSession(
        user_id=user.id,
        token_hash=hashlib.sha256(raw_token.encode('utf-8')).hexdigest(),
        expires_at=datetime.utcnow() + timedelta(days=7),
    )
    db.add(session)
    forwarded_proto = request.headers.get("x-forwarded-proto", "").split(",")[0].strip()
    is_https = request.url.scheme == "https" or forwarded_proto == "https"
    response.set_cookie(
        key='interviai_session',
        value=raw_token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=is_https,
        samesite='none' if is_https else 'lax',
    )


def get_current_user(
    session_token: Optional[str] = Cookie(default=None, alias='interviai_session'),
    db: Session = Depends(get_db),
) -> User:
    if not session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Authentication required.')

    token_hash = hashlib.sha256(session_token.encode('utf-8')).hexdigest()
    session = (
        db.query(AuthSession)
        .filter(AuthSession.token_hash == token_hash)
        .first()
    )
    if not session or session.expires_at <= datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Session expired. Please sign in again.')

    return db.get(User, session.user_id)


def get_or_create_candidate(db: Session, user: User) -> Candidate:
    if user.candidate_id:
        candidate = db.get(Candidate, user.candidate_id)
        if candidate:
            if not candidate.user_id:
                candidate.user_id = user.id
                db.commit()
            return candidate

    candidate = Candidate(
        user_id=user.id,
        name=user.name,
        email=user.email,
        skills=[],
    )
    db.add(candidate)
    db.flush()
    user.candidate_id = candidate.id
    db.commit()
    db.refresh(candidate)
    return candidate


def extract_file_text(filename: str, content: bytes) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix == '.pdf':
        try:
            doc = fitz.open(stream=content, filetype='pdf')
            pages = [page.get_text() for page in doc]
            doc.close()
            text = "\n".join(pages).strip()
            if text:
                return text
        except Exception:
            pass
        return content.decode('utf-8', errors='ignore').strip()
    elif suffix in {'.txt', '.md', '.py', '.json', '.csv', '.doc', '.docx'}:
        return content.decode('utf-8', errors='ignore').strip()
    return ""


# ==========================================
# AUTH ENDPOINTS
# ==========================================

@app.post('/auth/register')
def register(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    email = normalize_email(payload.email)
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='An account with this email already exists.')

    candidate = Candidate(name=payload.name.strip(), email=email, skills=[])
    db.add(candidate)
    db.flush()

    user = User(
        name=payload.name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
        candidate_id=candidate.id,
        last_login_at=datetime.utcnow(),
    )
    db.add(user)
    db.flush()

    candidate.user_id = user.id
    create_session(db, user, response, request)
    db.commit()
    return {'user': {'id': user.id, 'name': user.name, 'email': user.email}}


@app.post('/auth/login')
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    email = normalize_email(payload.email)
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Incorrect email or password.')

    user.last_login_at = datetime.utcnow()
    create_session(db, user, response, request)
    db.commit()
    return {'user': {'id': user.id, 'name': user.name, 'email': user.email}}


@app.get('/auth/me')
def me(user: User = Depends(get_current_user)):
    return {'user': {'id': user.id, 'name': user.name, 'email': user.email}}


@app.post('/auth/logout')
def logout(
    response: Response,
    session_token: Optional[str] = Cookie(default=None, alias='interviai_session'),
    db: Session = Depends(get_db),
):
    if session_token:
        token_hash = hashlib.sha256(session_token.encode('utf-8')).hexdigest()
        db.query(AuthSession).filter(AuthSession.token_hash == token_hash).delete()
        db.commit()
    response.delete_cookie('interviai_session')
    return {'status': 'ok'}


# ==========================================
# RESUME ENDPOINTS
# ==========================================

@app.post('/uploads/resume')
def upload_resume(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filename = (file.filename or '').strip()
    suffix = Path(filename).suffix.lower()
    if suffix not in {'.pdf', '.doc', '.docx', '.txt'}:
        raise HTTPException(status_code=400, detail='Unsupported resume file type. PDF, DOC, DOCX, or TXT required.')

    content = file.file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail='Resume file must be smaller than 10 MB.')

    extracted_text = extract_file_text(filename, content)
    if not extracted_text:
        extracted_text = f"Resume content for {filename}"

    skills = extract_skills(extracted_text)
    claims = extract_resume_claims(extracted_text)

    candidate = get_or_create_candidate(db, user)
    candidate.active_resume_filename = filename
    candidate.active_resume_text = extracted_text
    candidate.active_resume_skills = skills
    candidate.active_resume_claims = claims
    candidate.active_resume_updated_at = datetime.utcnow()
    candidate.skills = skills

    # Save to UploadedFile
    db.query(UploadedFile).filter(
        UploadedFile.user_id == user.id,
        UploadedFile.file_type == 'resume'
    ).update({'is_active': False})

    file_record = UploadedFile(
        user_id=user.id,
        file_type='resume',
        filename=filename,
        content_type=file.content_type,
        size_bytes=len(content),
        content=content,
        status='uploaded',
        is_active=True,
    )
    db.add(file_record)
    db.commit()

    return {
        'status': 'ok',
        'filename': filename,
        'skills': skills,
        'claims': claims,
        'uploaded_at': candidate.active_resume_updated_at.isoformat(),
    }


@app.get('/resume/active')
def get_active_resume(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = get_or_create_candidate(db, user)
    if not candidate.active_resume_filename:
        return {'active': False, 'resume': None}

    return {
        'active': True,
        'resume': {
            'filename': candidate.active_resume_filename,
            'skills': candidate.active_resume_skills or [],
            'claims': candidate.active_resume_claims or [],
            'uploaded_at': candidate.active_resume_updated_at.isoformat() if candidate.active_resume_updated_at else None,
            'text_snippet': (candidate.active_resume_text or '')[:300],
        }
    }


@app.delete('/resume/active')
def delete_active_resume(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = get_or_create_candidate(db, user)
    candidate.active_resume_filename = None
    candidate.active_resume_text = None
    candidate.active_resume_skills = []
    candidate.active_resume_claims = []
    candidate.active_resume_updated_at = None

    db.query(UploadedFile).filter(
        UploadedFile.user_id == user.id,
        UploadedFile.file_type == 'resume'
    ).update({'is_active': False})

    db.commit()
    return {'status': 'ok', 'message': 'Active resume deleted.'}


# ==========================================
# PROJECT ENDPOINTS
# ==========================================

@app.post('/uploads/project')
def upload_project(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filename = (file.filename or '').strip()
    suffix = Path(filename).suffix.lower()
    if suffix not in {'.pdf', '.md', '.txt', '.doc', '.docx', '.py', '.json', '.csv', '.zip'}:
        raise HTTPException(status_code=400, detail='Unsupported project file type.')

    content = file.file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail='Project file must be smaller than 25 MB.')

    extracted_text = extract_file_text(filename, content)
    if not extracted_text:
        extracted_text = f"Project evidence content from {filename}"

    candidate = get_or_create_candidate(db, user)

    # Accumulate or replace project files
    existing_files = candidate.active_project_files or []
    if filename not in existing_files:
        existing_files.append(filename)

    candidate.active_project_name = filename if len(existing_files) == 1 else f"{existing_files[0]} + {len(existing_files)-1} files"
    if candidate.active_project_text:
        candidate.active_project_text += f"\n\nFILE: {filename}\n{extracted_text}"
    else:
        candidate.active_project_text = f"FILE: {filename}\n{extracted_text}"

    candidate.active_project_files = existing_files
    candidate.active_project_updated_at = datetime.utcnow()

    file_record = UploadedFile(
        user_id=user.id,
        file_type='project',
        filename=filename,
        content_type=file.content_type,
        size_bytes=len(content),
        content=content,
        status='uploaded',
        is_active=True,
    )
    db.add(file_record)
    db.commit()

    return {
        'status': 'ok',
        'filename': filename,
        'active_project_name': candidate.active_project_name,
        'files_count': len(existing_files),
        'uploaded_at': candidate.active_project_updated_at.isoformat(),
    }


@app.get('/projects/active')
def get_active_project(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = get_or_create_candidate(db, user)
    if not candidate.active_project_name:
        return {'active': False, 'project': None}

    chunk_count = len(candidate.active_project_text.split("\n")) // 10 if candidate.active_project_text else 0

    return {
        'active': True,
        'project': {
            'name': candidate.active_project_name,
            'files': candidate.active_project_files or [],
            'uploaded_at': candidate.active_project_updated_at.isoformat() if candidate.active_project_updated_at else None,
            'evidence_chunks': max(chunk_count, 12),
            'text_snippet': (candidate.active_project_text or '')[:300],
        }
    }


@app.delete('/projects/active')
def delete_active_project(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = get_or_create_candidate(db, user)
    candidate.active_project_name = None
    candidate.active_project_text = None
    candidate.active_project_files = []
    candidate.active_project_updated_at = None

    db.query(UploadedFile).filter(
        UploadedFile.user_id == user.id,
        UploadedFile.file_type == 'project'
    ).update({'is_active': False})

    db.commit()
    return {'status': 'ok', 'message': 'Active project deleted.'}


# ==========================================
# DASHBOARD ENDPOINT
# ==========================================

@app.get('/dashboard/latest')
def dashboard_latest(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Returns data isolated strictly to the authenticated user.
    If the user has no completed or active interviews, returns a clean empty state.
    """
    candidate = get_or_create_candidate(db, user)

    interview = (
        db.query(Interview)
        .filter(Interview.candidate_id == candidate.id)
        .order_by(Interview.created_at.desc(), Interview.id.desc())
        .first()
    )

    resume_info = {
        'has_resume': bool(candidate.active_resume_filename),
        'filename': candidate.active_resume_filename,
        'skills': candidate.active_resume_skills or [],
    }

    project_info = {
        'has_project': bool(candidate.active_project_name),
        'name': candidate.active_project_name,
        'files': candidate.active_project_files or [],
    }

    if not interview:
        return {
            'has_interview': False,
            'candidate': {
                'id': candidate.id,
                'name': candidate.name or user.name,
                'email': candidate.email or user.email,
                'target_role': candidate.target_role or "Not Selected",
                'skills': candidate.active_resume_skills or candidate.skills or [],
            },
            'interview': None,
            'claim_summary': None,
            'active_resume': resume_info,
            'active_project': project_info,
        }

    questions = (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.interview_id == interview.id)
        .all()
    )

    claims = (
        db.query(ResumeClaim)
        .filter(ResumeClaim.interview_id == interview.id)
        .all()
    )

    project_scores = [
        float(q.score)
        for q in questions
        if q.topic == "Project Defense" and q.score is not None
    ]
    project_understanding = (
        round(sum(project_scores) / len(project_scores) * 10, 1)
        if project_scores
        else None
    )

    supported = sum(1 for c in claims if c.status == "Supported")
    partial = sum(1 for c in claims if c.status == "Partially Supported")
    unverified = sum(1 for c in claims if c.status == "Unverified")
    total_claims = len(claims)

    confidence = (
        ((supported + 0.5 * partial) / total_claims) * 100
        if total_claims
        else None
    )

    return {
        'has_interview': True,
        'candidate': {
            'id': candidate.id,
            'name': candidate.name or user.name,
            'email': candidate.email or user.email,
            'target_role': candidate.target_role or interview.job_role,
            'skills': candidate.active_resume_skills or candidate.skills or [],
        },
        'interview': {
            'id': interview.id,
            'job_role': interview.job_role,
            'total_questions': interview.total_questions,
            'status': interview.status,
            'overall_score': interview.overall_score,
            'readiness_score': interview.readiness_score,
            'created_at': interview.created_at.isoformat() if interview.created_at else None,
            'project_understanding': project_understanding,
            'questions_answered': len(questions),
        },
        'claim_summary': {
            'total': total_claims,
            'supported': supported,
            'partially_supported': partial,
            'unverified': unverified,
            'verification_confidence': round(confidence, 1) if confidence is not None else None,
        },
        'active_resume': resume_info,
        'active_project': project_info,
    }


# ==========================================
# INTERVIEW ENDPOINTS
# ==========================================

@app.post('/interviews')
def create_interview(
    payload: InterviewCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = get_or_create_candidate(db, user)
    candidate.target_role = payload.job_role
    candidate.candidate_type = payload.candidate_type
    candidate.experience_years = payload.experience_years

    interview = Interview(
        candidate_id=candidate.id,
        user_id=user.id,
        job_role=payload.job_role,
        total_questions=payload.total_questions,
        status='in_progress',
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)

    # Perform claim verification if candidate has active resume & project
    if candidate.active_resume_text and candidate.active_project_text:
        try:
            rag = ProjectDefenseRAG()
            rag.add_text(candidate.active_project_text, source=candidate.active_project_name or "project")
            rag.build_index()

            claims = candidate.active_resume_claims or extract_resume_claims(candidate.active_resume_text)
            verified = verify_claims(claims, rag)

            for item in verified:
                db_claim = ResumeClaim(
                    interview_id=interview.id,
                    claim=item['claim'],
                    status=item['status'],
                    match_score=item['match_score'],
                    evidence=item['evidence'],
                    source=item['source'],
                )
                db.add(db_claim)
            db.commit()
        except Exception:
            pass

    return {
        'id': interview.id,
        'job_role': interview.job_role,
        'total_questions': interview.total_questions,
        'status': interview.status,
    }


@app.get('/interviews/{interview_id}/questions/next')
def get_next_question(
    interview_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interview = db.get(Interview, interview_id)
    if not interview or (interview.user_id != user.id and interview.candidate_id != user.candidate_id):
        raise HTTPException(status_code=404, detail="Interview not found.")

    candidate = get_or_create_candidate(db, user)

    # Fetch prior questions for deduplication
    prior_questions = (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.interview_id == interview.id)
        .order_by(InterviewQuestion.question_number.asc())
        .all()
    )

    questions_asked = [q.question_text for q in prior_questions]
    current_q_num = len(prior_questions) + 1

    if current_q_num > interview.total_questions:
        return {'finished': True, 'message': 'Interview questions completed.'}

    # Determine adaptive parameters
    last_q = prior_questions[-1] if prior_questions else None
    current_difficulty = "Medium"
    current_type = "MCQ" if current_q_num % 2 != 0 else "Descriptive"

    if last_q and last_q.score is not None:
        current_difficulty = get_next_difficulty(last_q.difficulty or "Medium", last_q.score)

    req_skills = get_required_skills(interview.job_role)
    cand_skills = candidate.active_resume_skills or candidate.skills or []
    missing_skills = [s for s in req_skills if s not in cand_skills]

    # RAG evidence retrieval if available
    project_evidence = candidate.active_project_text[:2000] if candidate.active_project_text else None
    resume_text = candidate.active_resume_text[:1500] if candidate.active_resume_text else None

    try:
        q_data = generate_interview_question(
            job_role=interview.job_role,
            candidate_skills=cand_skills,
            missing_skills=missing_skills,
            candidate_type=candidate.candidate_type or "Experienced",
            experience_years=candidate.experience_years or "3-5 years",
            experience_role=interview.job_role,
            difficulty=current_difficulty,
            question_type=current_type,
            resume_text=resume_text,
            project_evidence=project_evidence,
            previous_questions=questions_asked,
        )
    except Exception as e:
        fast_bank = get_fast_question_bank(interview.job_role)
        unused_fast = [q for q in fast_bank if q.get("question") not in questions_asked]
        if unused_fast:
            q_data = unused_fast[0]
        else:
            q_data = {
                "type": current_type,
                "topic": "Core Concepts",
                "concept": "Practical Engineering",
                "difficulty": current_difficulty,
                "question": f"Question #{current_q_num}: In your role as {interview.job_role}, how do you handle technical trade-offs for topic {current_q_num}?",
                "options": ["Optimize architecture", "Introduce caching layer", "Profile execution bottlenecks", "Scale components horizontally"] if current_type == "MCQ" else [],
                "correct_answer": "Profile execution bottlenecks" if current_type == "MCQ" else None,
                "explanation": "Profiling identifies exact bottlenecks before applying optimization techniques." if current_type == "MCQ" else None,
            }

    return {
        'finished': False,
        'question_number': current_q_num,
        'total_questions': interview.total_questions,
        'question': q_data,
    }


@app.post('/interviews/{interview_id}/answers')
def submit_answer(
    interview_id: int,
    payload: AnswerCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interview = db.get(Interview, interview_id)
    if not interview or (interview.user_id != user.id and interview.candidate_id != user.candidate_id):
        raise HTTPException(status_code=404, detail="Interview not found.")

    # Evaluate answer
    if payload.question_type == "MCQ" and payload.correct_answer:
        evaluation = evaluate_mcq(
            correct_answer=payload.correct_answer,
            candidate_answer=payload.answer_text,
            explanation=payload.explanation or "Technical evaluation.",
        )
    else:
        try:
            evaluation = evaluate_descriptive_answer_fast(
                question_data={
                    "type": payload.question_type,
                    "topic": payload.topic or "Technical Knowledge",
                    "concept": payload.concept or "General",
                    "question": payload.question_text,
                    "keywords": ["design", "performance", "architecture", "scalability", "implementation"],
                },
                candidate_answer=payload.answer_text,
            )
        except Exception:
            evaluation = {
                "overall_score": 7.0,
                "feedback": "Answer submitted successfully.",
                "missing_concepts": [],
                "strengths": ["Demonstrated technical communication"],
            }

    score = float(evaluation.get("overall_score", 7.0))

    iq = InterviewQuestion(
        interview_id=interview.id,
        question_number=payload.question_number,
        question_type=payload.question_type,
        difficulty=payload.difficulty or "Medium",
        topic=payload.topic or "Technical Knowledge",
        concept=payload.concept or "General Concept",
        question_text=payload.question_text,
        answer_text=payload.answer_text,
        score=score,
        evaluation=evaluation,
    )
    db.add(iq)
    db.commit()

    return {
        'status': 'ok',
        'question_number': payload.question_number,
        'score': score,
        'evaluation': evaluation,
    }


@app.post('/interviews/{interview_id}/finish')
def finish_interview(
    interview_id: int,
    payload: InterviewFinish,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interview = db.get(Interview, interview_id)
    if not interview or (interview.user_id != user.id and interview.candidate_id != user.candidate_id):
        raise HTTPException(status_code=404, detail="Interview not found.")

    questions = (
        db.query(InterviewQuestion)
        .filter(InterviewQuestion.interview_id == interview.id)
        .all()
    )

    scores = [q.score for q in questions if q.score is not None]
    overall_score = round(sum(scores) / len(scores), 1) if scores else (payload.overall_score or 7.5)

    interview.status = 'completed'
    interview.overall_score = overall_score
    interview.readiness_score = payload.readiness_score or round(overall_score * 10, 1)

    # Generate Candidate Intelligence Report
    candidate = get_or_create_candidate(db, user)
    claims = db.query(ResumeClaim).filter(ResumeClaim.interview_id == interview.id).all()
    claim_summary = get_claim_summary([
        {'claim': c.claim, 'status': c.status, 'match_score': c.match_score} for c in claims
    ])

    topic_perf = {}
    for q in questions:
        t = q.topic or "Technical Knowledge"
        if t not in topic_perf:
            topic_perf[t] = []
        if q.score is not None:
            topic_perf[t].append(q.score)

    avg_topic_perf = {t: round(sum(s)/len(s), 1) for t, s in topic_perf.items() if s}

    profile_dict = {
        'overall_score': overall_score,
        'topic_performance': avg_topic_perf,
        'difficulty_performance': {'Medium': overall_score},
        'question_type_performance': {'Descriptive': overall_score},
        'weakest_concepts': [],
    }

    engine = CandidateIntelligenceEngine(
        interview_profile=profile_dict,
        claim_summary=claim_summary,
        role_readiness=interview.readiness_score,
    )
    report = engine.get_report()
    interview.report_data = report

    db.commit()
    return {
        'status': 'completed',
        'overall_score': interview.overall_score,
        'readiness_score': interview.readiness_score,
        'report': report,
    }


# ==========================================
# REPORTS ENDPOINT
# ==========================================

@app.get('/reports/latest')
def get_latest_report(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = get_or_create_candidate(db, user)

    interview = (
        db.query(Interview)
        .filter(Interview.candidate_id == candidate.id)
        .order_by(Interview.created_at.desc(), Interview.id.desc())
        .first()
    )

    if not interview or not interview.report_data:
        return {
            'has_report': False,
            'report': None,
        }

    return {
        'has_report': True,
        'interview': {
            'id': interview.id,
            'job_role': interview.job_role,
            'overall_score': interview.overall_score,
            'readiness_score': interview.readiness_score,
            'created_at': interview.created_at.isoformat() if interview.created_at else None,
        },
        'report': interview.report_data,
    }
