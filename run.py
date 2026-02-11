import subprocess
import sys
import os
import time
from datetime import datetime

BOT_FILE = "index.js"
NODE_CMD = "node"
RESTART_DELAY = 5  # seconds


def log(msg):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")


def check_env():
    if not os.path.exists(".env"):
        log("⚠️  .env file not found")
    if not os.path.exists(BOT_FILE):
        log(f"❌ {BOT_FILE} not found")
        sys.exit(1)


def run_bot():
    while True:
        log("🚀 Starting Telegram Superbot...")
        process = subprocess.Popen(
            [NODE_CMD, BOT_FILE],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )

        try:
            for line in process.stdout:
                print(line, end="")
        except KeyboardInterrupt:
            log("🛑 Stopping bot...")
            process.terminate()
            sys.exit(0)

        exit_code = process.wait()
        log(f"⚠️ Bot crashed (code {exit_code})")
        log(f"🔁 Restarting in {RESTART_DELAY} seconds...")
        time.sleep(RESTART_DELAY)


if __name__ == "__main__":
    check_env()
    run_bot()
