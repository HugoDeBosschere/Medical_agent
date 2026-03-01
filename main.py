"""
Loumavia — Single-command launcher.

Starts the FastAPI backend (port 8000) and the Vite frontend (port 8080),
then opens the app in the default browser.

Usage:
    python main.py
"""

import os
import platform
import signal
import subprocess
import sys
import time
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT / "src" / "frontend"

BACKEND_PORT = 8000
FRONTEND_PORT = 8080
FRONTEND_URL = f"http://localhost:{FRONTEND_PORT}"


def main():
    procs: list[subprocess.Popen] = []

    # On Unix, we start processes in their own process group.
    # This ensures child processes (like uvicorn workers) are grouped 
    # and can be killed together, while also protecting them from the 
    # initial Ctrl+C (so our Python script handles cleanup cleanly).
    popen_kwargs = {}
    if platform.system() != "Windows":
        popen_kwargs["preexec_fn"] = os.setsid

    try:
        # --- 1. Start FastAPI backend ---
        print(f"[backend]  Starting uvicorn on port {BACKEND_PORT} ...")
        backend = subprocess.Popen(
            [
                sys.executable, "-m", "uvicorn",
                "src.api.main:app",
                "--host", "0.0.0.0",
                "--port", str(BACKEND_PORT),
                "--reload",
            ],
            cwd=str(ROOT),
            **popen_kwargs
        )
        procs.append(backend)

        # --- 2. Start Vite frontend ---
        print(f"[frontend] Starting Vite dev server on port {FRONTEND_PORT} ...")
        frontend = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=str(FRONTEND_DIR),
            shell=True,  # needed on Windows for npm
            **popen_kwargs
        )
        procs.append(frontend)

        # --- 3. Open browser after a short delay ---
        time.sleep(3)
        print(f"[browser]  Opening {FRONTEND_URL}")
        webbrowser.open(FRONTEND_URL)

        # --- 4. Wait for either process to exit ---
        print("[ready]    Press Ctrl+C to stop both servers.\n")
        while True:
            for p in procs:
                ret = p.poll()
                if ret is not None:
                    print(f"\n[exit]     Process (pid {p.pid}) exited with code {ret}.")
                    raise SystemExit(ret)
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[stop]     Shutting down ...")
    finally:
        for p in procs:
            if p.poll() is None:
                try:
                    if platform.system() == "Windows":
                        # /F forces termination, /T kills child processes (process tree)
                        subprocess.call(
                            ["taskkill", "/F", "/T", "/PID", str(p.pid)],
                            stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL
                        )
                    else:
                        # Kill the entire process group
                        os.killpg(os.getpgid(p.pid), signal.SIGTERM)
                except Exception as e:
                    print(f"[stop]     Failed to kill process tree for {p.pid}: {e}")
                    
        # Give them a brief moment to exit cleanly
        for p in procs:
            try:
                p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                pass # Already tried our best to force-kill the tree
        print("[done]     All servers stopped.")


if __name__ == "__main__":
    main()