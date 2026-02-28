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

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Desktop Framework**: Tauri 2.0 (Rust backend)
- **Mobile Framework**: Tauri 2.0 Mobile (Android)
- **Local Database**: Dexie.js (IndexedDB)
- **Cloud Database**: Supabase
- **State Management**: Zustand

## Quick Start (Automated Setup)

### Linux

```bash
# Run the setup script
chmod +x scripts/setup-linux.sh
./scripts/setup-linux.sh

# After setup, restart your terminal and run:
bun install
bun tauri:dev
```

### Windows

Open PowerShell **as Administrator** and run:

```powershell
# Run the setup script
Set-ExecutionPolicy Bypass -Scope Process -Force
.\scripts\setup-windows.ps1

# After setup, restart PowerShell and run:
bun install
bun tauri:dev
```

## Manual Setup

### Prerequisites

#### For Desktop (Windows/macOS/Linux)
- [Node.js](https://nodejs.org/) (v18 or later)
- [Bun](https://bun.sh/) (recommended) or npm
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- Platform-specific dependencies:
  - **Windows**: Microsoft Visual Studio C++ Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: webkit2gtk, openssl, etc.

#### For Android
- All desktop prerequisites, plus:
- [Android Studio](https://developer.android.com/studio) with:
  - Android SDK 34
  - Android NDK 25.2.9519653
  - Build Tools 34.0.0
- [JDK 17](https://adoptium.net/) or later
- Environment variables:
  ```bash
  export ANDROID_HOME=$HOME/Android/Sdk
  export NDK_HOME=$ANDROID_HOME/ndk/25.2.9519653
  ```

### Install dependencies

```bash
bun install
```

### Desktop Development

```bash
# Start development server with Tauri
bun tauri:dev
```

### Android Development

```bash
# Initialize Android project (first time only)
bun tauri:android:init

# Run on Android device/emulator
bun tauri:android:dev

# Build Android APK
bun tauri:android:build

# Build Android release APK/AAB
bun tauri:android:build:release
```

## Build for Production

### Desktop

```bash
# Build for current platform
bun tauri:build

# Platform-specific builds
bun tauri:build:mac      # macOS Universal
bun tauri:build:win      # Windows x64
bun tauri:build:linux    # Linux x64
```

### Android

```bash
# Debug APK
bun tauri:android:build

# Release APK/AAB
bun tauri:android:build:release
```

Build outputs:
- **Desktop**: `src-tauri/target/release/bundle/`
- **APK**: `src-tauri/gen/android/app/build/outputs/apk/`
- **AAB**: `src-tauri/gen/android/app/build/outputs/bundle/`

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
│   ├── gen/android/       # Android project files
│   ├── capabilities/      # Tauri permissions
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── scripts/               # Setup scripts
│   ├── setup-linux.sh     # Linux automated setup
│   └── setup-windows.ps1  # Windows automated setup
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
└── package.json           # Node.js dependencies
```

## Configuration

### Supabase Setup (Optional)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from the original project
3. Configure your Supabase credentials in the app's Database Settings

## Manual Rust Installation

```bash
# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Windows
# Download from https://win.rustup.rs/
```

## Adding Android Targets Manually

```bash
# Add Android targets to Rust
rustup target add aarch64-linux-android
rustup target add armv7-linux-androideabi
rustup target add i686-linux-android
rustup target add x86_64-linux-android
```

## Available Commands

| Command | Description |
|---------|-------------|
| `bun dev` | Start Vite dev server only |
| `bun tauri:dev` | Run desktop app in dev mode |
| `bun tauri:build` | Build desktop app for current platform |
| `bun tauri:build:mac` | Build for macOS Universal |
| `bun tauri:build:win` | Build for Windows x64 |
| `bun tauri:build:linux` | Build for Linux x64 |
| `bun tauri:android:init` | Initialize Android project |
| `bun tauri:android:dev` | Run Android app in dev mode |
| `bun tauri:android:build` | Build Android APK |
| `bun tauri:android:build:release` | Build Android release APK/AAB |

## License

MIT

## Original Project

This is a Tauri desktop/android version of the [original Next.js Income & Expense Tracker](https://github.com/WissamZa/app).
