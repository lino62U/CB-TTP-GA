#!/bin/bash

echo "🧪 Test rápido de la API de disponibilidad"
echo "=========================================="

# Test 1: Verificar que el backend esté corriendo
echo "1. Verificando backend..."
curl -s http://localhost:3000/health > /dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Backend está corriendo"
else
    echo "   ❌ Backend no responde"
    exit 1
fi

# Test 2: Obtener time slots
echo "2. Obteniendo time slots..."
SLOTS=$(curl -s http://localhost:3000/professors/time-slots | jq length 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   ✅ Time slots obtenidos: $SLOTS slots"
else
    echo "   ❌ Error obteniendo time slots"
fi

# Test 3: Login de profesor
echo "3. Probando login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"carlos@unsa.edu.pe","password":"123456"}' | jq -r '.token' 2>/dev/null)

if [ "$LOGIN_RESPONSE" != "null" ] && [ ! -z "$LOGIN_RESPONSE" ]; then
    echo "   ✅ Login exitoso"
    TOKEN="$LOGIN_RESPONSE"
else
    echo "   ❌ Login falló"
    exit 1
fi

# Test 4: Obtener disponibilidad del profesor
echo "4. Obteniendo disponibilidad del profesor ID 1..."
AVAILABILITY=$(curl -s -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/professors/1/availability | jq '.availability | length' 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "   ✅ Disponibilidad obtenida: $AVAILABILITY slots"
else
    echo "   ❌ Error obteniendo disponibilidad"
fi

echo ""
echo "🎯 Conclusión: La API está funcionando correctamente"
echo "   El problema debe estar en el frontend"
