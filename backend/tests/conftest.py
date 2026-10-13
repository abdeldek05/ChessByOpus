"""Rend les modules du backend importables depuis les tests (radar, pawn_track…)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
