from datetime import date
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
import schemas
from database import Base, engine, get_db

Base.metadata.create_all(bind=engine)  # creates any missing tables (incl. new "budget")

app = FastAPI(title="Expense Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # fine for local use; restrict to your domain if you deploy
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Expenses ----------
@app.post("/api/expenses", response_model=schemas.ExpenseOut, status_code=201)
def add_expense(payload: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    expense = models.Expense(**payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@app.get("/api/expenses", response_model=list[schemas.ExpenseOut])
def list_expenses(db: Session = Depends(get_db)):
    return (
        db.query(models.Expense)
        .order_by(models.Expense.date.desc(), models.Expense.id.desc())
        .all()
    )


@app.put("/api/expenses/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(expense_id: int, payload: schemas.ExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.get(models.Expense, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    # exclude_unset: only touch fields the client actually sent
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is None:
            raise HTTPException(status_code=422, detail=f"'{field}' cannot be null")
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


@app.delete("/api/expenses/{expense_id}", status_code=204)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.get(models.Expense, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()


# ---------- Stats ----------
@app.get("/api/stats", response_model=schemas.Stats)
def get_stats(db: Session = Depends(get_db)):
    rows = (
        db.query(
            models.Expense.category,
            func.sum(models.Expense.amount),
            func.count(models.Expense.id),
        )
        .group_by(models.Expense.category)
        .order_by(func.sum(models.Expense.amount).desc())
        .all()
    )
    by_category = [
        schemas.CategoryStat(category=c, total=round(t, 2), count=n) for c, t, n in rows
    ]
    return schemas.Stats(
        total=round(sum(r.total for r in by_category), 2),
        count=sum(r.count for r in by_category),
        by_category=by_category,
    )


# ---------- Budget ----------
def _budget_status(db: Session) -> schemas.BudgetOut:
    today = date.today()
    month_start = today.replace(day=1)
    next_month = (month_start.replace(year=month_start.year + 1, month=1)
                  if month_start.month == 12 else month_start.replace(month=month_start.month + 1))
    spent = (
        db.query(func.coalesce(func.sum(models.Expense.amount), 0.0))
        .filter(models.Expense.date >= month_start, models.Expense.date < next_month)
        .scalar()
    )
    row = db.get(models.Budget, 1)
    limit = row.monthly_limit if row and row.monthly_limit > 0 else None
    return schemas.BudgetOut(
        monthly_limit=limit,
        spent=round(spent, 2),
        percent=round(spent / limit * 100, 1) if limit else None,
    )


@app.get("/api/budget", response_model=schemas.BudgetOut)
def get_budget(db: Session = Depends(get_db)):
    return _budget_status(db)


@app.put("/api/budget", response_model=schemas.BudgetOut)
def set_budget(payload: schemas.BudgetIn, db: Session = Depends(get_db)):
    row = db.get(models.Budget, 1)
    if row is None:
        row = models.Budget(id=1, monthly_limit=payload.monthly_limit)
        db.add(row)
    else:
        row.monthly_limit = payload.monthly_limit
    db.commit()
    return _budget_status(db)


# Serve the frontend at "/" (mounted last so /api routes take priority)
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")