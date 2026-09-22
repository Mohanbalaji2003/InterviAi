import os
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, JSON, LargeBinary, String, Text, ForeignKey, create_engine, inspect, text
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
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    name = Column(String(120), nullable=True)
    email = Column(String(255), nullable=True)
    target_role = Column(String(120), nullable=True)
    candidate_type = Column(String(40), nullable=True)
    experience_years = Column(String(40), nullable=True)
    resume_text = Column(Text, nullable=True)
    skills = Column(JSON, nullable=False, default=list)
    active_resume_filename = Column(String(255), nullable=True)
    active_resume_text = Column(Text, nullable=True)
    active_resume_skills = Column(JSON, nullable=True, default=list)
    active_resume_claims = Column(JSON, nullable=True, default=list)
    active_resume_updated_at = Column(DateTime, nullable=True)
    active_project_name = Column(String(255), nullable=True)
    active_project_text = Column(Text, nullable=True)
    active_project_files = Column(JSON, nullable=True, default=list)
    active_project_updated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    interviews = relationship('Interview', back_populates='candidate', cascade='all, delete-orphan')
    user = relationship('User', foreign_keys=[user_id], uselist=False)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    name = Column(String(120), nullable=False)
    password_hash = Column(String(255), nullable=False)
    candidate_id = Column(Integer, ForeignKey('candidates.id'), nullable=True, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    candidate = relationship('Candidate', foreign_keys=[candidate_id], uselist=False)
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
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user = relationship('User')

class Interview(Base):
    __tablename__ = 'interviews'
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey('candidates.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    job_role = Column(String(120), nullable=False)
    total_questions = Column(Integer, nullable=False)
    overall_score = Column(Float, nullable=True)
    readiness_score = Column(Float, nullable=True)
    report_data = Column(JSON, nullable=True)
    status = Column(String(40), nullable=False, default='created')
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    candidate = relationship('Candidate', back_populates='interviews')
    user = relationship('User')
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
    # Perform idempotent column checks for non-destructive migrations
    inspector = inspect(engine)
    with engine.begin() as conn:
        def add_column_if_missing(table_name, column_name, column_type_sql):
            columns = [c['name'] for c in inspector.get_columns(table_name)]
            if column_name not in columns:
                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type_sql}"))

        if 'candidates' in inspector.get_table_names():
            add_column_if_missing('candidates', 'user_id', 'INTEGER')
            add_column_if_missing('candidates', 'active_resume_filename', 'VARCHAR(255)')
            add_column_if_missing('candidates', 'active_resume_text', 'TEXT')
            add_column_if_missing('candidates', 'active_resume_skills', 'JSON' if not DATABASE_URL.startswith('sqlite') else 'TEXT')
            add_column_if_missing('candidates', 'active_resume_claims', 'JSON' if not DATABASE_URL.startswith('sqlite') else 'TEXT')
            add_column_if_missing('candidates', 'active_resume_updated_at', 'TIMESTAMP' if not DATABASE_URL.startswith('sqlite') else 'DATETIME')
            add_column_if_missing('candidates', 'active_project_name', 'VARCHAR(255)')
            add_column_if_missing('candidates', 'active_project_text', 'TEXT')
            add_column_if_missing('candidates', 'active_project_files', 'JSON' if not DATABASE_URL.startswith('sqlite') else 'TEXT')
            add_column_if_missing('candidates', 'active_project_updated_at', 'TIMESTAMP' if not DATABASE_URL.startswith('sqlite') else 'DATETIME')

        if 'interviews' in inspector.get_table_names():
            add_column_if_missing('interviews', 'user_id', 'INTEGER')
            add_column_if_missing('interviews', 'report_data', 'JSON' if not DATABASE_URL.startswith('sqlite') else 'TEXT')

        if 'uploaded_files' in inspector.get_table_names():
            add_column_if_missing('uploaded_files', 'is_active', 'BOOLEAN DEFAULT TRUE')

