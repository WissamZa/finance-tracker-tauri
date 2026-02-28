# Finance Tracker - Tauri Desktop App

A cross-platform desktop application for tracking income and expenses, built with Tauri 2.0, React, and TypeScript.

## Features

- **Cross-platform**: Runs on Windows, macOS, and Linux
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
- **Local Database**: Dexie.js (IndexedDB wrapper)
- **Cloud Database**: Supabase
- **State Management**: Zustand

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Bun](https://bun.sh/) (recommended) or npm
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- Platform-specific dependencies:
  - **Windows**: Microsoft Visual Studio C++ Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**:webkit2gtk, openssl, etc.

## Getting Started

### Install dependencies

```bash
bun install
```

### Development

```bash
# Start development server with Tauri
bun tauri:dev
```

### Build for Production

```bash
# Build for current platform
bun tauri:build

# Build for specific platforms
bun tauri:build:mac      # macOS Universal
bun tauri:build:win      # Windows x64
bun tauri:build:linux    # Linux x64
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
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind configuration
└── package.json           # Node.js dependencies
```

## Configuration

### Supabase Setup (Optional)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from the original project
3. Configure your Supabase credentials in the app's Database Settings

## License

MIT

## Original Project

This is a Tauri desktop version of the [original Next.js Income & Expense Tracker](https://github.com/WissamZa/app).
