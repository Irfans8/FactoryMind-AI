from sqlalchemy import Column, Integer, String, Date, DateTime, Text, func
from database import Base

class ProductionRecord(Base):
    __tablename__ = "production_records"
    id = Column(Integer, primary_key=True, index=True)
    record_date = Column(Date, nullable=False, index=True)
    shift = Column(String(20), nullable=False)
    time_slot = Column(String(30), nullable=False)
    machine = Column(String(80), nullable=False)
    operator = Column(String(100), nullable=False)
    part_name = Column(String(120), nullable=False)
    target_qty = Column(Integer, nullable=False, default=0)
    actual_qty = Column(Integer, nullable=False, default=0)
    rejection_qty = Column(Integer, nullable=False, default=0)
    remarks = Column(Text, default="")
    created_at = Column(DateTime, server_default=func.now())

    @property
    def good_qty(self):
        return self.actual_qty - self.rejection_qty

class RejectionRecord(Base):
    __tablename__ = "rejection_records"
    id = Column(Integer, primary_key=True, index=True)
    record_date = Column(Date, nullable=False, index=True)
    shift = Column(String(20), nullable=False)
    machine = Column(String(80), nullable=False)
    part_name = Column(String(120), nullable=False)
    defect_type = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False)
    operator = Column(String(100), default="")
    remarks = Column(Text, default="")
    created_at = Column(DateTime, server_default=func.now())

class DepartmentEntry(Base):
    __tablename__ = "department_entries"
    id = Column(Integer, primary_key=True, index=True)
    department = Column(String(60), nullable=False, index=True)
    record_date = Column(Date, nullable=False, index=True)
    title = Column(String(160), nullable=False)
    category = Column(String(100), nullable=False, default="General")
    reference = Column(String(120), default="")
    status = Column(String(40), nullable=False, default="Open")
    owner = Column(String(100), default="")
    quantity = Column(Integer, nullable=False, default=0)
    remarks = Column(Text, default="")
    created_at = Column(DateTime, server_default=func.now())
