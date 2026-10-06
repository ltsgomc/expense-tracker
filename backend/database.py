from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./expenses.db"

# check_same_thread=False lets FastAPI's worker threads share the SQLite connection
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    """FastAPI dependency: one DB session per request, always closed afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
