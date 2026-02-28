#######################################################################
# Finance Tracker Tauri - Windows Setup Script
# This script sets up all prerequisites for building the app on Windows
# including Android support
#
# Run this script in PowerShell as Administrator:
#   Set-ExecutionPolicy Bypass -Scope Process -Force; .\setup-windows.ps1
#######################################################################

# Require Administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires Administrator privileges. Please run as Administrator." -ForegroundColor Red
    exit 1
}

# Colors
$Green = [ConsoleColor]::Green
$Yellow = [ConsoleColor]::Yellow
$Blue = [ConsoleColor]::Blue
$Red = [ConsoleColor]::Red

Write-Host "========================================" -ForegroundColor $Blue
Write-Host "Finance Tracker Tauri - Windows Setup" -ForegroundColor $Blue
Write-Host "========================================" -ForegroundColor $Blue
Write-Host ""

# Step 1: Install Chocolatey (if not installed)
Write-Host "[1/8] Checking Chocolatey..." -ForegroundColor $Yellow
if (-NOT (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey..." -ForegroundColor $Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    refreshenv
    Write-Host "✓ Chocolatey installed" -ForegroundColor $Green
} else {
    Write-Host "Chocolatey is already installed" -ForegroundColor $Green
}
Write-Host ""

# Step 2: Install Visual Studio Build Tools
Write-Host "[2/8] Installing Visual Studio Build Tools..." -ForegroundColor $Yellow
$vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
$vsInstalled = if (Test-Path $vsWhere) { & $vsWhere -latest -property displayName } else { $null }

if ($vsInstalled) {
    Write-Host "Visual Studio is already installed: $vsInstalled" -ForegroundColor $Green
} else {
    Write-Host "Installing Visual Studio Build Tools 2022..." -ForegroundColor $Yellow
    choco install visualstudio2022buildtools -y --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --passive --locale en-US"
    Write-Host "✓ Visual Studio Build Tools installed" -ForegroundColor $Green
}
Write-Host ""

# Step 3: Install WebView2 (required for Tauri)
Write-Host "[3/8] Installing WebView2..." -ForegroundColor $Yellow
$webview2Path = "${env:ProgramFiles(x86)}\Microsoft\EdgeWebView\Application"
if (Test-Path $webview2Path) {
    Write-Host "WebView2 is already installed" -ForegroundColor $Green
} else {
    choco install microsoft-edge-webview2-runtime -y
    Write-Host "✓ WebView2 installed" -ForegroundColor $Green
}
Write-Host ""

# Step 4: Install Rust
Write-Host "[4/8] Installing Rust..." -ForegroundColor $Yellow
if (Get-Command rustc -ErrorAction SilentlyContinue) {
    Write-Host "Rust is already installed: $(rustc --version)" -ForegroundColor $Green
} else {
    Write-Host "Downloading Rust installer..." -ForegroundColor $Yellow
    $rustInstaller = "$env:TEMP\rustup-init.exe"
    Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile $rustInstaller

    Write-Host "Installing Rust..." -ForegroundColor $Yellow
    Start-Process -FilePath $rustInstaller -ArgumentList "-y" -Wait
    Remove-Item $rustInstaller

    # Refresh environment
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Host "✓ Rust installed" -ForegroundColor $Green
}
Write-Host ""

# Step 5: Install Bun
Write-Host "[5/8] Installing Bun..." -ForegroundColor $Yellow
if (Get-Command bun -ErrorAction SilentlyContinue) {
    Write-Host "Bun is already installed: $(bun --version)" -ForegroundColor $Green
} else {
    Write-Host "Installing Bun via PowerShell..." -ForegroundColor $Yellow
    Invoke-RestMethod https://bun.sh/install.ps1 | Invoke-Expression

    # Add to path for current session
    $env:Path += ";$env:USERPROFILE\.bun\bin"
    Write-Host "✓ Bun installed" -ForegroundColor $Green
}
Write-Host ""

# Step 6: Install Android SDK
Write-Host "[6/8] Installing Android SDK..." -ForegroundColor $Yellow
$androidHome = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }

