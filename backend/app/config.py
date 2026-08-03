from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"
DATASET_DIR = DATA_DIR / "dataset"
TEMP_DIR = DATA_DIR / "temp"
UPLOAD_DIR = DATA_DIR / "uploads"

DATABASE_URL = f"sqlite:///{DATA_DIR / 'cafeteria.db'}"

DATA_DIR.mkdir(parents=True, exist_ok=True)
DATASET_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)