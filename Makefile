# Makefile for Finance Tracker Tauri

.PHONY: help setup setup-desktop setup-android dev build clean

help:
	@echo "Finance Tracker - Available Commands"
	@echo "====================================="
	@echo ""
	@echo "Setup:"
	@echo "  make setup          - Full setup (desktop + android)"
	@echo "  make setup-desktop  - Desktop-only setup"
	@echo "  make setup-android  - Android setup (requires Rust)"
	@echo ""
	@echo "Development:"
	@echo "  make dev            - Start desktop dev server"
	@echo "  make dev-android    - Start Android dev"
	@echo ""
	@echo "Build:"
	@echo "  make build          - Build for current platform"
	@echo "  make build-android  - Build Android APK"
	@echo "  make build-release  - Build release for all platforms"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make install        - Install dependencies"
	@echo ""

setup:
	@echo "Running full setup..."
	@if [ -f ./setup.sh ]; then \
		chmod +x ./setup.sh && ./setup.sh; \
	else \
		echo "Setup script not found. Please run: bun install"; \
	fi

setup-desktop:
	@echo "Setting up desktop development..."
	@command -v rustup >/dev/null 2>&1 || curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
	@. $$HOME/.cargo/env && rustup default stable
	bun install

setup-android:
	@echo "Setting up Android development..."
	@. $$HOME/.cargo/env && rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
	bun tauri android init

dev:
	bun tauri:dev

dev-android:
	bun tauri:android:dev

build:
	bun tauri:build

build-android:
	bun tauri:android:build

build-release:
	bun tauri:build
	bun tauri:android:build --release

install:
	bun install

clean:
	rm -rf dist/
	rm -rf node_modules/
	rm -rf src-tauri/target/
	rm -rf src-tauri/gen/android/app/build/
	@echo "Cleaned build artifacts"
