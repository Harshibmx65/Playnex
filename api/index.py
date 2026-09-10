import sys
import os

# Add backend directory to sys.path so app modules resolve correctly
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(parent_dir, "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
