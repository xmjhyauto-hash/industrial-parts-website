@echo off
REM =====================================================
REM Database & Files Backup Script (Windows)
REM =====================================================
REM Usage: backup.bat
REM Recommended: Run daily via Task Scheduler
REM =====================================================

setlocal enabledelayedexpansion

REM Configuration
set BACKUP_DIR=.\backups
set DATE=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set DATE=%DATE: =0%
set DB_FILE=.\prisma\dev.db
set UPLOADS_DIR=.\public\uploads
set RETENTION_DAYS=30

REM Create backup directory if not exists
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo ======================================================
echo   Backup Script Started
echo   Date: %DATE%
echo ======================================================

REM =====================================================
REM Backup Database
REM =====================================================
echo [%DATE%] Starting database backup...

if not exist "%DB_FILE%" (
    echo ERROR: Database file not found: %DB_FILE%
    goto :error
)

set DB_BACKUP=%BACKUP_DIR%\db_%DATE%.sqlite
copy /Y "%DB_FILE%" "%DB_BACKUP%" >nul

REM Compress using PowerShell (built into Windows)
powershell -Command "Compress-Archive -Path '%DB_BACKUP%' -DestinationPath '%DB_BACKUP%.zip' -Force"
del "%DB_BACKUP%"

echo Database backed up: %DB_BACKUP%.zip

REM =====================================================
REM Backup Uploads
REM =====================================================
echo [%DATE%] Starting uploads backup...

if not exist "%UPLOADS_DIR%" (
    echo WARNING: Uploads directory not found: %UPLOADS_DIR%
    goto :skip_uploads
)

REM Check if uploads is empty
dir /b "%UPLOADS_DIR%" 2>nul | findstr . >nul
if errorlevel 1 (
    echo WARNING: Uploads directory is empty, skipping
    goto :skip_uploads
)

set UPLOADS_BACKUP=%BACKUP_DIR%\uploads_%DATE%.zip
powershell -Command "Compress-Archive -Path '%UPLOADS_DIR%\*' -DestinationPath '%UPLOADS_BACKUP%' -Force"

echo Uploads backed up: %UPLOADS_BACKUP%

:skip_uploads

REM =====================================================
REM Cleanup Old Backups
REM =====================================================
echo [%DATE%] Cleaning up backups older than %RETENTION_DAYS% days...

REM Use forfiles to delete old files (Windows built-in)
forfiles /P "%BACKUP_DIR%" /M db_*.zip /D -%RETENTION_DAYS% /C "cmd /c del @path" 2>nul
forfiles /P "%BACKUP_DIR%" /M uploads_*.zip /D -%RETENTION_DAYS% /C "cmd /c del @path" 2>nul

echo Cleanup complete

REM =====================================================
REM Main
REM =====================================================
echo ======================================================
echo   Backup Script Completed
echo ======================================================

echo.
echo Backup Summary:
echo   Database: %DB_BACKUP%.zip
if exist "%UPLOADS_BACKUP%" (
    echo   Uploads:  %UPLOADS_BACKUP%
)
echo   Location: %BACKUP_DIR%
echo.

exit /b 0

:error
echo ======================================================
echo   Backup Failed
echo ======================================================
exit /b 1
