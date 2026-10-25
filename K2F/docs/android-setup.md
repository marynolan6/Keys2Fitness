# Android Development Setup

This guide explains how to run Keys2Fitness on an Android emulator using Expo.

The Android SDK is installed per developer machine. It should not be committed to this repository.

## WSL Setup Recommendation

If you are running the project through Windows Subsystem for Linux (WSL), install Android Studio, the Android SDK, and the Android emulator on the Windows host rather than inside WSL.

The recommended arrangement is:

```text
Expo project and Node commands: WSL
Android Studio and emulator:    Windows
```

This avoids common WSL emulator problems involving graphical output, hardware acceleration, virtualization, and emulator networking.

Use an Ubuntu/WSL terminal for the commands in this guide. Do not run the Expo commands from a Windows PowerShell terminal unless the project and Node installation are also configured on Windows.

You have two practical options:

### Option A: Use Expo Go

This is the simplest option and does not require the Android SDK or emulator:

1. Install Expo Go on an Android phone.
2. Start the project from WSL.
3. Scan the Expo QR code with the phone.

```bash
npx expo start
```

The phone and computer must be able to communicate over the network. If the normal connection does not work, try Expo's tunnel mode:

```bash
npx expo start --tunnel
```

### Option B: Use A Windows Emulator

Install Android Studio on Windows from:

<https://developer.android.com/studio>

Use Android Studio on Windows to install the SDK, create an Android Virtual Device, and start the emulator. Then run Expo from the WSL project directory.

Start the emulator manually in Android Studio before launching the project from WSL. Depending on the WSL and Windows PATH configuration, the `a` shortcut may not automatically find the Windows emulator. The compatibility setup below makes Expo's Linux-side Android lookup work with the Windows SDK.

The Windows SDK is commonly located at:

```text
C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk
```

From WSL, that path is usually available as:

```text
/mnt/c/Users/YOUR_USERNAME/AppData/Local/Android/Sdk
```

Do not copy the Windows SDK into the repository or into the WSL project directory.

### WSL Environment Variables

The Windows SDK is visible from WSL through `/mnt/c`. Replace `YOUR_USERNAME` with the Windows username shown in Android Studio's SDK Manager. For example, the SDK path for a Windows user named `Spencer` is:

```text
/mnt/c/Users/Spencer/AppData/Local/Android/Sdk
```

First add the Windows SDK path to `~/.bashrc`:

```bash
export ANDROID_SDK_ROOT="/mnt/c/Users/YOUR_USERNAME/AppData/Local/Android/Sdk"
export PATH="$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/emulator:$PATH"
```

Reload the shell and verify that WSL can run the Windows tools:

```bash
source ~/.bashrc
adb.exe version
adb.exe devices
```

The running emulator should appear in the device list. If `/mnt/c` is not available, run `wsl --shutdown` from Windows PowerShell, reopen Ubuntu, and try again. Do not copy the SDK into the repository or replace the path with `/root/Android/Sdk` unless the SDK was intentionally installed inside WSL.

### Expo `adb` Compatibility Shim

Expo looks for an executable named `adb`, but the Windows SDK provides `adb.exe`. If Expo reports `spawn adb ENOENT` or tries to open a default path such as `/root/Android/Sdk`, create a small WSL shim that forwards Expo's calls to the Windows executable:

```bash
mkdir -p "$HOME/.android-sdk/platform-tools"
nano "$HOME/.android-sdk/platform-tools/adb"
```

Paste this into the file, replacing `YOUR_USERNAME`:

```bash
#!/usr/bin/env bash
exec "/mnt/c/Users/YOUR_USERNAME/AppData/Local/Android/Sdk/platform-tools/adb.exe" "$@"
```

Save the file, then make it executable:

```bash
chmod +x "$HOME/.android-sdk/platform-tools/adb"
```

Add these lines to `~/.bashrc`:

```bash
export ANDROID_HOME="$HOME/.android-sdk"
export ANDROID_SDK_ROOT="/mnt/c/Users/YOUR_USERNAME/AppData/Local/Android/Sdk"
export PATH="$HOME/.local/bin:$ANDROID_HOME/platform-tools:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/emulator:$PATH"
```

Reload and verify the exact executable Expo will use:

```bash
source ~/.bashrc
"$ANDROID_HOME/platform-tools/adb" devices
```

This keeps the real Android SDK on Windows while giving Expo a WSL path containing the expected `platform-tools/adb` name. Do not set `ANDROID_HOME` directly to the Windows-mounted SDK after creating the shim; Expo expects `platform-tools/adb`, but only `platform-tools/adb.exe` exists there.

Installing the Android emulator entirely inside WSL is possible but requires additional WSLg, virtualization, hardware acceleration, and networking configuration. It is not the recommended setup for this project.

## 1. Install Android Studio

Download Android Studio from:

<https://developer.android.com/studio>

During the installation, include the Android SDK and Android Virtual Device components.

## 2. Install SDK Components

Open Android Studio and select:

```text
More Actions > SDK Manager
```

Install or confirm these components:

