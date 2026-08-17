@echo off
setlocal
cd /d "C:\Users\hupei\StudioProjects\TieJieCombatApp_Android"
set "TIEJIE_NODE=C:\Users\hupei\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%TIEJIE_NODE%" goto launch
set "TIEJIE_NODE=node"
where node >nul 2>nul
if errorlevel 1 goto missing_node
:launch
"%TIEJIE_NODE%" "tools\frame-size-adjuster\server.mjs"
if errorlevel 1 goto launch_failed
exit /b 0
:missing_node
echo Node.js was not found.
echo Install Node.js or ask Codex to update this launcher.
pause
exit /b 1
:launch_failed
echo The frame size adjuster failed to start.
pause
exit /b 1
