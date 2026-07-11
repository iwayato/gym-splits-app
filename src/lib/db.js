import { openDB } from 'idb';

const DB_NAME = 'gymTrackerDB';
const DB_VERSION = 1;
const SCHEMA_VERSION = 1;

let dbPromise = null;

export function initDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('routines')) {
          db.createObjectStore('routines', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('exercises')) {
          const store = db.createObjectStore('exercises', { keyPath: 'id' });
          store.createIndex('routineId', 'routineId');
        }
        if (!db.objectStoreNames.contains('sessions')) {
          const store = db.createObjectStore('sessions', { keyPath: 'id' });
          store.createIndex('exerciseId', 'exerciseId');
          store.createIndex('date', 'date');
        }
      },
    });
  }
  return dbPromise;
}

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------- Routines ----------

export async function getRoutines() {
  const db = await initDB();
  const all = await db.getAll('routines');
  return all.sort((a, b) => a.order - b.order);
}

export async function getRoutine(id) {
  const db = await initDB();
  return db.get('routines', id);
}

export async function addRoutine({ name, order }) {
  const db = await initDB();
  const routine = {
    id: uuid(),
    name,
    createdAt: Date.now(),
    order: order ?? (await getRoutines()).length,
  };
  await db.put('routines', routine);
  return routine;
}

export async function updateRoutine(id, changes) {
  const db = await initDB();
  const existing = await db.get('routines', id);
  if (!existing) return null;
  const updated = { ...existing, ...changes };
  await db.put('routines', updated);
  return updated;
}

export async function deleteRoutine(id) {
  const db = await initDB();
  const exercises = await db.getAllFromIndex('exercises', 'routineId', id);
  const tx = db.transaction(['routines', 'exercises', 'sessions'], 'readwrite');
  await tx.objectStore('routines').delete(id);
  for (const ex of exercises) {
    await tx.objectStore('exercises').delete(ex.id);
    const sessionIdx = tx.objectStore('sessions').index('exerciseId');
    const sessions = await sessionIdx.getAllKeys(ex.id);
    for (const sid of sessions) {
      await tx.objectStore('sessions').delete(sid);
    }
  }
  await tx.done;
}

export async function reorderRoutines(orderedIds) {
  const db = await initDB();
  const tx = db.transaction('routines', 'readwrite');
  for (let i = 0; i < orderedIds.length; i++) {
    const routine = await tx.store.get(orderedIds[i]);
    if (routine) {
      routine.order = i;
      await tx.store.put(routine);
    }
  }
  await tx.done;
}

// ---------- Exercises ----------

export async function getExercisesByRoutine(routineId) {
  const db = await initDB();
  const all = await db.getAllFromIndex('exercises', 'routineId', routineId);
  return all.sort((a, b) => a.order - b.order);
}

export async function getExercise(id) {
  const db = await initDB();
  return db.get('exercises', id);
}

export async function addExercise(data) {
  const db = await initDB();
  const existing = await getExercisesByRoutine(data.routineId);
  const exercise = {
    id: uuid(),
    routineId: data.routineId,
    name: data.name || '',
    muscleGroup: data.muscleGroup || '',
    workSets: data.workSets ?? 0,
    targetReps: data.targetReps || '',
    rpeInitial: data.rpeInitial || '',
    rpeLast: data.rpeLast || '',
    rest: data.rest || '',
    notes: data.notes || '',
    order: data.order ?? existing.length,
  };
  await db.put('exercises', exercise);
  return exercise;
}

export async function updateExercise(id, changes) {
  const db = await initDB();
  const existing = await db.get('exercises', id);
  if (!existing) return null;
  const updated = { ...existing, ...changes };
  await db.put('exercises', updated);
  return updated;
}

export async function deleteExercise(id) {
  const db = await initDB();
  const tx = db.transaction(['exercises', 'sessions'], 'readwrite');
  await tx.objectStore('exercises').delete(id);
  const sessionIdx = tx.objectStore('sessions').index('exerciseId');
  const sessionKeys = await sessionIdx.getAllKeys(id);
  for (const sid of sessionKeys) {
    await tx.objectStore('sessions').delete(sid);
  }
  await tx.done;
}

