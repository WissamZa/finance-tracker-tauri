#!/bin/bash

#######################################################################
# Finance Tracker Tauri - Quick Start Script
# Detects OS and runs the appropriate setup script
#######################################################################

echo "Finance Tracker Tauri - Quick Setup"
echo "===================================="
echo ""

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Detected: Linux"
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    bash "$SCRIPT_DIR/setup-linux.sh"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Detected: macOS"
    echo "macOS setup is not yet implemented in this script."
    echo "Please follow the manual setup instructions in README.md"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    echo "Detected: Windows (Git Bash/MSYS)"
    echo "Please run setup-windows.ps1 in PowerShell as Administrator:"
    echo ""
    echo "  powershell -ExecutionPolicy Bypass -File scripts/setup-windows.ps1"
    echo ""
else
    echo "Unknown OS: $OSTYPE"
    echo "Please follow the manual setup instructions in README.md"
fi
