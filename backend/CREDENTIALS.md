# Credenciales de Prueba para el Sistema

## Usuarios disponibles después del seeding

### Coordinador del Sistema
- **Email:** coordinador@unsa.edu.pe
- **Contraseña:** 123456
- **Rol:** COORDINATOR

### Profesores (ejemplos basados en el seeding)
Los profesores tienen emails generados automáticamente basados en su nombre:

1. **DR. JUAN CARLOS GUTIERREZ CACERES**
   - **Email:** carlos@unsa.edu.pe
   - **Contraseña:** 123456
   - **Rol:** PROFESSOR

2. **MG. ANA MARIA CUADROS VALDIVIA**
   - **Email:** maria@unsa.edu.pe
   - **Contraseña:** 123456
   - **Rol:** PROFESSOR

3. **DR. CRISTIAN JOSE LOPEZ DEL ALAMO**
   - **Email:** jose@unsa.edu.pe
   - **Contraseña:** 123456
   - **Rol:** PROFESSOR

Y así sucesivamente para todos los profesores en el sistema.

## Cómo usar el sistema:

### Para Profesores:
1. Inicie sesión con sus credenciales
2. Acceda a la página de profesor
3. Configure su disponibilidad horaria usando el grid interactivo
4. Guarde los cambios

### Para Coordinadores:
1. Inicie sesión con las credenciales del coordinador
2. Acceda a las funcionalidades administrativas del sistema

## Notas importantes:
- Todas las contraseñas por defecto son "123456"
- Los emails se generan tomando la segunda palabra del nombre del profesor
- El sistema maneja autenticación JWT con tokens guardados en cookies
- La disponibilidad se guarda automáticamente al hacer clic en "Guardar Disponibilidad"

## API Endpoints disponibles:
- `POST /auth/login` - Iniciar sesión
- `GET /professors/time-slots` - Obtener todos los bloques de tiempo
- `GET /professors/:id/availability` - Obtener disponibilidad de un profesor
- `PUT /professors/:id/availability` - Actualizar disponibilidad completa
- Y más... (ver API_AVAILABILITY.md para documentación completa)
