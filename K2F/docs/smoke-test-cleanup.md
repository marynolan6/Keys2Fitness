# Automatic Android smoke-test cleanup

All six Android smoke drivers now run inside `tests/helpers/workout_sandbox.py`:

- `workout-flow-smoke.py`
- `workout-assignment-smoke.py`
- `workout-completion-smoke.py`
- `workout-prescriptions-smoke.py`
- `exercise-modal-smoke.py`
- `exercise-completion-smoke.py`

## Lifecycle

Each run captures the original local workout storage and restores it in `finally`, after success, an assertion failure, Ctrl+C, or handled SIGTERM. This removes test-created templates, assigned copies, checkpoints and completion history, and restores the original preview client. The two sample-exercise drivers temporarily start with a fresh `today` checkpoint and client 1, then restore the exact original checkpoint/history and client selection.

Cleanup restores only these storage keys:

```text
keys2fitness:workout-library:v1
keys2fitness:workout-session:*
```

Profile, authentication, messaging and Firebase data are outside this scope. Existing workout values are preserved byte-for-byte, including opaque/legacy serialized fields. Originally absent keys are removed rather than replaced with test defaults. This is test tooling, not an application history-deletion API.

Before restoring, the helper navigates away from the workout and waits for controller cleanup and both persistence queues. After restoring, it verifies the saved baseline and reloads Expo Go so the adapter read model cannot retain deleted fixtures. Failed/partial restoration is retryable; cleanup failures fail the smoke run rather than reporting success.

## Running

Use one development emulator **exclusively and serially** for smoke runs: the sandbox restores the pre-run workout baseline, including workouts edited during the run. Start the matching Expo Go app and this checkout's Metro server first:

```bash
# From K2F/, with Expo running and Expo Go connected:
adb reverse tcp:8081 tcp:8081
python3 -B tests/workout-assignment-smoke.py
python3 -B tests/workout-completion-smoke.py
python3 -B tests/workout-prescriptions-smoke.py
python3 -B tests/workout-flow-smoke.py --source "Builder Demo Plan"
```

The shared Hermes bridge uses Metro's existing `ws` dependency, with no new package or production route. It checks that Metro serves this checkout. `K2F_METRO_URL` can override the host-side default `http://127.0.0.1:8081`; the architecture driver's `--base-url` independently controls the device launch URL.

Fixture titles include a timestamp and random suffix. Runs are now self-contained: the old `--resume-title`, prescription `--phase` / `--title`, and `--keep-template` debug flows have been retired so they cannot intentionally leave fixture data behind. The architecture driver's template-deletion assertion still runs before final sandbox restoration.

## Recovery after a disconnect or forced process kill

The helper saves a temporary workout-only JSON backup before test setup. Successful cleanup removes it. If cleanup fails, the console prints the retained backup path and recovery command. Once the same checkout's Metro/Expo Go session is connected, restore it with:

```bash
node tests/helpers/expo-smoke.mjs restore < /path/printed/k2f-smoke-BACKUP.json
```

A SIGKILL or host shutdown cannot execute Python's `finally`; the `k2f-smoke-*.json` file remains in the host's temporary directory. Restore the applicable backup before another run. The recovery operation verifies storage and reloads the app just like automatic cleanup.

## Verification

```bash
npm run test:workouts
python3 -B tests/workout-sandbox-test.py
npx tsc --noEmit
npx expo lint
```

- **8 cleanup storage regressions**, included in the **94-test workout suite**: scope isolation, exact restoration, initially absent keys, idempotence, malformed backups, write/delete failure recovery, and interrupted capture.
- **5 Python lifecycle tests**: success, assertion/keyboard interruption, preparation failure, cleanup failure with recovery backup, and SIGTERM-handler restoration.
- Full updated **assignment smoke passed** on the connected Android emulator, including repeated assignments and process restart, then restored the pre-run workout data.
- A native failure-path check created a template, assignment, completed attempt/history and temporary sample-workout edit, intentionally raised an assertion, and verified byte-for-byte restoration by the shared sandbox.
- Existing leftovers were removed once: **10 timestamped smoke assignments and 4 associated session/archive records**. Four original templates, two original Builder Demo Plan assigned copies and three other session records were preserved. The pre-cleanup workout backup is kept outside the repository.

The full six-driver acceptance suite was not rerun for this cleanup change. The assignment driver and native failure-path check verify the shared integration; all six entry points use that same sandbox. TypeScript and changed-file lint pass; full-source lint retains the existing 33 errors and 2 warnings.
