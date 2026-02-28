#!/bin/bash

# Finance Tracker - Complete Setup Script
# This script installs all prerequisites for Tauri desktop and Android development

set -e

echo "========================================"
echo "  Finance Tracker - Initial Setup"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        print_error "Unsupported OS: $OSTYPE"
        exit 1
    fi
    print_status "Detected OS: $OS"
}

# Check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Install Rust
install_rust() {
    print_status "Checking Rust installation..."
    
    if command_exists rustc && command_exists cargo; then
        RUST_VERSION=$(rustc --version)
        print_success "Rust already installed: $RUST_VERSION"
    else
        print_status "Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        
        # Source Rust environment
        source "$HOME/.cargo/env"
        print_success "Rust installed successfully"
    fi
}

# Install system dependencies for Linux
install_linux_deps() {
    print_status "Installing Linux system dependencies..."
    
    if command_exists apt-get; then
        sudo apt-get update
        sudo apt-get install -y \
            libwebkit2gtk-4.1-dev \
            build-essential \
            curl \
            wget \
            libssl-dev \
            libgtk-3-dev \
            libayatana-appindicator3-dev \
            librsvg2-dev \
            file \
            python3 \
            python3-pip
    elif command_exists dnf; then
        sudo dnf install -y \
            webkit2gtk4.1-devel \
            openssl-devel \
            curl \
            wget \
            libappindicator-gtk3-devel \
            librsvg2-devel \
            gtk3-devel \
            gcc \
            gcc-c++ \
            file \
            python3 \
            python3-pip
    elif command_exists pacman; then
        sudo pacman -S --noconfirm \
            webkit2gtk-4.1 \
            base-devel \
            curl \
            wget \
            openssl \
            gtk3 \
            libappindicator-gtk3 \
            librsvg \
            file \
            python \
            python-pip
    else
        print_warning "Could not detect package manager. Please install dependencies manually."
    fi
    
    print_success "Linux dependencies installed"
}

# Install system dependencies for macOS
install_macos_deps() {
    print_status "Checking macOS system dependencies..."
    
    if ! command_exists xcode-select; then
        print_status "Installing Xcode Command Line Tools..."
        xcode-select --install
    else
        print_success "Xcode Command Line Tools already installed"
    fi
    
    if command_exists brew; then
        print_status "Homebrew found, checking for optional dependencies..."
        brew install -q openssl || true
    else
        print_warning "Homebrew not installed. Consider installing it from https://brew.sh"
    fi
    
    print_success "macOS dependencies ready"
}

# Install Android dependencies
install_android_deps() {
    print_status "Setting up Android development environment..."
    
    # Check for Java
    if command_exists java; then
        JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
        if [ "$JAVA_VERSION" -ge 17 ]; then
            print_success "Java $JAVA_VERSION found"
        else
            print_warning "Java version $JAVA_VERSION found, but JDK 17+ is required"
        fi
    else
        print_warning "Java not found. Please install JDK 17+"
    fi
    
    # Android SDK/NDK setup
    if [ -d "$HOME/Android/Sdk" ]; then
        ANDROID_HOME="$HOME/Android/Sdk"
    elif [ -d "$HOME/Library/Android/sdk" ]; then
        ANDROID_HOME="$HOME/Library/Android/sdk"
    elif [ -n "$ANDROID_HOME" ]; then
        print_success "ANDROID_HOME already set to: $ANDROID_HOME"
    else
        print_warning "Android SDK not found at default locations"
        print_status "Please install Android Studio from: https://developer.android.com/studio"
        print_status "Then run: bun tauri:android:init"
        ANDROID_HOME=""
    fi
    
    # Export Android environment
    if [ -n "$ANDROID_HOME" ]; then
        export ANDROID_HOME
        print_success "ANDROID_HOME set to: $ANDROID_HOME"
        
        # Check for NDK
        if [ -d "$ANDROID_HOME/ndk" ]; then
            NDK_VERSION=$(ls "$ANDROID_HOME/ndk" | tail -1)
            export NDK_HOME="$ANDROID_HOME/ndk/$NDK_VERSION"
            print_success "NDK found: $NDK_VERSION"
        else
            print_warning "NDK not found. Install via Android Studio SDK Manager"
        fi
    fi
}

