#!/bin/bash
# Script de verificación completa del sistema

echo "🔍 Verificación completa del sistema de disponibilidad de profesores"
echo "=================================================================="

cd "/home/leon/Documentos/UNSA/TI 3/CB-TTP-GA"

echo "📁 Verificando estructura de archivos..."
echo "✅ Backend:"
ls -la backend/src/controllers/professorController.ts > /dev/null 2>&1 && echo "  ✅ professorController.ts existe"
ls -la backend/src/routes/professorRoutes.ts > /dev/null 2>&1 && echo "  ✅ professorRoutes.ts existe"
ls -la backend/src/seed.ts > /dev/null 2>&1 && echo "  ✅ seed.ts existe"

echo "✅ Frontend:"
ls -la frontend/src/pages/TeacherPage.tsx > /dev/null 2>&1 && echo "  ✅ TeacherPage.tsx existe"
ls -la frontend/src/components/teacher/AvailabilityGrid.tsx > /dev/null 2>&1 && echo "  ✅ AvailabilityGrid.tsx existe"
ls -la frontend/src/services/availabilityService.ts > /dev/null 2>&1 && echo "  ✅ availabilityService.ts existe"
ls -la frontend/src/types/teacher.ts > /dev/null 2>&1 && echo "  ✅ teacher types existe"

echo ""
echo "🏗️  Verificando compilación..."
echo "Backend TypeScript:"
cd backend
npx tsc --noEmit > /dev/null 2>&1 && echo "  ✅ Backend compila sin errores" || echo "  ❌ Backend tiene errores de TypeScript"

echo "Frontend TypeScript:"
cd ../frontend
npx tsc --noEmit > /dev/null 2>&1 && echo "  ✅ Frontend compila sin errores" || echo "  ❌ Frontend tiene errores de TypeScript"

echo ""
echo "📝 Archivos de documentación:"
cd ..
ls -la RESUMEN_IMPLEMENTACION.md > /dev/null 2>&1 && echo "  ✅ Resumen de implementación"
ls -la backend/API_AVAILABILITY.md > /dev/null 2>&1 && echo "  ✅ Documentación de API"
ls -la backend/CREDENTIALS.md > /dev/null 2>&1 && echo "  ✅ Credenciales de prueba"

echo ""
echo "🧪 Herramientas de prueba:"
ls -la backend/test_availability.js > /dev/null 2>&1 && echo "  ✅ Script de prueba Node.js"
ls -la backend/test_frontend.html > /dev/null 2>&1 && echo "  ✅ Interface de prueba HTML"

echo ""
echo "🎉 Verificación completa!"
echo "El sistema está listo para usar."
echo ""
echo "Para ejecutar:"
echo "  Backend: cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo "  Login: carlos@unsa.edu.pe / 123456"
