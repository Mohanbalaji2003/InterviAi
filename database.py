import os
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, DateTime, Float, Integer, JSON, LargeBinary, String, Text, ForeignKey
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./interviai.db')
connect_args = {'check_same_thread': False} if DATABASE_URL.startswith('sqlite') else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Candidate(Base):
    __tablename__ = 'candidates'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=True)
    email = Column(String(255), nullable=True)
    target_role = Column(String(120), nullable=True)
    candidate_type = Column(String(40), nullable=True)
    experience_years = Column(String(40), nullable=True)
    resume_text = Column(Text, nullable=True)
    skills = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    interviews = relationship('Interview', back_populates='candidate', cascade='all, delete-orphan')
    user = relationship('User', back_populates='candidate', uselist=False)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    name = Column(String(120), nullable=False)
    password_hash = Column(String(255), nullable=False)
    candidate_id = Column(Integer, ForeignKey('candidates.id'), nullable=True, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    candidate = relationship('Candidate', back_populates='user')
    sessions = relationship('AuthSession', back_populates='user', cascade='all, delete-orphan')

class AuthSession(Base):
    __tablename__ = 'auth_sessions'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    token_hash = Column(String(64), nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    user = relationship('User', back_populates='sessions')

class UploadedFile(Base):
    __tablename__ = 'uploaded_files'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    file_type = Column(String(40), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(120), nullable=True)
    size_bytes = Column(Integer, nullable=False)
    content = Column(LargeBinary, nullable=False)
    status = Column(String(40), nullable=False, default='uploaded')
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user = relationship('User')

class Interview(Base):
    __tablename__ = 'interviews'
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey('candidates.id'), nullable=False, index=True)
    job_role = Column(String(120), nullable=False)
    total_questions = Column(Integer, nullable=False)
    overall_score = Column(Float, nullable=True)
    readiness_score = Column(Float, nullable=True)
    status = Column(String(40), nullable=False, default='created')
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    candidate = relationship('Candidate', back_populates='interviews')
    questions = relationship('InterviewQuestion', back_populates='interview', cascade='all, delete-orphan')
    claims = relationship('ResumeClaim', back_populates='interview', cascade='all, delete-orphan')

class InterviewQuestion(Base):
    __tablename__ = 'interview_questions'
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey('interviews.id'), nullable=False, index=True)
    question_number = Column(Integer, nullable=False)
    question_type = Column(String(40), nullable=False)
    difficulty = Column(String(40), nullable=True)
    topic = Column(String(120), nullable=True)
    concept = Column(String(160), nullable=True)
    question_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=True)
    score = Column(Float, nullable=True)
    evaluation = Column(JSON, nullable=True)
    interview = relationship('Interview', back_populates='questions')

class ResumeClaim(Base):
    __tablename__ = 'resume_claims'
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey('interviews.id'), nullable=False, index=True)
    claim = Column(Text, nullable=False)
    status = Column(String(40), nullable=False)
    match_score = Column(Float, nullable=True)
    evidence = Column(Text, nullable=True)
    source = Column(String(255), nullable=True)
    interview = relationship('Interview', back_populates='claims')

def init_db():
    Base.metadata.create_all(bind=engine)
