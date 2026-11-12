"""Small stdlib-only Android UI driver for the Expo integration smoke test."""
import re
import subprocess
import time
import xml.etree.ElementTree as ET


def adb(*args):
    return subprocess.check_output(["adb", *args], text=True, stderr=subprocess.DEVNULL, timeout=30)


def snapshot():
    for _ in range(3):
        response = adb("shell", "uiautomator", "dump", "/sdcard/k2f-workout-flow.xml")
        if "ERROR" not in response:
            return list(ET.fromstring(adb("exec-out", "cat", "/sdcard/k2f-workout-flow.xml")).iter("node"))
        time.sleep(1)
    raise AssertionError("Android accessibility hierarchy did not become idle")


def matches(node, label):
    return node.get("content-desc") == label or node.get("text") == label


def wait_for(label, timeout=40):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        nodes = snapshot()
        if any(matches(node, label) for node in nodes):
            return nodes
        time.sleep(1)
    raise AssertionError("Missing UI element: " + label)


def bounds(node):
    return tuple(map(int, re.findall(r"\d+", node.get("bounds", ""))))


def tap_node(node):
    left, top, right, bottom = bounds(node)
    adb("shell", "input", "tap", str((left + right) // 2), str((top + bottom) // 2))
    time.sleep(2)


def scroll_to(label, editable=False):
    width, height = map(int, re.findall(r"(\d+)x(\d+)", adb("shell", "wm", "size"))[-1])
    density = int(re.findall(r"density:\s*(\d+)", adb("shell", "wm", "density"))[-1])
    # Stay within centered content but outside multiline inputs, which can consume a swipe.
    x = int((width - min(width, 600 * density / 160)) / 2 + 12 * density / 160)
    for direction in ("down", "up"):
        for _ in range(18):
            for node in snapshot():
                if matches(node, label) and (not editable or node.get("class") == "android.widget.EditText"):
                    _, top, _, bottom = bounds(node)
                    if height * .13 < top < bottom < height * .86:
                        return node
            start, end = (height * 3 // 4, height // 3) if direction == "down" else (height // 3, height * 3 // 4)
            adb("shell", "input", "swipe", str(x), str(start), str(x), str(end), "350")
            time.sleep(.5)
    raise AssertionError("Could not reach UI element: " + label)


def tap(label):
    tap_node(scroll_to(label))


def fill(label, text):
    node = scroll_to(label, editable=True)
    previous = node.get("text", "")
    tap_node(node)
    adb("shell", "input", "keyevent", "123")
    if previous:
        adb("shell", "input", "keyevent", *(["67"] * (len(previous) + 2)))
        # Let controlled React inputs process deletion before the next input batch.
        time.sleep(1)
    if text:
        adb("shell", "input", "text", text.replace(" ", "%s"))
    adb("shell", "input", "keyevent", "111")
    time.sleep(1)
    actual = next((node.get("text") for node in snapshot()
                   if node.get("content-desc") == label and node.get("class") == "android.widget.EditText"), None)
    assert actual == text, (label, actual, text)


def open_route(path, base_url):
    adb("shell", "am", "start", "-W", "-a", "android.intent.action.VIEW", "-d", base_url.rstrip("/") + "/--/" + path)
    time.sleep(4)


def delete_test_template(title, base_url):
    """Remove only the exact test template; assignment/history snapshots remain available."""
    open_route("coach/workouts", base_url)
    fill("Search workout templates", title)
    tap("Delete " + title)
    wait_for("Delete Workout Template?")
    tap("Delete template")
    wait_for("Template deleted.")