export async function reorderExercises(orderedIds) {
  const db = await initDB();
  const tx = db.transaction('exercises', 'readwrite');
  for (let i = 0; i < orderedIds.length; i++) {
    const exercise = await tx.store.get(orderedIds[i]);
    if (exercise) {
      exercise.order = i;
      await tx.store.put(exercise);
    }
  }
  await tx.done;
}

// ---------- Sessions ----------

export async function getSessionsByExercise(exerciseId) {
  const db = await initDB();
  const all = await db.getAllFromIndex('sessions', 'exerciseId', exerciseId);
  return all.sort((a, b) => a.date - b.date);
}

export async function getSession(id) {
  const db = await initDB();
  return db.get('sessions', id);
}

export async function addSession({ exerciseId, date, sets, note }) {
  const db = await initDB();
  const session = {
    id: uuid(),
    exerciseId,
    date: date ?? Date.now(),
    sets: sets || [],
    note: note || '',
  };
  await db.put('sessions', session);
  return session;
}

export async function updateSession(id, changes) {
  const db = await initDB();
  const existing = await db.get('sessions', id);
  if (!existing) return null;
  const updated = { ...existing, ...changes };
  await db.put('sessions', updated);
  return updated;
}

export async function deleteSession(id) {
  const db = await initDB();
  await db.delete('sessions', id);
}

export async function getLastSession(exerciseId) {
  const sessions = await getSessionsByExercise(exerciseId);
  return sessions.length ? sessions[sessions.length - 1] : null;
}

// ---------- Export / Import ----------

export async function exportAll() {
  const db = await initDB();
  const [routines, exercises, sessions] = await Promise.all([
    db.getAll('routines'),
    db.getAll('exercises'),
    db.getAll('sessions'),
  ]);
  return {
    version: SCHEMA_VERSION,
    exportedAt: Date.now(),
    routines,
    exercises,
    sessions,
  };
}

function validateShape(data) {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.routines) || !Array.isArray(data.exercises) || !Array.isArray(data.sessions)) {
    return false;
  }
  return true;
}

export async function importAll(data, mode = 'merge') {
  if (!validateShape(data)) {
    throw new Error('Formato de archivo inválido');
  }
  const db = await initDB();
  const tx = db.transaction(['routines', 'exercises', 'sessions'], 'readwrite');

  if (mode === 'replace') {
    await tx.objectStore('routines').clear();
    await tx.objectStore('exercises').clear();
    await tx.objectStore('sessions').clear();
  }

  for (const routine of data.routines) {
    await tx.objectStore('routines').put(routine);
  }
  for (const exercise of data.exercises) {
    await tx.objectStore('exercises').put(exercise);
  }
  for (const session of data.sessions) {
    await tx.objectStore('sessions').put(session);
  }

  await tx.done;
}

export async function seedIfEmpty(seedData) {
  const routines = await getRoutines();
  if (routines.length > 0) return false;
  await loadSeedData(seedData);
  return true;
}

export async function loadSeedData(seedData) {
  const db = await initDB();
  const tx = db.transaction(['routines', 'exercises'], 'readwrite');
  for (let r = 0; r < seedData.routines.length; r++) {
    const routineSeed = seedData.routines[r];
    const routineId = uuid();
    await tx.objectStore('routines').put({
      id: routineId,
      name: routineSeed.name,
      createdAt: Date.now(),
      order: routineSeed.order ?? r,
    });
    const exs = routineSeed.exercises || [];
    for (let i = 0; i < exs.length; i++) {
      const ex = exs[i];
      await tx.objectStore('exercises').put({
        id: uuid(),
        routineId,
        name: ex.name || '',
        muscleGroup: ex.muscleGroup || '',
        workSets: ex.workSets ?? 0,
        targetReps: ex.targetReps || '',
        rpeInitial: ex.rpeInitial || '',
        rpeLast: ex.rpeLast || '',
        rest: ex.rest || '',
        notes: ex.notes || '',
        order: ex.order ?? i,
      });
    }
  }
  await tx.done;
}
