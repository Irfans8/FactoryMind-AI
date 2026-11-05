from datetime import date
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import Base, engine, get_db
from models import ProductionRecord, RejectionRecord, DepartmentEntry
from schemas import ProductionIn, ProductionOut, RejectionIn, RejectionOut, DepartmentEntryIn, DepartmentEntryOut

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FactoryMind AI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "FactoryMind AI API is running"}

@app.get("/api/production", response_model=list[ProductionOut])
def list_production(
    start: Optional[date] = None,
    end: Optional[date] = None,
    db: Session = Depends(get_db)
):
    q = db.query(ProductionRecord)
    if start: q = q.filter(ProductionRecord.record_date >= start)
    if end: q = q.filter(ProductionRecord.record_date <= end)
    return q.order_by(ProductionRecord.record_date.desc(), ProductionRecord.id.desc()).all()

@app.post("/api/production", response_model=ProductionOut, status_code=201)
def add_production(payload: ProductionIn, db: Session = Depends(get_db)):
    row = ProductionRecord(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

@app.delete("/api/production/{record_id}")
def delete_production(record_id: int, db: Session = Depends(get_db)):
    row = db.query(ProductionRecord).filter_by(id=record_id).first()
    if not row: raise HTTPException(404, "Production record not found")
    db.delete(row)
    db.commit()
    return {"message": "Production record deleted"}

@app.get("/api/rejections", response_model=list[RejectionOut])
def list_rejections(
    start: Optional[date] = None,
    end: Optional[date] = None,
    db: Session = Depends(get_db)
):
    q = db.query(RejectionRecord)
    if start: q = q.filter(RejectionRecord.record_date >= start)
    if end: q = q.filter(RejectionRecord.record_date <= end)
    return q.order_by(RejectionRecord.record_date.desc(), RejectionRecord.id.desc()).all()

@app.post("/api/rejections", response_model=RejectionOut, status_code=201)
def add_rejection(payload: RejectionIn, db: Session = Depends(get_db)):
    row = RejectionRecord(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

@app.delete("/api/rejections/{record_id}")
def delete_rejection(record_id: int, db: Session = Depends(get_db)):
    row = db.query(RejectionRecord).filter_by(id=record_id).first()
    if not row: raise HTTPException(404, "Rejection record not found")
    db.delete(row)
    db.commit()
    return {"message": "Rejection record deleted"}

@app.get("/api/reports/summary")
def report_summary(
    start: Optional[date] = None,
    end: Optional[date] = None,
    db: Session = Depends(get_db)
):
    pq = db.query(ProductionRecord)
    rq = db.query(RejectionRecord)
    if start:
        pq = pq.filter(ProductionRecord.record_date >= start)
        rq = rq.filter(RejectionRecord.record_date >= start)
    if end:
        pq = pq.filter(ProductionRecord.record_date <= end)
        rq = rq.filter(RejectionRecord.record_date <= end)
    production = pq.all()
    rejection_rows = rq.all()

    target = sum(x.target_qty for x in production)
    actual = sum(x.actual_qty for x in production)
    rejected_from_production = sum(x.rejection_qty for x in production)
    rejection_logged = sum(x.quantity for x in rejection_rows)
    # Production form rejection is the primary dashboard metric. Separate
    # rejection log is an additional defect register, not added again.
    rejection = rejected_from_production
    good = actual - rejection
    machine_map = {}
    defect_map = {}
    for x in production:
        m = machine_map.setdefault(x.machine, {"machine": x.machine, "actual": 0, "rejection": 0})
        m["actual"] += x.actual_qty
        m["rejection"] += x.rejection_qty
    for x in rejection_rows:
        defect_map[x.defect_type] = defect_map.get(x.defect_type, 0) + x.quantity

    daily_map = {}
    for x in production:
        k = x.record_date.isoformat()
        daily_map[k] = daily_map.get(k, 0) + x.actual_qty

    return {
        "total_target": target,
        "total_actual": actual,
        "total_good": good,
        "total_rejection": rejection,
        "separately_logged_rejection": rejection_logged,
        "achievement_pct": round(actual / target * 100, 2) if target else 0,
        "rejection_pct": round(rejection / actual * 100, 2) if actual else 0,
        "machine_summary": list(machine_map.values()),
        "defect_summary": [{"defect_type": k, "quantity": v} for k, v in sorted(defect_map.items(), key=lambda x: x[1], reverse=True)],
        "daily_production": [{"date": k, "quantity": v} for k, v in sorted(daily_map.items())],
        "production_records": len(production),
    }


@app.get("/api/department-entries", response_model=list[DepartmentEntryOut])
def list_department_entries(
    department: Optional[str] = None,
    start: Optional[date] = None,
    end: Optional[date] = None,
    db: Session = Depends(get_db)
):
    q = db.query(DepartmentEntry)
    if department: q = q.filter(DepartmentEntry.department == department)
    if start: q = q.filter(DepartmentEntry.record_date >= start)
    if end: q = q.filter(DepartmentEntry.record_date <= end)
    return q.order_by(DepartmentEntry.record_date.desc(), DepartmentEntry.id.desc()).all()

@app.post("/api/department-entries", response_model=DepartmentEntryOut, status_code=201)
def add_department_entry(payload: DepartmentEntryIn, db: Session = Depends(get_db)):
    row = DepartmentEntry(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

@app.delete("/api/department-entries/{record_id}")
def delete_department_entry(record_id: int, db: Session = Depends(get_db)):
    row = db.query(DepartmentEntry).filter_by(id=record_id).first()
    if not row: raise HTTPException(404, "Department entry not found")
    db.delete(row)
    db.commit()
    return {"message": "Department entry deleted"}
