import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import Cookie, Depends, FastAPI, File, HTTPException, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import (
    SessionLocal,
    init_db,
    AuthSession,
    Candidate,
    Interview,
    InterviewQuestion,
    ResumeClaim,
    UploadedFile,
    User,
)

app = FastAPI(
    title="InterviAI API",
    version="0.1.0",
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


class CandidateCreate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    target_role: Optional[str] = None
    candidate_type: Optional[str] = None
    experience_years: Optional[str] = None
    resume_text: Optional[str] = None
    skills: List[str] = Field(default_factory=list)


class InterviewCreate(BaseModel):
    candidate_id: int
    job_role: str
    total_questions: int = Field(default=10, ge=1, le=50)


class AnswerCreate(BaseModel):
    question_number: int = Field(ge=1)
    question_type: str
    difficulty: Optional[str] = None
    topic: Optional[str] = None
    concept: Optional[str] = None
    question_text: str
    answer_text: str
    score: Optional[float] = Field(default=None, ge=0, le=10)
    evaluation: Optional[Dict[str, Any]] = None


class InterviewFinish(BaseModel):
    overall_score: float = Field(ge=0, le=10)
    readiness_score: Optional[float] = Field(default=None, ge=0, le=100)

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)

class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)

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

def store_upload(
    upload: UploadFile,
    file_type: str,
    user: User,
    db: Session,
):
    allowed_extensions = {
        'resume': {'.pdf', '.doc', '.docx', '.txt'},
        'project': {'.pdf', '.md', '.txt', '.doc', '.docx', '.zip'},
    }
    filename = (upload.filename or '').strip()
    extension = '.' + filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if not filename or extension not in allowed_extensions[file_type]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Unsupported {file_type} file type.',
        )

    content = upload.file.read()
    max_size = 10 * 1024 * 1024 if file_type == 'resume' else 25 * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f'{file_type.title()} file must be smaller than {max_size // (1024 * 1024)} MB.',
        )

    record = UploadedFile(
        user_id=user.id,
        file_type=file_type,
        filename=filename,
        content_type=upload.content_type,
        size_bytes=len(content),
        content=content,
        status='uploaded',
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {
        'id': record.id,
        'filename': record.filename,
        'file_type': record.file_type,
        'size_bytes': record.size_bytes,
        'status': record.status,
        'created_at': record.created_at.isoformat(),
    }

@app.post('/uploads/resume')
def upload_resume(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return store_upload(file, 'resume', user, db)

@app.post('/uploads/project')
def upload_project(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return store_upload(file, 'project', user, db)


@app.get("/health")
def health():
    return {"status": "ok", "service": "InterviAI API"}


@app.get("/dashboard/latest")
def dashboard_latest(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Development dashboard: return the most recent interview and candidate."""
    query = db.query(Interview)
    if user.candidate_id:
        query = query.filter(Interview.candidate_id == user.candidate_id)
    interview = query.order_by(Interview.created_at.desc(), Interview.id.desc()).first()

    if not interview:
        raise HTTPException(
            status_code=404,
            detail="No interview data found."
        )

    candidate = db.get(Candidate, interview.candidate_id)

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
    partial = sum(
        1 for c in claims
        if c.status == "Partially Supported"
    )
    unverified = sum(
        1 for c in claims
        if c.status == "Unverified"
    )

    total_claims = len(claims)

    confidence = (
        ((supported + 0.5 * partial) / total_claims) * 100
        if total_claims
        else None
    )

    return {
        "candidate": {
            "id": candidate.id if candidate else interview.candidate_id,
            "name": candidate.name if candidate else None,
            "target_role": (
                candidate.target_role
                if candidate
                else interview.job_role
            ),
            "skills": candidate.skills if candidate else [],
        },
        "interview": {
            "id": interview.id,
            "job_role": interview.job_role,
            "total_questions": interview.total_questions,
            "status": interview.status,
            "overall_score": interview.overall_score,
            "readiness_score": interview.readiness_score,
            "created_at": (
                interview.created_at.isoformat()
                if interview.created_at
                else None
            ),
            "project_understanding": project_understanding,
            "questions_answered": len(questions),
        },
        "claim_summary": {
            "total": total_claims,
            "supported": supported,
            "partially_supported": partial,
            "unverified": unverified,
            "verification_confidence": (
                round(confidence, 1)
                if confidence is not None
                else None
            ),
        },
    }
