# Finance Tracker - Complete Setup Script for Windows
# Run this script in PowerShell as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Finance Tracker - Initial Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Print-Status {
    param([string]$Message)
    Write-Host "[INFO] " -ForegroundColor Blue -NoNewline
    Write-Host $Message
}

function Print-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] " -ForegroundColor Green -NoNewline
    Write-Host $Message
}

function Print-Warning {
    param([string]$Message)
    Write-Host "[WARNING] " -ForegroundColor Yellow -NoNewline
    Write-Host $Message
}

function Print-Error {
    param([string]$Message)
    Write-Host "[ERROR] " -ForegroundColor Red -NoNewline
    Write-Host $Message
}

# Check if command exists
function Command-Exists {
    param([string]$Command)
    return [bool](Get-Command -Name $Command -ErrorAction SilentlyContinue)
}

# Install Rust
function Install-Rust {
    Print-Status "Checking Rust installation..."
    
    if (Command-Exists "rustc" -and (Command-Exists "cargo")) {
        $rustVersion = rustc --version
        Print-Success "Rust already installed: $rustVersion"
    } else {
        Print-Status "Installing Rust..."
        
        # Download rustup-init
        $rustupUrl = "https://win.rustup.rs/x86_64"
        $rustupPath = "$env:TEMP\rustup-init.exe"
        
        Invoke-WebRequest -Uri $rustupUrl -OutFile $rustupPath -UseBasicParsing
        
        # Run rustup-init
        Start-Process -FilePath $rustupPath -ArgumentList "-y" -Wait
        
        # Update PATH for current session
        $env:Path += ";$env:USERPROFILE\.cargo\bin"
        
        Print-Success "Rust installed successfully"
    }
}

# Install Visual Studio Build Tools
function Install-VSBuildTools {
    Print-Status "Checking Visual Studio Build Tools..."
    
    $vsWherePath = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    
    if (Test-Path $vsWherePath) {
        $vsInstalled = & $vsWherePath -latest -property displayName 2>$null
        if ($vsInstalled) {
            Print-Success "Visual Studio found: $vsInstalled"
            return
        }
    }
    
    Print-Status "Visual Studio Build Tools not found."
    Print-Status "Please download and install from:"
    Print-Status "https://visualstudio.microsoft.com/visual-cpp-build-tools/"
    Print-Warning "Make sure to select 'Desktop development with C++'"
    
    $response = Read-Host "Press 'Y' to open download page, or 'Enter' to skip"
    if ($response -eq "Y" -or $response -eq "y") {
        Start-Process "https://visualstudio.microsoft.com/visual-cpp-build-tools/"
    }
}

# Install WebView2
function Install-WebView2 {
    Print-Status "Checking WebView2..."
    
    $webView2Path = "${env:ProgramFiles(x86)}\Microsoft\EdgeWebView\Application"
    
    if (Test-Path $webView2Path) {
        Print-Success "WebView2 already installed"
    } else {
        Print-Status "Installing WebView2..."
        
        $webView2Url = "https://go.microsoft.com/fwlink/p/?LinkId=2124703"
        $webView2Installer = "$env:TEMP\MicrosoftEdgeWebview2Setup.exe"
        
        Invoke-WebRequest -Uri $webView2Url -OutFile $webView2Installer -UseBasicParsing
        Start-Process -FilePath $webView2Installer -ArgumentList "/silent", "/install" -Wait
        
        Print-Success "WebView2 installed"
    }
}

# Check Android setup
function Check-Android {
    Print-Status "Checking Android development environment..."
    
    # Check Java
    if (Command-Exists "java") {
        $javaVersion = java -version 2>&1 | Select-String -Pattern 'version "(.*?)"' | ForEach-Object { $_.Matches.Groups[1].Value }
        Print-Success "Java found: version $javaVersion"
    } else {
        Print-Warning "Java not found. Please install JDK 17+"
        Print-Status "Download from: https://adoptium.net/"
    }
    
    # Check Android SDK
    $androidSdkPaths = @(
        "$env:LOCALAPPDATA\Android\Sdk",
        "$env:USERPROFILE\Android\Sdk",
        "${env:ProgramFiles}\Android\Android Studio"
    )
    
    $androidHome = $env:ANDROID_HOME
    
    if (-not $androidHome) {
        foreach ($path in $androidSdkPaths) {
            if (Test-Path $path) {
                $androidHome = $path
                break
            }
        }
    }
    
    if ($androidHome -and (Test-Path $androidHome)) {
        Print-Success "Android SDK found: $androidHome"
        
        # Set environment variable for current session
        $env:ANDROID_HOME = $androidHome
        $env:Path += ";$androidHome\platform-tools"
        $env:Path += ";$androidHome\emulator"
        
        # Check NDK
        $ndkPath = Get-ChildItem -Path "$androidHome\ndk" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($ndkPath) {
            $env:NDK_HOME = $ndkPath.FullName
            Print-Success "NDK found: $($ndkPath.Name)"
        } else {
            Print-Warning "NDK not found. Install via Android Studio SDK Manager"
        }
    } else {
        Print-Warning "Android SDK not found"
        Print-Status "Please install Android Studio from: https://developer.android.com/studio"
        Print-Status "Then install SDK, NDK via SDK Manager"
    }
}

