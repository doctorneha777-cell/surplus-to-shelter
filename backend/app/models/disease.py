from sqlalchemy import Column, Integer, String, Text
from database import Base

class Disease(Base):
    __tablename__ = 'diseases'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    symptoms = Column(Text)
    causes = Column(Text)
    prevention = Column(Text)

    def __repr__(self):
        return f"<Disease(name={self.name}, symptoms={self.symptoms}, causes={self.causes}, prevention={self.prevention})>"