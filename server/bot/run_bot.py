# run_bot.py
import os
import sys
from pathlib import Path

parent_dir = str(Path(__file__).parent.parent)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from bot.bot import main

if __name__ == "__main__":
    main()