# Add Rust Android targets
function Add-RustAndroidTargets {
    Print-Status "Adding Rust Android targets..."
    
    rustup target add aarch64-linux-android
    rustup target add armv7-linux-androideabi
    rustup target add i686-linux-android
    rustup target add x86_64-linux-android
    
    Print-Success "Rust Android targets added"
}

# Install Node.js dependencies
function Install-NodeDeps {
    Print-Status "Installing Node.js dependencies..."
    
    if (Command-Exists "bun") {
        bun install
    } elseif (Command-Exists "npm") {
        npm install
    } else {
        Print-Error "Neither bun nor npm found. Please install Node.js or Bun"
        Print-Status "Bun: https://bun.sh/"
        Print-Status "Node.js: https://nodejs.org/"
        exit 1
    }
    
    Print-Success "Node.js dependencies installed"
}

# Create environment setup script
function Create-EnvScript {
    Print-Status "Creating environment setup script..."
    
    $envScript = @'
# Finance Tracker - Environment Setup
# Run this in PowerShell: . .\env-setup.ps1

# Rust
$env:Path += ";$env:USERPROFILE\.cargo\bin"

# Android SDK (update paths as needed)
if (-not $env:ANDROID_HOME) {
    $possiblePaths = @(
        "$env:LOCALAPPDATA\Android\Sdk",
        "$env:USERPROFILE\Android\Sdk"
    )
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $env:ANDROID_HOME = $path
            break
        }
    }
}

if ($env:ANDROID_HOME) {
    $env:Path += ";$env:ANDROID_HOME\platform-tools"
    $env:Path += ";$env:ANDROID_HOME\emulator"
    
    # NDK
    $ndkDir = Join-Path $env:ANDROID_HOME "ndk"
    if (Test-Path $ndkDir) {
        $ndkVersion = Get-ChildItem $ndkDir | Select-Object -First 1
        if ($ndkVersion) {
            $env:NDK_HOME = $ndkVersion.FullName
        }
    }
}

Write-Host "Environment configured!" -ForegroundColor Green
Write-Host "ANDROID_HOME: $env:ANDROID_HOME"
Write-Host "NDK_HOME: $env:NDK_HOME"
'@
    
    $envScript | Out-File -FilePath "env-setup.ps1" -Encoding UTF8
    Print-Success "Environment script created: env-setup.ps1"
}

# Print final instructions
function Print-Instructions {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Setup Complete!" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Desktop Development:"
    Write-Host "    bun tauri:dev           - Start dev server"
    Write-Host "    bun tauri:build         - Build for Windows"
    Write-Host ""
    Write-Host "  Android Development:"
    Write-Host "    bun tauri:android:dev   - Run on Android device/emulator"
    Write-Host "    bun tauri:android:build - Build Android APK"
    Write-Host ""
    Write-Host "If this is your first time:" -ForegroundColor Yellow
    Write-Host "  1. Restart PowerShell to reload PATH"
    Write-Host "  2. Run: .\env-setup.ps1"
    Write-Host "  3. For Android, ensure ANDROID_HOME and NDK are set"
    Write-Host ""
    Write-Host "Repository: " -NoNewline
    Write-Host "https://github.com/WissamZa/finance-tracker-tauri" -ForegroundColor Blue
    Write-Host ""
}

# Main execution
function Main {
    # Check for administrator privileges
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    if (-not $isAdmin) {
        Print-Warning "Running without administrator privileges."
        Print-Warning "Some installations may fail. Consider running as Administrator."
        Write-Host ""
    }
    
    # Install Rust
    Install-Rust
    Write-Host ""
    
    # Install Visual Studio Build Tools
    Install-VSBuildTools
    Write-Host ""
    
    # Install WebView2
    Install-WebView2
    Write-Host ""
    
    # Add Rust Android targets
    Add-RustAndroidTargets
    Write-Host ""
    
    # Check Android setup
    Check-Android
    Write-Host ""
    
    # Install Node.js dependencies
    Install-NodeDeps
    Write-Host ""
    
    # Create environment script
    Create-EnvScript
    Write-Host ""
    
    # Print instructions
    Print-Instructions
}

# Run main function
Main
