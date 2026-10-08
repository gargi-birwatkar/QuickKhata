import os
from pathlib import Path
from dotenv import load_dotenv

# Locate and load .env file from backend directory
base_dir = Path(__file__).resolve().parent.parent
env_path = base_dir / ".env"
load_dotenv(dotenv_path=env_path)

MINIMOTH_API_KEY = os.getenv("MINIMOTH_API_KEY", "mm_test_your_sandbox_key")
MINIMOTH_BASE_URL = os.getenv("MINIMOTH_BASE_URL", "https://api.minimoth.dev/v1").rstrip("/")
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")
ALLOW_MOCK_FALLBACK = os.getenv("ALLOW_MOCK_FALLBACK", "true").lower() in ("true", "1", "yes")

# Check if real API key is configured
IS_DEMO_KEY = (
    not MINIMOTH_API_KEY
    or MINIMOTH_API_KEY == "mm_test_your_sandbox_key"
    or MINIMOTH_API_KEY.strip() == ""
)
