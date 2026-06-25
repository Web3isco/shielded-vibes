@echo off
chcp 65001 >nul
title Shielded Vibes - One-Click Setup
cls

:: ══════════════════════════════════════════════════════════════
::  Shielded Vibes — Windows Setup Script
::  Just double-click this file and follow the prompts.
:: ══════════════════════════════════════════════════════════════

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                                                              ║
echo  ║      ███████  ██  ███████  ██  ██████  ███████  ██████       ║
echo  ║      ██       ██  ██       ██  ██   ██ ██      ██   ██      ║
echo  ║      ███████  ██  ███████  ██  ██   ██ █████   ██   ██      ║
echo  ║           ██  ██       ██  ██  ██   ██ ██      ██   ██      ║
echo  ║      ███████  ██  ███████  ██  ██████  ███████  ██████       ║
echo  ║                                                              ║
echo  ║        ██   ██ ██ ██████  ███████ ███████                   ║
echo  ║        ██   ██ ██ ██   ██ ██      ██                        ║
echo  ║        ███████ ██ ██████  █████   ███████                   ║
echo  ║        ██   ██ ██ ██   ██ ██           ██                   ║
echo  ║        ██   ██ ██ ██████  ███████ ███████                   ║
echo  ║                                                              ║
echo  ║  One-Click Setup for Windows                                 ║
echo  ║  Private Payments on Stellar · Powered by ZK Proofs          ║
echo  ║                                                              ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  This script will:
echo    1. Check if Rust is installed
echo    2. Install Visual Studio 2022 Build Tools (C++ compiler)
echo    3. Install Trunk (the build tool)
echo    4. Start the development server
echo.
echo  Total time: ~15-30 minutes (mostly downloads)
echo.
pause
cls

:: ══════════════════════════════════════════════════════════════
::  STEP 1 — Check Rust
:: ══════════════════════════════════════════════════════════════

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                    STEP 1: Check Rust                        ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

rustc --version >nul 2>&1

if %errorlevel% equ 0 (
    echo  ✅  Rust is already installed!
    rustc --version
    echo.
) else (
    echo  ⚠  Rust is NOT installed.
    echo.
    echo  ┌──────────────────────────────────────────────────────────┐
    echo  │  We need to install Rust first.                          │
    echo  │                                                          │
    echo  │  This script will open your browser to rustup.rs.        │
    echo  │  Download and run rustup-init.exe, then:                 │
    echo  │    1. Press Enter for default installation               │
    echo  │    2. Close this script and run it again                 │
    echo  └──────────────────────────────────────────────────────────┘
    echo.
    start https://rustup.rs
    echo.
    echo  ⏳  Waiting for you to install Rust...
    echo     (After installation, close this window and double-click SETUP.bat again)
    echo.
    pause
    exit /b
)

:: ══════════════════════════════════════════════════════════════
::  STEP 2 — Check WASM target
:: ══════════════════════════════════════════════════════════════

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                 STEP 2: Add WASM Target                      ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

rustup target list --installed | findstr "wasm32v1-none" >nul 2>&1

if %errorlevel% equ 0 (
    echo  ✅  WASM target (wasm32v1-none) is already installed!
    echo.
) else (
    echo  📦  Adding wasm32v1-none target for Rust...
    echo.
    rustup target add wasm32v1-none
    if %errorlevel% equ 0 (
        echo  ✅  WASM target installed!
    ) else (
        echo  ⚠  Could not add WASM target. Continuing anyway...
    )
    echo.
)

:: ══════════════════════════════════════════════════════════════
::  STEP 3 — Install Visual Studio Build Tools
:: ══════════════════════════════════════════════════════════════

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║        STEP 3: Visual Studio 2022 Build Tools                ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  This installs the C++ compiler needed to build Trunk.
echo.

:: Check if cl.exe (MSVC compiler) can already compile
cl.exe >nul 2>&1

