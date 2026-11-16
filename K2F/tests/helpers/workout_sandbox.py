"""Restore local workout fixtures after each exclusive-emulator smoke run."""
from contextlib import contextmanager
import json
from pathlib import Path
import signal
import subprocess
import tempfile
import time
import uuid

BRIDGE = Path(__file__).with_name("expo-smoke.mjs")


def runtime(action, value=None):
    result = subprocess.run(["node", str(BRIDGE), action], input=json.dumps(value),
                            text=True, capture_output=True, timeout=120)
    if result.returncode:
        raise RuntimeError(f"Expo smoke {action} failed:\n{result.stderr}")
    return json.loads(result.stdout)


def smoke_title(feature):
    return f"{feature} smoke {int(time.time())}-{uuid.uuid4().hex[:8]}"


@contextmanager
def workout_sandbox(*, reset_workouts=(), preview_client=None):
    baseline = runtime("capture")
    # Keep a recovery artifact if the emulator disconnects or cleanup itself fails.
    with tempfile.NamedTemporaryFile(mode="w", prefix="k2f-smoke-", suffix=".json", delete=False) as backup:
        json.dump(baseline, backup)
    previous = signal.getsignal(signal.SIGTERM)

    def interrupted(_signal, _frame):
        raise KeyboardInterrupt("Smoke test terminated; restoring workout fixtures")

    signal.signal(signal.SIGTERM, interrupted)
    try:
        if reset_workouts or preview_client is not None:
            runtime("prepare", {"resetWorkoutIds": list(reset_workouts), "previewClientId": preview_client})
        yield
    finally:
        signal.signal(signal.SIGTERM, previous)
        try:
            result = runtime("restore", baseline)
        except BaseException:
            print(f"Workout cleanup incomplete. Recovery backup: {backup.name}", flush=True)
            print(f"Retry: node {BRIDGE} restore < {backup.name}", flush=True)
            raise
        else:
            Path(backup.name).unlink()
            print(f"Cleanup: restored the pre-test library, assignments and sessions; removed {result['removed']} new storage keys.", flush=True)
