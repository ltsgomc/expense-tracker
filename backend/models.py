from sqlalchemy import Column, Date, Float, Integer, String

from database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    category = Column(String(50), nullable=False, index=True)
    date = Column(Date, nullable=False)
    description = Column(String(200), default="")


class Budget(Base):
    """Single-row table (id=1) holding the monthly spending limit."""
    __tablename__ = "budget"

    id = Column(Integer, primary_key=True)
    monthly_limit = Column(Float, nullable=False, default=0)