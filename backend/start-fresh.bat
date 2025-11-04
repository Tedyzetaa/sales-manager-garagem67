@echo off
echo ========================================
echo  🚀 INICIANDO SALES MANAGER BACKEND
echo  ✅ CORS 100% FUNCIONAL
echo ========================================
echo.

echo 📦 Verificando dependências...
npm list winston || npm install winston
npm list express || npm install express
npm list cors || npm install cors
npm list helmet || npm install helmet
npm list compression || npm install compression
npm list express-rate-limit || npm install express-rate-limit
npm list dotenv || npm install dotenv
npm list bcryptjs || npm install bcryptjs
npm list jsonwebtoken || npm install jsonwebtoken
npm list better-sqlite3 || npm install better-sqlite3
npm list firebase-admin || npm install firebase-admin

echo.
echo 🎯 Iniciando servidor com CORS 100% funcional...
npm run dev

pause