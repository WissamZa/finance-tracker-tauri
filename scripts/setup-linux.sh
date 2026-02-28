#!/bin/bash

#######################################################################
# Finance Tracker Tauri - Linux Setup Script
# This script sets up all prerequisites for building the app on Linux
# including Android support
#######################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Finance Tracker Tauri - Linux Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Detect Linux distribution
detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo $ID
    elif [ -f /etc/debian_version ]; then
        echo "debian"
    elif [ -f /etc/redhat-release ]; then
        echo "rhel"
    else
        echo "unknown"
    fi
}

DISTRO=$(detect_distro)
echo -e "${GREEN}Detected distribution: $DISTRO${NC}"
echo ""

# Step 1: Install system dependencies
echo -e "${YELLOW}[1/7] Installing system dependencies...${NC}"
case $DISTRO in
    ubuntu|debian|linuxmint|pop)
        sudo apt update
        sudo apt install -y \
            build-essential \
            curl \
            wget \
            file \
            libssl-dev \
            libgtk-3-dev \
            libwebkit2gtk-4.1-dev \
            libappindicator3-dev \
            librsvg2-dev \
            patchelf \
            openjdk-17-jdk \
            unzip
        ;;
    fedora|rhel|centos)
        sudo dnf install -y \
            gcc \
            gcc-c++ \
            make \
            curl \
            wget \
            file \
            openssl-devel \
            gtk3-devel \
            webkit2gtk4.1-devel \
            libappindicator-gtk3-devel \
            librsvg2-devel \
            java-17-openjdk-devel \
            unzip
        ;;
    arch|manjaro)
        sudo pacman -Sy --noconfirm \
            base-devel \
            curl \
            wget \
            file \
            openssl \
            gtk3 \
            webkit2gtk-4.1 \
            libappindicator-gtk3 \
            librsvg \
            jdk17-openjdk \
            unzip
        ;;
    *)
        echo -e "${RED}Unsupported distribution. Please install dependencies manually.${NC}"
        echo "Required packages: build-essential, curl, wget, libssl-dev, libgtk-3-dev, libwebkit2gtk-4.1-dev, openjdk-17-jdk"
        exit 1
        ;;
esac
echo -e "${GREEN}✓ System dependencies installed${NC}"
echo ""

# Step 2: Install Rust
echo -e "${YELLOW}[2/7] Installing Rust...${NC}"
if command -v rustc &> /dev/null; then
    echo -e "${GREEN}Rust is already installed: $(rustc --version)${NC}"
else
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
    echo -e "${GREEN}✓ Rust installed: $(rustc --version)${NC}"
fi
echo ""

# Step 3: Install Bun (if not installed)
echo -e "${YELLOW}[3/7] Installing Bun...${NC}"
if command -v bun &> /dev/null; then
    echo -e "${GREEN}Bun is already installed: $(bun --version)${NC}"
else
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    echo -e "${GREEN}✓ Bun installed: $(bun --version)${NC}"
fi
echo ""

# Step 4: Install Android SDK Command Line Tools
echo -e "${YELLOW}[4/7] Installing Android SDK...${NC}"
ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"

if [ -d "$ANDROID_HOME" ]; then
    echo -e "${GREEN}Android SDK already exists at: $ANDROID_HOME${NC}"
else
    echo "Creating Android SDK directory..."
    mkdir -p "$ANDROID_HOME/cmdline-tools"

    # Download command line tools
    CMDLINE_TOOLS_VERSION="11076708" # Latest as of 2024
    CMDLINE_TOOLS_URL="https://dl.google.com/android/repository/commandlinetools-linux-${CMDLINE_TOOLS_VERSION}_latest.zip"

    echo "Downloading Android command line tools..."
    wget -q --show-progress "$CMDLINE_TOOLS_URL" -O /tmp/cmdline-tools.zip

    # Extract to correct location
    unzip -q /tmp/cmdline-tools.zip -d "$ANDROID_HOME/cmdline-tools"
    mv "$ANDROID_HOME/cmdline-tools/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
    rm /tmp/cmdline-tools.zip

    echo -e "${GREEN}✓ Android SDK installed at: $ANDROID_HOME${NC}"
fi
echo ""

# Step 5: Install Android SDK packages
echo -e "${YELLOW}[5/7] Installing Android SDK packages (NDK, build tools, platforms)...${NC}"
export ANDROID_HOME
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

# Accept licenses automatically
yes | sdkmanager --licenses > /dev/null 2>&1 || true

# Install required packages
sdkmanager --install \
    "platform-tools" \
    "platforms;android-34" \
    "build-tools;34.0.0" \
    "ndk;25.2.9519653" \
    "cmake;3.22.1" \
    "cmdline-tools;latest"

echo -e "${GREEN}✓ Android SDK packages installed${NC}"
echo ""

# Step 6: Add Rust Android targets
echo -e "${YELLOW}[6/7] Adding Rust Android targets...${NC}"
rustup target add aarch64-linux-android
rustup target add armv7-linux-androideabi
rustup target add i686-linux-android
rustup target add x86_64-linux-android
echo -e "${GREEN}✓ Rust Android targets added${NC}"
echo ""

# Step 7: Configure environment variables
echo -e "${YELLOW}[7/7] Configuring environment variables...${NC}"

ENV_FILE="$HOME/.bashrc"
if [ -f "$HOME/.zshrc" ]; then
    ENV_FILE="$HOME/.zshrc"
fi

# Check if already configured
if ! grep -q "ANDROID_HOME" "$ENV_FILE" 2>/dev/null; then
    echo "" >> "$ENV_FILE"
    echo "# Android SDK Configuration" >> "$ENV_FILE"
    echo "export ANDROID_HOME=\"$ANDROID_HOME\"" >> "$ENV_FILE"
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/emulator\"" >> "$ENV_FILE"
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/platform-tools\"" >> "$ENV_FILE"
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin\"" >> "$ENV_FILE"
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/ndk/25.2.9519653\"" >> "$ENV_FILE"
    echo -e "${GREEN}✓ Environment variables added to $ENV_FILE${NC}"
else
    echo -e "${GREEN}Environment variables already configured${NC}"
fi

# Source the environment for current session
export ANDROID_HOME
export PATH="$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Restart your terminal or run: source $ENV_FILE"
echo "2. Navigate to the project directory: cd $(pwd)"
echo "3. Install dependencies: bun install"
echo "4. Initialize Tauri Android: bun tauri android init"
echo "5. Build for Android: bun tauri:android:build"
echo ""
echo -e "${BLUE}Available commands:${NC}"
echo "  bun tauri:dev          - Run desktop app in dev mode"
echo "  bun tauri:build        - Build desktop app"
echo "  bun tauri:android:dev  - Run Android app in dev mode"
echo "  bun tauri:android:build - Build Android APK"
echo ""
