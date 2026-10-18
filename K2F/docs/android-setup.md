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

Depending on the WSL and Windows PATH configuration, the `a` shortcut may not automatically find the Windows emulator. If that happens, start the emulator manually in Android Studio and use Expo Go or configure WSL to access the Windows `adb.exe` command.

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

If WSL can access the Windows SDK tools, configure the SDK path using the WSL-mounted path:

```bash
export ANDROID_HOME="/mnt/c/Users/YOUR_USERNAME/AppData/Local/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

Check whether WSL can access Android Debug Bridge:

```bash
adb.exe version
adb.exe devices
```

If these commands do not work, continue using the emulator from Android Studio on Windows or use Expo Go on a physical device. Do not replace the path with `/root/Android/Sdk` unless the SDK was intentionally installed inside WSL.

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

The SDK location is usually one of these paths on Linux:

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
emulator -list-avds
```

## 4. Configure Environment Variables

Expo needs to find the Android SDK and the `adb` executable.

For the current terminal session, use:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

If Android Studio reports a different SDK location, replace `$HOME/Android/Sdk` with that location.

To make the variables persistent for Bash, add the same two lines to:

```text
~/.bashrc
```

For Zsh, add them to:

```text
~/.zshrc
```

Reload the shell configuration after editing it:

```bash
source ~/.bashrc
```

Do not commit a personal `ANDROID_HOME` path to the repository.

## 5. Verify The SDK

Run:

```bash
adb version
emulator -list-avds
```

If `adb version` works, Platform-Tools is available. If `emulator -list-avds` prints an emulator name, an Android Virtual Device is configured.

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

## 7. Physical Android Device Alternative

An Android emulator is not required for basic Expo testing. You can install Expo Go on a physical Android device, run:

```bash
npx expo start
```

Then scan the QR code shown by Expo. The phone and development computer generally need to be on the same network.

## 8. Common Errors

### Android SDK path cannot be resolved

Example:

```text
Failed to resolve the Android SDK path
```

Set `ANDROID_HOME` to the SDK location shown in Android Studio and add Platform-Tools and the Emulator directory to `PATH`.

### `spawn adb ENOENT`

This means Expo cannot find `adb`. Confirm that Android SDK Platform-Tools is installed and that this directory is in `PATH`:

```text
$ANDROID_HOME/platform-tools
```

### No emulators are available

Create an Android Virtual Device in Android Studio's Virtual Device Manager, then verify it with:

```bash
emulator -list-avds
```

### Expo starts in the browser

The browser is the web target. Press `a` in the Expo terminal after the Android emulator is running, or use Expo Go on a physical device. The web version may display navigation differently from the native mobile version.

## 9. Project Checks

Before submitting implementation work, run from `K2F`:

```bash
npx expo lint
npx tsc --noEmit
```

The Android SDK and emulator are local development tools. The repository should contain setup documentation, not the SDK, emulator images, or machine-specific paths.