- Android SDK Platform
- Android SDK Platform-Tools
- Android SDK Build-Tools
- Android SDK Command-line Tools
- Android Emulator
- At least one Android system image

If the SDK is installed inside WSL intentionally, its location is usually one of these paths on Linux:

```text
$HOME/Android/Sdk
/root/Android/Sdk
```

Use the path displayed in Android Studio's SDK Manager. Do not assume that another developer has the same username or SDK location.

## 3. Create An Emulator

Open Android Studio and select:

```text
More Actions > Virtual Device Manager
```

Then:

1. Select **Create Device**.
2. Choose a phone profile.
3. Select an installed system image.
4. Complete the setup.
5. Start the emulator before launching the app, or let Expo start it.

Verify that an emulator exists with:

```bash
emulator.exe -list-avds
```

## 4. Configure Environment Variables

For the Windows-host setup, follow the **WSL Environment Variables** section above. The persistent Bash configuration should contain the Windows SDK as `ANDROID_SDK_ROOT`, the WSL shim as `ANDROID_HOME`, and the shim directory in `PATH`:

```bash
export ANDROID_HOME="$HOME/.android-sdk"
export ANDROID_SDK_ROOT="/mnt/c/Users/YOUR_USERNAME/AppData/Local/Android/Sdk"
export PATH="$HOME/.local/bin:$ANDROID_HOME/platform-tools:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/emulator:$PATH"
```

Reload the shell configuration after editing it:

```bash
source ~/.bashrc
```

If Android Studio and the SDK were intentionally installed inside WSL instead, use that SDK location for both `ANDROID_HOME` and `ANDROID_SDK_ROOT`, and add its `platform-tools` and `emulator` directories to `PATH`. Do not commit a personal Android SDK path to the repository.

## 5. Verify The SDK

Run:

```bash
adb.exe version
emulator.exe -list-avds
```

If the compatibility shim is configured, also run:

```bash
adb version
"$ANDROID_HOME/platform-tools/adb" devices
```

If `adb.exe version` works, Windows Platform-Tools is available. If `emulator.exe -list-avds` prints an emulator name, an Android Virtual Device is configured.

If either command is not found, check that `ANDROID_HOME` and `PATH` point to the correct SDK installation.

## 6. Start Keys2Fitness

Run these commands from the `K2F` directory:

```bash
cd /root/workspace/github.com/DorkWitAFork/Keys2Fitness/K2F
npx expo start
```

Press `a` in the Expo terminal to open the app on Android.

For a clean route and Metro cache, use:

```bash
npx expo start -c
```

You can also use the project script:

```bash
npm run android
```

## 7. Install A Compatible Expo Go Version

The project currently uses Expo SDK 57. Expo Go must use the same SDK major version. The current Expo Go listing may install SDK 58, which produces an error like:

```text
Project is incompatible with this version of Expo Go
The installed version of Expo Go is for SDK 58.
The project you opened uses SDK 57.
```

Use the Expo Go page's **SDK 57** option from a Windows desktop browser, not from the emulator browser. Download the Android `.apk`, then drag it onto the running emulator. If SDK 58 is already installed, uninstall Expo Go first because Android blocks downgrades:

```bash
adb shell pm uninstall host.exp.exponent
```

Then drag the SDK 57 APK onto the emulator again. The `adb` command above requires the compatibility shim; otherwise use `adb.exe shell pm uninstall host.exp.exponent`.

## 8. Physical Android Device Alternative

An Android emulator is not required for basic Expo testing. You can install Expo Go on a physical Android device, run:

```bash
npx expo start
```

Then scan the QR code shown by Expo. The phone and development computer generally need to be on the same network.

## 9. Common Errors

### Android SDK path cannot be resolved

Example:

```text
Failed to resolve the Android SDK path
```

Set `ANDROID_SDK_ROOT` to the Windows SDK location and configure the Expo compatibility shim described in the WSL Environment Variables section. Do not point `ANDROID_HOME` directly at the Windows SDK because Expo expects `platform-tools/adb`, not `platform-tools/adb.exe`.

### `spawn adb ENOENT`

This means Expo cannot find an executable named `adb`. Confirm that Windows Platform-Tools is installed, then create the WSL compatibility shim described above. Verify it directly:

```bash
"$ANDROID_HOME/platform-tools/adb" devices
```

The command should list the running Windows emulator.

### Expo Go SDK version mismatch

Expo Go and the project must use the same Expo SDK major version. For this project, install Expo Go for SDK 57. If SDK 58 is already installed, uninstall it before installing the SDK 57 APK because Android does not allow the older APK to replace the newer one.

### No emulators are available

Create an Android Virtual Device in Android Studio's Virtual Device Manager, then verify it with:

```bash
emulator.exe -list-avds
```

### Expo starts in the browser

The browser is the web target. Press `a` in the Expo terminal after the Android emulator is running, or use Expo Go on a physical device. The web version may display navigation differently from the native mobile version.

## 10. Project Checks

Before submitting implementation work, run from `K2F`:

```bash
npx expo lint
npx tsc --noEmit
```

The Android SDK and emulator are local development tools. The repository should contain setup documentation, not the SDK, emulator images, or machine-specific paths.
