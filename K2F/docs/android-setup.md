# Run Keys2Fitness on Android

Run Expo commands from `K2F/` after completing [project setup](../../README.md#getting-started). Install [Expo Go](https://expo.dev/go) for **SDK 58**, the major version in [`package.json`](../package.json). Keep the Android SDK and emulator outside the repository.

## Physical phone

Run `npm start` and scan the QR code in Expo Go. The phone needs to reach the development computer on the network. If the LAN connection fails, use `npx expo start --tunnel`.

## Emulator

1. Install [Android Studio](https://developer.android.com/studio). Under **SDK Manager**, install the Android SDK, Platform-Tools, Android Emulator, and a system image.
2. Under **Device Manager**, create a virtual phone using that image and start it. For WSL, run Android Studio and the emulator on Windows and Metro in WSL.
3. Run `adb devices`. Once it lists the emulator as `device`, run `npm run android`. If Metro is already running, press `a` in its terminal.

### WSL with a Windows SDK

Use the SDK location shown by Android Studio. For a typical Windows installation, add this to `~/.bashrc`, replacing `YOUR_USERNAME`:

```bash
export WINDOWS_ANDROID_SDK="/mnt/c/Users/YOUR_USERNAME/AppData/Local/Android/Sdk"
export PATH="$WINDOWS_ANDROID_SDK/platform-tools:$WINDOWS_ANDROID_SDK/emulator:$PATH"
```

Run `source ~/.bashrc`, then `adb.exe devices` and `emulator.exe -list-avds`. If Windows lists the device but Expo reports `spawn adb ENOENT`, give Expo a Linux executable named `adb`:

```bash
mkdir -p "$HOME/.android-sdk/platform-tools"
```

Save this script as `~/.android-sdk/platform-tools/adb`:

```bash
#!/usr/bin/env bash
exec "$WINDOWS_ANDROID_SDK/platform-tools/adb.exe" "$@"
```

Run `chmod +x "$HOME/.android-sdk/platform-tools/adb"`. Add these lines **after** `WINDOWS_ANDROID_SDK` in `~/.bashrc`:

```bash
export ANDROID_HOME="$HOME/.android-sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
```

Reload `~/.bashrc` and check `"$ANDROID_HOME/platform-tools/adb" devices`. This shim is for running Expo Go with a Windows emulator. A native Android build needs a full SDK for its build host.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Expo Go reports an incompatible SDK | Check the `expo` major in `package.json`. Download the matching Android APK from [expo.dev/go](https://expo.dev/go) and drag it onto the emulator. Uninstalling Expo Go erases on-device demo data. |
| `adb devices` lists no emulator | Start the virtual device in Device Manager and wait for Android to boot. On WSL, check `adb.exe devices` first. |
| The emulator can't reach Metro on port 8081 | With Metro running, try `adb reverse tcp:8081 tcp:8081` and connect Expo Go to `exp://127.0.0.1:8081`. |
| Old routes appear after changing branches | Restart Metro with `npx expo start --clear`. |

For fixture cleanup and recovery before running an Android smoke test, see [smoke test cleanup](smoke-test-cleanup.md).
