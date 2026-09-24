from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.domain import Driver, RecipientOrganization
from app.schemas.network import DriverCreate, DriverRead, DriverUpdate, RecipientCreate, RecipientRead

router = APIRouter(tags=["rescue network"])


@router.post("/recipients", response_model=RecipientRead, status_code=status.HTTP_201_CREATED)
def create_recipient(payload: RecipientCreate, db: Session = Depends(get_db)) -> RecipientOrganization:
    recipient = RecipientOrganization(**payload.model_dump())
    db.add(recipient)
    db.commit()
    db.refresh(recipient)
    return recipient


@router.get("/recipients", response_model=list[RecipientRead])
def list_recipients(db: Session = Depends(get_db)) -> list[RecipientOrganization]:
    return db.query(RecipientOrganization).order_by(RecipientOrganization.name).all()


@router.post("/drivers", response_model=DriverRead, status_code=status.HTTP_201_CREATED)
def create_driver(payload: DriverCreate, db: Session = Depends(get_db)) -> Driver:
    driver = Driver(**payload.model_dump())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


@router.get("/drivers", response_model=list[DriverRead])
def list_drivers(db: Session = Depends(get_db)) -> list[Driver]:
    return db.query(Driver).order_by(Driver.name).all()


@router.get("/drivers/{driver_id}", response_model=DriverRead)
def get_driver(driver_id: int, db: Session = Depends(get_db)) -> Driver:
    driver = db.get(Driver, driver_id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver


@router.patch("/drivers/{driver_id}", response_model=DriverRead)
def update_driver(driver_id: int, payload: DriverUpdate, db: Session = Depends(get_db)) -> Driver:
    driver = db.get(Driver, driver_id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(driver, key, value)
    db.commit()
    db.refresh(driver)
    return driver