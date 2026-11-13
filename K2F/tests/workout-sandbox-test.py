"""Host-side lifetime tests; no emulator or Metro process is required."""
from contextlib import redirect_stdout
import io
import json
from pathlib import Path
import signal
import tempfile
import unittest
from unittest.mock import patch

from helpers import workout_sandbox as sandbox


class SandboxTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        original = tempfile.NamedTemporaryFile
        factory = patch.object(sandbox.tempfile, "NamedTemporaryFile", side_effect=lambda **kw: original(dir=self.directory.name, **kw))
        factory.start()
        self.addCleanup(factory.stop)
        self.baseline = [["keys2fitness:workout-library:v1", "original"]]

    def fake_runtime(self, action, _value=None):
        return self.baseline if action == "capture" else {"removed": 2}

    def assert_no_backups(self):
        self.assertEqual(list(Path(self.directory.name).iterdir()), [])

    def test_success_cleans_up_and_removes_backup(self):
        with patch.object(sandbox, "runtime", side_effect=self.fake_runtime) as runtime, redirect_stdout(io.StringIO()):
            with sandbox.workout_sandbox():
                pass
        self.assertEqual([call.args[0] for call in runtime.call_args_list], ["capture", "restore"])
        self.assertEqual(runtime.call_args_list[-1].args[1], self.baseline)
        self.assert_no_backups()

    def test_assertion_failure_and_keyboard_interrupt_still_restore(self):
        for error in (AssertionError("smoke failed"), KeyboardInterrupt()):
            with self.subTest(error=type(error).__name__), patch.object(sandbox, "runtime", side_effect=self.fake_runtime) as runtime, redirect_stdout(io.StringIO()):
                with self.assertRaises(type(error)):
                    with sandbox.workout_sandbox():
                        raise error
                self.assertEqual(runtime.call_args_list[-1].args, ("restore", self.baseline))
                self.assert_no_backups()

    def test_failed_preparation_restores_before_yield(self):
        def runtime(action, value=None):
            if action == "prepare":
                raise RuntimeError("prepare failed")
            return self.fake_runtime(action, value)
        with patch.object(sandbox, "runtime", side_effect=runtime) as calls, redirect_stdout(io.StringIO()):
            with self.assertRaisesRegex(RuntimeError, "prepare failed"):
                with sandbox.workout_sandbox(reset_workouts=("today",), preview_client="1"):
                    self.fail("failed setup must not start the test")
        self.assertEqual([call.args[0] for call in calls.call_args_list], ["capture", "prepare", "restore"])
        self.assert_no_backups()

    def test_cleanup_failure_keeps_recoverable_backup_and_fails_the_run(self):
        def runtime(action, value=None):
            if action == "restore":
                raise RuntimeError("emulator disconnected")
            return self.fake_runtime(action, value)
        output = io.StringIO()
        with patch.object(sandbox, "runtime", side_effect=runtime), redirect_stdout(output):
            with self.assertRaisesRegex(RuntimeError, "emulator disconnected"):
                with sandbox.workout_sandbox():
                    pass
        backups = list(Path(self.directory.name).glob("*.json"))
        self.assertEqual(len(backups), 1)
        self.assertEqual(json.loads(backups[0].read_text()), self.baseline)
        self.assertIn(str(backups[0]), output.getvalue())

    def test_sigterm_uses_finally_and_restores_previous_handler(self):
        previous = signal.getsignal(signal.SIGTERM)
        with patch.object(sandbox, "runtime", side_effect=self.fake_runtime) as runtime, redirect_stdout(io.StringIO()):
            with self.assertRaises(KeyboardInterrupt):
                with sandbox.workout_sandbox():
                    signal.getsignal(signal.SIGTERM)(signal.SIGTERM, None)
        self.assertEqual(runtime.call_args_list[-1].args, ("restore", self.baseline))
        self.assertEqual(signal.getsignal(signal.SIGTERM), previous)
        self.assert_no_backups()


if __name__ == "__main__":
    unittest.main()
