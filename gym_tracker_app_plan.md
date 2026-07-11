# Plan: App de rutinas de gimnasio (React + Vite + IndexedDB)

## Objetivo
Web app que replica y extiende el Excel `Gym_Splits.xlsx`: crear rutinas con nombre libre, agregar ejercicios con las mismas columnas del Excel, registrar sesiones de entrenamiento (peso/reps/RPE por serie) y visualizar el progreso (máx. series, reps, PRs, etc.). Datos 100% locales en IndexedDB, con exportar/importar JSON para respaldo.

## Stack
- **React + Vite** (SPA, sin backend)
- **IndexedDB** vía `idb` (wrapper ligero con promesas) — `npm i idb`
- Router: `react-router-dom`
- Gráficos: `recharts`
- Estilos: CSS modules o Tailwind (a elección de Claude Code)
- Todo client-side; nada sale del navegador salvo por exportación manual a JSON.

---

## Modelo de datos (IndexedDB)

Base de datos `gymTrackerDB`. Object stores:

### `routines`
Rutina con nombre libre (reemplaza los "días fijos" del Excel).
```
{
  id: string (uuid),
  name: string,              // ej. "Pecho, Hombro y Tríceps"
  createdAt: number,
  order: number              // para ordenar en la UI
}
```

### `exercises`
Ejercicio dentro de una rutina. Columnas espejo del Excel.
```
{
  id: string (uuid),
  routineId: string,         // FK -> routines.id
  name: string,              // Ejercicio
  muscleGroup: string,       // Grupo Muscular
  workSets: number,          // Series de Trabajo (objetivo)
  targetReps: string,        // Repeticiones (texto: "8-10", "Las que den", "30-45 seg")
  rpeInitial: string,        // RPE Series Iniciales (texto: "~8-9")
  rpeLast: string,           // RPE Última Serie (texto: "10")
  rest: string,              // Descanso (texto: "~2-3 min")
  notes: string,             // Notas / Técnica
  order: number
}
```
> Índice por `routineId`.

### `sessions`
Un registro de entrenamiento de un ejercicio en una fecha. Aquí vive el progreso.
```
{
  id: string (uuid),
  exerciseId: string,        // FK -> exercises.id
  date: number,              // timestamp
  sets: [                    // series efectivamente realizadas
    { weight: number, reps: number, rpe: number|null }
  ],
  note: string               // opcional, comentario de la sesión
}
```
> Índices por `exerciseId` y por `date`.

---

## Pantallas / Rutas

1. **`/` — Lista de rutinas**
   - Tarjetas con nombre de cada rutina y nº de ejercicios.
   - Botón "Nueva rutina" (input de nombre libre).
   - Reordenar / renombrar / eliminar rutina.

2. **`/routine/:id` — Detalle de rutina (vista tipo Excel)**
   - Tabla con las columnas exactas del Excel: Ejercicio · Grupo Muscular · Series de Trabajo · Repeticiones · RPE Series Iniciales · RPE Última Serie · Descanso · Notas / Técnica.
   - Botón "Agregar ejercicio" → formulario con esos campos.
   - Editar / eliminar / reordenar ejercicios.
   - Cada fila enlaza a la vista de progreso del ejercicio.
   - Botón "Registrar sesión" para entrenar esta rutina hoy.

3. **`/exercise/:id/log` — Registrar sesión**
   - Muestra objetivo (targetReps, rpe, workSets) como referencia.
   - Permite agregar N series con `weight`, `reps`, `rpe`.
   - Precarga por defecto los valores de la última sesión (quick-fill).
   - Guarda en `sessions`.

4. **`/exercise/:id/progress` — Progreso del ejercicio**
   - Métricas calculadas sobre todas las sesiones:
     - **PR de peso** (máx. weight en cualquier serie) + fecha.
     - **PR de 1RM estimado** (fórmula Epley: `weight * (1 + reps/30)`), el mejor y su fecha.
     - **Máx. reps** en una serie y **máx. volumen** en una sesión (`Σ weight*reps`).
     - **Máx. nº de series** en una sesión.
     - **Mejor RPE-ajustado** (opcional).
   - Gráficos (recharts):
     - 1RM estimado vs fecha (line chart).
     - Volumen por sesión vs fecha.
     - Peso top-set vs fecha.
   - Tabla/historial de sesiones (fecha + resumen de series), con opción de editar/eliminar sesión.

5. **`/backup` — Respaldo**
   - **Exportar JSON**: dump completo de `routines` + `exercises` + `sessions` en un solo archivo `gym-backup-YYYY-MM-DD.json`, descarga vía Blob.
   - **Importar JSON**: leer archivo, validar shape, y ofrecer *merge* o *reemplazar todo*.
   - Mostrar fecha del último respaldo.

---

## Lógica de progreso (utils)
Crear `src/lib/stats.js` con funciones puras que reciben un array de `sessions` de un ejercicio:
- `bestWeightPR(sessions)` → `{ value, date }`
- `estimated1RM(set)` → Epley
- `best1RM(sessions)` → `{ value, date, set }`
- `maxReps(sessions)`, `maxSets(sessions)`, `maxVolume(sessions)`
- `sessionVolume(session)` → `Σ weight*reps`
- `progressSeries(sessions, metric)` → `[{ date, value }]` para los charts

Tests unitarios básicos de estas funciones (Vitest) — es la parte con más riesgo de bug.

---

## Capa de datos (`src/lib/db.js`)
- `initDB()` con `idb.openDB`, define los 3 stores e índices.
- CRUD por store: `getRoutines`, `addRoutine`, `updateRoutine`, `deleteRoutine` (cascada: borra sus exercises y sessions), análogos para exercises y sessions.
- `exportAll()` → objeto `{ version, exportedAt, routines, exercises, sessions }`.
- `importAll(data, mode)` → `'replace'` limpia y recarga; `'merge'` conserva por id.
- Versionado del schema en el JSON (`version: 1`) para futuras migraciones.

---

## Datos semilla (opcional pero recomendado)
Incluir un botón "Cargar rutinas de ejemplo" que precargue las 3 rutinas del Excel original, para que la app no arranque vacía:

- **Pecho, Hombro y Tríceps** (9 ejercicios)
- **Core** (11 ejercicios)
- **Espalda, Dorsales y Bíceps** (6 ejercicios)

Los datos exactos están en `seed-data.json` (adjunto). Cárgalos tal cual en los stores `routines` + `exercises` (sin sesiones).

---

## Pasos de implementación
1. `npm create vite@latest` (React) + instalar `idb`, `react-router-dom`, `recharts`.
2. Implementar `db.js` (schema + CRUD + export/import).
3. Implementar `stats.js` + tests con Vitest.
4. Pantalla de rutinas → detalle de rutina (tabla Excel) → alta de ejercicios.
5. Registro de sesiones.
6. Vista de progreso con métricas y charts.
7. Pantalla de respaldo (export/import JSON).
8. Semilla de ejemplo.
9. Estilos y responsive (uso principal en móvil, en el gym).

## Criterios de aceptación
- Crear rutina con nombre libre y agregarle ejercicios con las 8 columnas del Excel.
- Registrar una sesión con varias series (peso/reps/RPE) y verla en el historial.
- La vista de progreso muestra PR de peso, 1RM estimado, máx. reps, máx. series y máx. volumen, con al menos un gráfico temporal.
- Exportar todo a JSON y volver a importarlo restaurando el estado íntegro.
- Todo persiste tras recargar el navegador (IndexedDB).
- Funciona offline.
