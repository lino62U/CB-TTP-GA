// Script de prueba para las nuevas funciones de disponibilidad de profesores
// Para ejecutar: node test_availability.js

const BASE_URL = 'http://localhost:3000';

async function testAvailabilityAPI() {
  console.log('🧪 Iniciando pruebas de la API de disponibilidad...\n');

  try {
    // 1. Obtener todos los time slots
    console.log('1️⃣ Obteniendo todos los time slots...');
    const timeSlotsResponse = await fetch(`${BASE_URL}/professors/time-slots`);
    const timeSlots = await timeSlotsResponse.json();
    console.log(`✅ Se encontraron ${timeSlots.length} time slots\n`);

    // 2. Obtener todos los profesores
    console.log('2️⃣ Obteniendo profesores...');
    const professorsResponse = await fetch(`${BASE_URL}/professors`);
    const professors = await professorsResponse.json();
    console.log(`✅ Se encontraron ${professors.length} profesores\n`);

    if (professors.length === 0 || timeSlots.length === 0) {
      console.log('❌ No hay datos suficientes para las pruebas');
      return;
    }

    const professorId = professors[0].id;
    console.log(`🧑‍🏫 Usando profesor ID: ${professorId} (${professors[0].name})\n`);

    // 3. Obtener disponibilidad actual del profesor
    console.log('3️⃣ Obteniendo disponibilidad actual...');
    const availabilityResponse = await fetch(`${BASE_URL}/professors/${professorId}/availability`);
    const currentAvailability = await availabilityResponse.json();
    console.log(`✅ Disponibilidad actual: ${currentAvailability.availability?.length || 0} time slots\n`);

    // 4. Agregar un nuevo time slot (si hay time slots disponibles)
    if (timeSlots.length > 0) {
      console.log('4️⃣ Agregando un nuevo time slot...');
      const timeSlotToAdd = timeSlots[0];
      
      const addResponse = await fetch(`${BASE_URL}/professors/${professorId}/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          time_slot_id: timeSlotToAdd.id
        })
      });

      if (addResponse.ok) {
        const addResult = await addResponse.json();
        console.log(`✅ Time slot agregado: ${timeSlotToAdd.day_of_week} ${timeSlotToAdd.start_time}-${timeSlotToAdd.end_time}\n`);
      } else {
        const error = await addResponse.json();
        console.log(`ℹ️ No se pudo agregar (posiblemente ya existe): ${error.error}\n`);
      }
    }

    // 5. Obtener disponibilidad actualizada
    console.log('5️⃣ Obteniendo disponibilidad actualizada...');
    const updatedAvailabilityResponse = await fetch(`${BASE_URL}/professors/${professorId}/availability`);
    const updatedAvailability = await updatedAvailabilityResponse.json();
    console.log(`✅ Disponibilidad actualizada: ${updatedAvailability.availability?.length || 0} time slots`);
    
    if (updatedAvailability.availability?.length > 0) {
      console.log('📅 Time slots disponibles:');
      updatedAvailability.availability.forEach((avail, index) => {
        console.log(`   ${index + 1}. ${avail.time_slot.day_of_week} ${avail.time_slot.start_time}-${avail.time_slot.end_time}`);
      });
    }

    console.log('\n🎉 Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

// Ejecutar las pruebas
testAvailabilityAPI();
