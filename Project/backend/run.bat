@echo off
echo ============================================
echo  TalentMatch — Java Backend Build Script
echo ============================================

cd /d "%~dp0src"

if not exist "..\bin" mkdir "..\bin"

echo.
echo [1/2] Compiling Java source files into backend\bin...
javac -d "..\bin" model\Job.java model\Candidate.java algorithm\SkillExtractor.java algorithm\EditDistanceScorer.java algorithm\CandidateRanker.java Main.java

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Compilation failed. Make sure Java JDK is installed.
    echo         Run: java -version  to check.
    pause
    exit /b 1
)

echo [OK] Compilation successful! (.class files stored in backend\bin)
echo.
echo [2/2] Starting TalentMatch server on port 8080...
echo       Open: http://localhost:8080/api/match?jobId=1
echo       Press Ctrl+C to stop.
echo.
java -cp "..\bin" Main

pause
