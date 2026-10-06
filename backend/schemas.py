from datetime import date as date_type
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ExpenseCreate(BaseModel):
    amount: float = Field(gt=0, description="Must be greater than zero")
    category: str = Field(min_length=1, max_length=50)
    date: date_type
    description: str = Field(default="", max_length=200)


class ExpenseOut(ExpenseCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


class CategoryStat(BaseModel):
    category: str
    total: float
    count: int


class Stats(BaseModel):
    total: float
    count: int
    by_category: list[CategoryStat]


class ExpenseUpdate(BaseModel):
    """All fields optional: send only what you want to change."""
    amount: Optional[float] = Field(default=None, gt=0)
    category: Optional[str] = Field(default=None, min_length=1, max_length=50)
    date: Optional[date_type] = None
    description: Optional[str] = Field(default=None, max_length=200)


class BudgetIn(BaseModel):
    monthly_limit: float = Field(ge=0, description="0 clears the budget")


class BudgetOut(BaseModel):
    monthly_limit: Optional[float]  # None when no budget is set
    spent: float                    # spending in the current calendar month
    percent: Optional[float]        # spent / limit * 100 (None if no budget)