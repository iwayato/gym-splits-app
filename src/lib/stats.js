// Funciones puras de estadísticas de progreso.
// Reciben un array de sessions: { id, exerciseId, date, sets: [{weight, reps, rpe}], note }

export function estimated1RM(set) {
  if (!set || typeof set.weight !== 'number' || typeof set.reps !== 'number') return 0;
  if (set.reps <= 0) return 0;
  return set.weight * (1 + set.reps / 30);
}

export function sessionVolume(session) {
  if (!session || !Array.isArray(session.sets)) return 0;
  return session.sets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
}

export function bestWeightPR(sessions) {
  let best = { value: 0, date: null };
  for (const session of sessions || []) {
    for (const set of session.sets || []) {
      if ((set.weight || 0) > best.value) {
        best = { value: set.weight, date: session.date };
      }
    }
  }
  return best;
}

export function best1RM(sessions) {
  let best = { value: 0, date: null, set: null };
  for (const session of sessions || []) {
    for (const set of session.sets || []) {
      const rm = estimated1RM(set);
      if (rm > best.value) {
        best = { value: rm, date: session.date, set };
      }
    }
  }
  return best;
}

export function maxReps(sessions) {
  let best = { value: 0, date: null };
  for (const session of sessions || []) {
    for (const set of session.sets || []) {
      if ((set.reps || 0) > best.value) {
        best = { value: set.reps, date: session.date };
      }
    }
  }
  return best;
}

export function maxSets(sessions) {
  let best = { value: 0, date: null };
  for (const session of sessions || []) {
    const count = (session.sets || []).length;
    if (count > best.value) {
      best = { value: count, date: session.date };
    }
  }
  return best;
}

export function maxVolume(sessions) {
  let best = { value: 0, date: null };
  for (const session of sessions || []) {
    const vol = sessionVolume(session);
    if (vol > best.value) {
      best = { value: vol, date: session.date };
    }
  }
  return best;
}

export function progressSeries(sessions, metric = '1rm') {
  const sorted = [...(sessions || [])].sort((a, b) => a.date - b.date);
  return sorted.map((session) => {
    let value = 0;
    if (metric === '1rm') {
      value = Math.max(0, ...(session.sets || []).map(estimated1RM));
    } else if (metric === 'volume') {
      value = sessionVolume(session);
    } else if (metric === 'topWeight') {
      value = Math.max(0, ...(session.sets || []).map((s) => s.weight || 0));
    } else if (metric === 'maxReps') {
      value = Math.max(0, ...(session.sets || []).map((s) => s.reps || 0));
    }
    return { date: session.date, value };
  });
}
