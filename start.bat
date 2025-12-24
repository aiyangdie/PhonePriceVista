@echo off
echo ========================================
echo   手机价格展示系统 - 启动服务
echo ========================================
echo.
echo 前端: http://localhost:3000
echo 后端: http://localhost:3001
echo 管理后台: http://localhost:3001/admin
echo 爬虫管理: http://localhost:3001/crawler
echo.
echo ========================================

:: 启动后端服务
start "Backend Server" cmd /k "cd /d %~dp0server && node index.js"

:: 等待2秒让后端先启动
timeout /t 2 /nobreak > nul

:: 启动前端服务
start "Frontend Server" cmd /k "cd /d %~dp0 && npm start"

echo.
echo 服务启动中，请稍候...
echo 浏览器将自动打开 http://localhost:3000
echo.
pause
