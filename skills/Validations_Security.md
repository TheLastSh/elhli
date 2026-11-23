# Validations_Security.md — Validaciones y Seguridad del Backend

## 1. Validación del CI (Identificación)

- Formato CI V: `V-XXXXXXXX` (dígito único precedido de V)
- Formato CI E: `E-XXXXXXXX` (único, debe estar sin uso en la base de datos)
- Validación:
  - `/^V-\d{8}$/.test(ci)` para V
  - `/^E-\d{8}$/.test(ci)` y unicidad para E (el modelo en Laravel SIRVE AQUI, EN EL MODELO EL CONTROLADOR LLAMA a `User.findOne({ ci })`)

## 2. Emails

- Uso de express-validator: `.isEmail()` y opcionalmente verificación de dominio existente.
- Normalización: `toLowerCase()`.

## 3. Validaciones de Notas (0–20)

- `cut1, cut2, cut3`: número entre 0 y 20, permitir decimales (1 decimal).
- `finalGrade`: verificar fórmula de ponderación (30% + 35% + 35%).

## 4. Validaciones de Asistencia

- status: `['Presente', 'Ausente', 'Justificado']`
- No permitir asistencias para estudiantes que no existen.

## 5. Seguridad

- **express-validator:** middleware de validación en endpoints sensibles (registrar, editar).
- **express-rate-limit:** limitar intentos de login (5 por minuto) y peticiones API general.
- **sanitización:** usar `sanitizeBody` y `sanitizeQuery` para entradas de texto.
- **uploads:** límites de tamaño (maxSize), tipo de archivo (mimeType whitelist), no permitir ejecución.

## 6. Middleware Base

- Estructura estándar:
```javascript
router.post('/students', 
  sanitizeBody('fullName').trim().escape(),
  check('ci').isCI().isUniqueCI(),
  check('email').isEmail().normalizeEmail(),
  check('section').isIn(['IA-1', 'IA-2', 'SIST-1']),
  check('status').isIn(['Activo', 'Retirado', 'En Riesgo']),
  asyncHandler(handler)
);
```
