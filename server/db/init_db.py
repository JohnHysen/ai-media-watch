from .base import Base
from .session import engine
from server import models_db


def init_db():
    Base.metadata.create_all(bind=engine)
