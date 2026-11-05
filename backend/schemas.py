from datetime import date
from pydantic import BaseModel, Field, ConfigDict, model_validator

class ProductionIn(BaseModel):
    record_date: date
    shift: str = Field(min_length=1, max_length=20)
    time_slot: str = Field(min_length=1, max_length=30)
    machine: str = Field(min_length=1, max_length=80)
    operator: str = Field(min_length=1, max_length=100)
    part_name: str = Field(min_length=1, max_length=120)
    target_qty: int = Field(ge=0)
    actual_qty: int = Field(ge=0)
    rejection_qty: int = Field(ge=0)
    remarks: str = ""

    @model_validator(mode="after")
    def validate_counts(self):
        if self.rejection_qty > self.actual_qty:
            raise ValueError("Rejection cannot exceed actual production")
        return self

class ProductionOut(ProductionIn):
    id: int
    model_config = ConfigDict(from_attributes=True)

class RejectionIn(BaseModel):
    record_date: date
    shift: str
    machine: str
    part_name: str
    defect_type: str
    quantity: int = Field(gt=0)
    operator: str = ""
    remarks: str = ""

class RejectionOut(RejectionIn):
    id: int
    model_config = ConfigDict(from_attributes=True)

class DepartmentEntryIn(BaseModel):
    department: str = Field(min_length=2, max_length=60)
    record_date: date
    title: str = Field(min_length=2, max_length=160)
    category: str = Field(min_length=1, max_length=100)
    reference: str = ""
    status: str = Field(min_length=1, max_length=40)
    owner: str = ""
    quantity: int = Field(ge=0)
    remarks: str = ""

class DepartmentEntryOut(DepartmentEntryIn):
    id: int
    model_config = ConfigDict(from_attributes=True)