if (Test-Path "$androidHome\cmdline-tools\latest\bin\sdkmanager.bat") {
    Write-Host "Android SDK already exists at: $androidHome" -ForegroundColor $Green
} else {
    Write-Host "Creating Android SDK directory..." -ForegroundColor $Yellow
    New-Item -ItemType Directory -Force -Path "$androidHome\cmdline-tools" | Out-Null

    # Download command line tools
    $cmdlineToolsVersion = "11076708"
    $cmdlineToolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-${cmdlineToolsVersion}_latest.zip"
    $zipPath = "$env:TEMP\cmdline-tools.zip"

    Write-Host "Downloading Android command line tools..." -ForegroundColor $Yellow
    Invoke-WebRequest -Uri $cmdlineToolsUrl -OutFile $zipPath

    Write-Host "Extracting..." -ForegroundColor $Yellow
    Expand-Archive -Path $zipPath -DestinationPath "$androidHome\cmdline-tools" -Force
    Rename-Item "$androidHome\cmdline-tools\cmdline-tools" "latest" -ErrorAction SilentlyContinue
    Remove-Item $zipPath

    Write-Host "✓ Android SDK installed at: $androidHome" -ForegroundColor $Green
}
Write-Host ""

# Step 7: Install Android SDK packages
Write-Host "[7/8] Installing Android SDK packages (NDK, build tools, platforms)..." -ForegroundColor $Yellow
$env:ANDROID_HOME = $androidHome
$env:Path += ";$androidHome\cmdline-tools\latest\bin;$androidHome\platform-tools;$androidHome\emulator"

$sdkManager = "$androidHome\cmdline-tools\latest\bin\sdkmanager.bat"

if (Test-Path $sdkManager) {
    Write-Host "Accepting licenses..." -ForegroundColor $Yellow
    "y" | cmd /c "`"$sdkManager`" --licenses" 2>&1 | Out-Null

    Write-Host "Installing packages..." -ForegroundColor $Yellow
    & $sdkManager "platform-tools" "platforms;android-34" "build-tools;34.0.0" "ndk;25.2.9519653" "cmake;3.22.1" "cmdline-tools;latest"

    Write-Host "✓ Android SDK packages installed" -ForegroundColor $Green
} else {
    Write-Host "Warning: sdkmanager not found. Please install Android SDK packages manually." -ForegroundColor $Red
}
Write-Host ""

# Step 8: Add Rust Android targets
Write-Host "[8/8] Adding Rust Android targets..." -ForegroundColor $Yellow
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

& rustup target add aarch64-linux-android
& rustup target add armv7-linux-androideabi
& rustup target add i686-linux-android
& rustup target add x86_64-linux-android
Write-Host "✓ Rust Android targets added" -ForegroundColor $Green
Write-Host ""

# Configure environment variables permanently
Write-Host "Configuring environment variables..." -ForegroundColor $Yellow

# Set ANDROID_HOME
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidHome, "User")

# Add to PATH
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$pathsToAdd = @(
    "$androidHome\emulator",
    "$androidHome\platform-tools",
    "$androidHome\cmdline-tools\latest\bin",
    "$env:USERPROFILE\.bun\bin",
    "$env:USERPROFILE\.cargo\bin"
)

foreach ($path in $pathsToAdd) {
    if (-not $userPath.Contains($path)) {
        $userPath += ";$path"
    }
}
[Environment]::SetEnvironmentVariable("Path", $userPath, "User")

Write-Host "✓ Environment variables configured" -ForegroundColor $Green
Write-Host ""

Write-Host "========================================" -ForegroundColor $Green
Write-Host "✓ Setup Complete!" -ForegroundColor $Green
Write-Host "========================================" -ForegroundColor $Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor $Yellow
Write-Host "1. Close and reopen PowerShell (to refresh environment)"
Write-Host "2. Navigate to the project directory"
Write-Host "3. Install dependencies: bun install"
Write-Host "4. Initialize Tauri Android: bun tauri android init"
Write-Host "5. Build for Android: bun tauri:android:build"
Write-Host ""
Write-Host "Available commands:" -ForegroundColor $Blue
Write-Host "  bun tauri:dev          - Run desktop app in dev mode"
Write-Host "  bun tauri:build        - Build desktop app"
Write-Host "  bun tauri:android:dev  - Run Android app in dev mode"
Write-Host "  bun tauri:android:build - Build Android APK"
Write-Host ""
Write-Host "IMPORTANT: Restart your terminal/PowerShell for changes to take effect!" -ForegroundColor $Yellow
Write-Host ""
