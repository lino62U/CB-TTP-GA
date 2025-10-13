import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "postgresql+psycopg2://admin:admin@localhost:5432/unsa_schedules"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
