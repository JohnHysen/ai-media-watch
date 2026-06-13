from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from ..db.base import Base


class AnalyticsResult(Base):
    __tablename__ = "analytics_results"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    verdict = Column(String, nullable=False)
    is_dangerous = Column(Boolean, nullable=False)
    confidence = Column(Float, nullable=False)
    reason = Column(String, nullable=False)
    time_seconds = Column(Float, nullable=False)
    created_at = Column(DateTime, nullable=False)
