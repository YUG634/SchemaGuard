import os
import subprocess
from pydantic_settings import BaseSettings

def get_git_commit() -> str:
    commit = os.getenv("GIT_COMMIT")
    if commit:
        return commit
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], stderr=subprocess.DEVNULL
        ).decode("ascii").strip()
    except Exception:
        return "0000000000000000000000000000000000000000"

class Settings(BaseSettings):
    SLUG: str = "schemaguard-mcp"
    SCHEMA_VERSION: int = 1
    COMMIT_HASH: str = get_git_commit()

settings = Settings()