if %errorlevel% equ 0 (
    echo  ✅  Visual Studio C++ tools are already available!
    echo.
) else (
    echo  📦  Installing Visual Studio 2022 Build Tools via winget...
    echo     (This downloads ~2 GB — may take 10-20 minutes)
    echo.
    echo  ┌──────────────────────────────────────────────────────────┐
    echo  │  A window may pop up asking for permission.              │
    echo  │  Click "Yes" to allow the installation.                  │
    echo  └──────────────────────────────────────────────────────────┘
    echo.
    winget install Microsoft.VisualStudio.2022.BuildTools --accept-source-agreements --accept-package-agreements
    echo.
    if %errorlevel% neq 0 (
        echo  ⚠  Basic install finished. Now adding C++ workload...
    )
    echo.
    echo  📦  Adding C++ development workload...
    echo     (This installs the Windows SDK and C++ compiler)
    echo.
    echo  ┌──────────────────────────────────────────────────────────┐
    echo  │  This step may take 5-15 minutes. Please be patient.     │
    echo  │  You might see a window showing download progress.       │
    echo  └──────────────────────────────────────────────────────────┘
    echo.

    set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
    if not exist "%VSWHERE%" (
        set "VSWHERE=%ProgramFiles%\Microsoft Visual Studio\Installer\vswhere.exe"
    )

    for /f "usebackq delims=" %%i in (`"%VSWHERE%" -latest -property installationPath`) do set "VS_PATH=%%i"

    if defined VS_PATH (
        echo  Found Visual Studio at: %VS_PATH%
        "%VS_PATH%\Installer\vs_installer.exe" modify --installPath "%VS_PATH%" --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --quiet --norestart
        echo.
        echo  ✅  C++ workload installation complete!
    ) else (
        echo  ⚠  Visual Studio Installer not found at expected path.
        echo  ┌──────────────────────────────────────────────────────────┐
        echo  │  Manual step required:                                    │
        echo  │                                                          │
        echo  │  1. Search Windows for "Visual Studio Installer"         │
        echo  │  2. Open it, find "Visual Studio 2022 Build Tools"       │
        echo  │  3. Click "Modify"                                       │
        echo  │  4. Check "Desktop development with C++" workload        │
        echo  │  5. Click "Modify" and wait for it to install            │
        echo  │  6. Come back here and continue                          │
        echo  └──────────────────────────────────────────────────────────┘
        echo.
        pause
    )
    echo.
)

:: ══════════════════════════════════════════════════════════════
::  STEP 4 — Install Trunk
:: ══════════════════════════════════════════════════════════════

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                  STEP 4: Install Trunk                       ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

trunk --version >nul 2>&1

if %errorlevel% equ 0 (
    echo  ✅  Trunk is already installed!
    trunk --version
    echo.
) else (
    echo  📦  Installing Trunk (Rust WASM build tool)...
    echo     (This compiles from source — may take 5-15 minutes)
    echo.
    echo  ┌──────────────────────────────────────────────────────────┐
    echo  │  This step compiles Rust code and takes a while.         │
    echo  │  Go grab a coffee ☕                                     │
    echo  └──────────────────────────────────────────────────────────┘
    echo.
    cargo install trunk --locked
    echo.
    if %errorlevel% equ 0 (
        echo  ✅  Trunk installed successfully!
    ) else (
        echo  ❌  Trunk installation failed.
        echo.
        echo  ┌──────────────────────────────────────────────────────────┐
        echo  │  Possible fixes:                                         │
        echo  │  1. Close this script, open "x64 Native Tools Command    │
        echo  │     Prompt for VS 2022" from Start Menu                 │
        echo  │  2. Navigate to this folder                              │
        echo  │  3. Run: cargo install trunk --locked                    │
        echo  │  4. Then run: trunk serve                                │
        echo  └──────────────────────────────────────────────────────────┘
        echo.
        pause
        exit /b
    )
)

:: ══════════════════════════════════════════════════════════════
::  STEP 5 — Install npm dependencies
:: ══════════════════════════════════════════════════════════════

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║            STEP 5: Install npm dependencies                  ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

if exist "app\package.json" (
    echo  📦  Installing frontend npm packages...
    echo.
    cd app
    npm install --loglevel=error
    if %errorlevel% equ 0 (
        echo  ✅  npm packages installed!
    ) else (
        echo  ⚠  npm install had warnings — continuing anyway...
    )
    cd ..
    echo.
) else (
    echo  ℹ️  No package.json found — skipping npm install.
    echo.
)

:: ══════════════════════════════════════════════════════════════
::  DONE — Start the server
:: ══════════════════════════════════════════════════════════════

cls
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                                                              ║
echo  ║        ✅  EVERYTHING IS SET UP!                             ║
echo  ║                                                              ║
echo  ║  Starting the development server...                          ║
echo  ║                                                              ║
echo  ║  Open your browser to:                                       ║
echo  ║  →  http://localhost:8000                                     ║
echo  ║                                                              ║
echo  ║  Press Ctrl+C in this window to stop the server              ║
echo  ║                                                              ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
echo  🚀  Starting trunk serve...
echo.

trunk serve

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  Server has stopped.                                        ║
echo  ║  To start again later, just double-click SETUP.bat again.   ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.
pause
