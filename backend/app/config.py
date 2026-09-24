import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./surplus_to_shelter.db")
    secret_key: str = os.getenv("SECRET_KEY", "local-development-only")
    debug: bool = os.getenv("DEBUG", "True").lower() == "true"
    cors_origins: list[str] = None

    def __post_init__(self):
        if self.cors_origins is None:
            object.__setattr__(
                self,
                "cors_origins",
                [
                    origin.strip()
                    for origin in os.getenv(
                        "CORS_ORIGINS",
                        "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173",
                    ).split(",")
                    if origin.strip()
                ],
            )


settings = Settings()