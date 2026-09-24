from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Analysis(Base):
    __tablename__ = 'analysis'

    id = Column(Integer, primary_key=True, index=True)
    crop_name = Column(String, index=True)
    health_status = Column(String)
    likely_disease = Column(String)
    confidence_percentage = Column(Float)
    severity = Column(String)
    symptoms = Column(String)
    recommendations = Column(String)