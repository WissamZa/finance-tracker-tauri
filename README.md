# Finance Tracker - Tauri Desktop & Android App

A cross-platform application for tracking income and expenses, built with Tauri 2.0, React, and TypeScript.

## Features

- **Cross-platform**: Runs on Windows, macOS, Linux, and Android
- **Offline-first**: Works without internet connection using local IndexedDB storage
- **Cloud sync**: Optional Supabase integration for cloud backup and multi-device sync
- **Multi-language**: Support for English and Arabic (RTL)
- **Dark/Light themes**: Automatic theme detection with manual override
- **Data visualization**: Charts and yearly overview
- **Export/Import**: JSON and CSV export/import capabilities

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | Tailwind CSS v4, shadcn/ui components |
| **Desktop** | Tauri 2.0 (Rust backend) |
| **Mobile** | Tauri 2.0 Mobile (Android) |
| **Local DB** | Dexie.js (IndexedDB) |
| **Cloud DB** | Supabase |
| **State Management** | Zustand |

## Prerequisites

### For Desktop (All Platforms)
- [Node.js](https://nodejs.org/) (v18 or later)
- [Bun](https://bun.sh/) (recommended) or npm
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)

### Platform-Specific Dependencies

#### Windows
- Microsoft Visual Studio C++ Build Tools
- WebView2 (usually pre-installed on Windows 10/11)

#### macOS
- Xcode Command Line Tools: `xcode-select --install`

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

### For Android
- [Rust Android targets](https://tauri.app/start/create-mobile-app/#android)
- [Android Studio](https://developer.android.com/studio) or Android SDK
- Android NDK (installed via Android Studio SDK Manager)
- JDK 17 or later

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/WissamZa/finance-tracker-tauri.git
cd finance-tracker-tauri
```

### 2. Install Dependencies
```bash
bun install
```

### 3. Development

#### Desktop Development
```bash
bun tauri:dev
```

#### Android Development
```bash
# First time: Initialize Android project
bun tauri:android:init

# Run on Android emulator or device
bun tauri:android:dev
```

## Build for Production

### Desktop Builds

```bash
# Build for current platform
bun tauri:build

# Platform-specific builds
bun tauri:build:mac      # macOS Universal
bun tauri:build:win      # Windows x64
bun tauri:build:linux    # Linux x64
```

### Android Build

```bash
# Debug APK
bun tauri:android:build

# Release APK/AAB
bun tauri:android:build:release
```

Build outputs:
- **APK**: `src-tauri/gen/android/app/build/outputs/apk/`
- **AAB**: `src-tauri/gen/android/app/build/outputs/bundle/`

## Android Setup Guide

### 1. Install Rust Android Targets
```bash
rustup target add aarch64-linux-android
rustup target add armv7-linux-androideabi
rustup target add i686-linux-android
rustup target add x86_64-linux-android
```

### 2. Set Environment Variables
Add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export NDK_HOME=$ANDROID_HOME/ndk/27.0.11902837  # Adjust version as needed
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 3. Initialize Android Project
```bash
bun tauri:android:init
```

### 4. Run on Device/Emulator
```bash
# Start an Android emulator first, or connect a device
bun tauri:android:dev
```

## Project Structure

```
finance-tracker-tauri/
├── src/                    # React frontend source
│   ├── components/         # React components
│   │   └── ui/            # shadcn/ui components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and database logic
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Entry point
│   └── index.css          # Tailwind CSS styles
├── src-tauri/             # Rust backend (Tauri)
│   ├── src/               # Rust source files
│   ├── capabilities/      # Tauri permissions
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
└── package.json           # Node.js dependencies
```

## Configuration

### Supabase Setup (Optional)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from the original project
3. Configure your Supabase credentials in the app's Database Settings

## Troubleshooting

### Android Build Issues

**Error: `failed to run 'cargo metadata'`**
- Ensure Rust is installed and in your PATH
- Run `rustup target add aarch64-linux-android`

**Error: `ANDROID_HOME not set`**
- Set the `ANDROID_HOME` environment variable to your Android SDK path

**Error: `NDK not found`**
- Install NDK via Android Studio SDK Manager
- Set `NDK_HOME` environment variable

## License

MIT

## Original Project

This is a Tauri desktop version of the [original Next.js Income & Expense Tracker](https://github.com/WissamZa/app).