# Add Rust Android targets
add_rust_android_targets() {
    print_status "Adding Rust Android targets..."
    
    rustup target add aarch64-linux-android
    rustup target add armv7-linux-androideabi
    rustup target add i686-linux-android
    rustup target add x86_64-linux-android
    
    print_success "Rust Android targets added"
}

# Install Node.js dependencies
install_node_deps() {
    print_status "Installing Node.js dependencies..."
    
    if command_exists bun; then
        bun install
    elif command_exists npm; then
        npm install
    else
        print_error "Neither bun nor npm found. Please install Node.js or Bun"
        exit 1
    fi
    
    print_success "Node.js dependencies installed"
}

# Initialize Tauri Android
init_tauri_android() {
    print_status "Initializing Tauri Android project..."
    
    if [ -d "src-tauri/gen/android" ]; then
        print_success "Tauri Android already initialized"
    else
        if command_exists bun; then
            bun tauri android init
        else
            npm run tauri:android:init
        fi
        print_success "Tauri Android initialized"
    fi
}

# Create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    ENV_FILE=".env.setup"
    
    cat > "$ENV_FILE" << EOF
# Finance Tracker - Environment Configuration
# Source this file: source .env.setup

# Android SDK (update paths as needed)
export ANDROID_HOME="\${ANDROID_HOME:-$HOME/Android/Sdk}"

# NDK (update version as needed)
if [ -d "\$ANDROID_HOME/ndk" ]; then
    NDK_VER=\$(ls "\$ANDROID_HOME/ndk" | tail -1)
    export NDK_HOME="\$ANDROID_HOME/ndk/\$NDK_VER"
fi

# Add to PATH
export PATH="\$HOME/.cargo/bin:\$PATH"
export PATH="\$ANDROID_HOME/platform-tools:\$PATH"
export PATH="\$ANDROID_HOME/emulator:\$PATH"
EOF
    
    print_success "Environment file created: $ENV_FILE"
    print_status "Run 'source .env.setup' to load environment variables"
}

# Print final instructions
print_instructions() {
    echo ""
    echo "========================================"
    echo "  Setup Complete!"
    echo "========================================"
    echo ""
    echo -e "${GREEN}Available commands:${NC}"
    echo ""
    echo "  Desktop Development:"
    echo "    bun tauri:dev           - Start dev server"
    echo "    bun tauri:build         - Build for current platform"
    echo ""
    echo "  Android Development:"
    echo "    bun tauri:android:dev   - Run on Android device/emulator"
    echo "    bun tauri:android:build - Build Android APK"
    echo ""
    echo -e "${YELLOW}If this is your first time:${NC}"
    echo "  1. source \$HOME/.cargo/env"
    echo "  2. source .env.setup"
    echo "  3. Restart your terminal or run: exec \$SHELL"
    echo ""
    echo -e "${BLUE}Repository: https://github.com/WissamZa/finance-tracker-tauri${NC}"
    echo ""
}

# Main execution
main() {
    detect_os
    echo ""
    
    # Install Rust
    install_rust
    echo ""
    
    # Install system dependencies
    if [ "$OS" == "linux" ]; then
        install_linux_deps
    elif [ "$OS" == "macos" ]; then
        install_macos_deps
    fi
    echo ""
    
    # Add Rust Android targets
    add_rust_android_targets
    echo ""
    
    # Install Android dependencies
    install_android_deps
    echo ""
    
    # Install Node.js dependencies
    install_node_deps
    echo ""
    
    # Create environment file
    create_env_file
    echo ""
    
    # Print instructions
    print_instructions
}

# Run main function
main
