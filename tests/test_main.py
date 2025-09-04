# tests/test_main.py

import subprocess

def test_main_runs():
    """Check that main.py runs without crashing."""
    result = subprocess.run(
        ["python", "src/main.py"],
        capture_output=True,
        text=True
    )
    assert "GeoIntel system initialized" in result.stdout
