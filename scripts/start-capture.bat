@echo off
REM DeepSeek Token Smart Capture Tool - Windows Launcher

setlocal enabledelayedexpansion

REM Colors (using ANSI escape codes for Windows 10+)
for /F %%A in ('copy /Z "%~f0" nul') do set "BS=%%A"

set "BLUE=[34m"
set "GREEN=[32m"
set "YELLOW=[33m"
set "RED=[31m"
set "RESET=[0m"

REM ============================================
REM Logging Functions
REM ============================================
setlocal
goto :end_log_functions

:log_info
echo %BLUE%[i] %~1%RESET%
exit /b

:log_success
echo %GREEN%[OK] %~1%RESET%
exit /b

:log_warn
echo %YELLOW%[!] %~1%RESET%
exit /b

:log_error
echo %RED%[X] %~1%RESET%
exit /b

:log_header
echo.
echo %BLUE%============================================================%RESET%
echo %BLUE%%~1%RESET%
echo %BLUE%============================================================%RESET%
echo.
exit /b

:end_log_functions
endlocal

REM ============================================
REM Environment Check
REM ============================================
call :check_node
call :check_npm

REM ============================================
REM Main
REM ============================================
setlocal enabledelayedexpansion

cd /d "%~dp0.."

call :log_header "🔐 DeepSeek Token Smart Capture Tool"

set "SCRIPT_DIR=%cd%\scripts"
set "PROJECT_ROOT=%cd%"

call :log_info "Project directory: %PROJECT_ROOT%"
call :log_info "Checking environment..."

REM Check Puppeteer
call :check_puppeteer

REM Check VPS connectivity (optional)
call :log_info "Checking VPS connection..."
ping -n 1 frank >nul 2>&1
if !errorlevel! equ 0 (
    call :log_success "VPS connection OK"
) else (
    call :log_warn "VPS (frank) temporarily unreachable, script will continue"
)

REM Start token capture
call :log_header "Starting Token Capture Tool"
call :log_info "This will open a browser window..."
call :log_info "Please log in to each DeepSeek account in the browser"
call :log_info "The script will automatically capture tokens, no manual action needed"
echo.

REM Run main script
node "%SCRIPT_DIR%\smart-token-capture.mjs"

if !errorlevel! equ 0 (
    call :log_success "Token capture completed!"
) else (
    call :log_error "Token capture failed, please check the logs"
    pause
    exit /b 1
)

endlocal
exit /b 0

REM ============================================
REM Helper Functions
REM ============================================

:check_node
where node >nul 2>&1
if !errorlevel! neq 0 (
    call :log_error "Node.js is not installed"
    echo.
    echo Please install Node.js:
    echo   Windows: Download from https://nodejs.org
    echo   Or use: choco install nodejs
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
call :log_success "Node.js installed: %NODE_VERSION%"
exit /b

:check_npm
where npm >nul 2>&1
if !errorlevel! neq 0 (
    call :log_error "npm is not installed"
    pause
    exit /b 1
)
exit /b

:check_puppeteer
findstr /M "puppeteer" package.json >nul 2>&1
if !errorlevel! neq 0 (
    call :log_warn "Puppeteer not installed, installing now..."
    call npm install puppeteer
    if !errorlevel! neq 0 (
        call :log_error "Failed to install Puppeteer"
        pause
        exit /b 1
    )
    call :log_success "Puppeteer installed"
) else (
    call :log_info "Puppeteer already installed"
)
exit /b
