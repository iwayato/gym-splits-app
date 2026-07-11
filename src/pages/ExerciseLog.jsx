import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getExercise, getLastSession, addSession } from '../lib/db.js';
import { PlusIcon, SaveIcon, TrashIcon, ArrowLeftIcon } from '../components/Icons.jsx';

function makeSet(weight = '', reps = '', rpe = '') {
  return { weight, reps, rpe };
}

export default function ExerciseLog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState(null);
  const [sets, setSets] = useState([makeSet()]);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const ex = await getExercise(id);
      if (!ex) {
        navigate('/');
        return;
      }
      setExercise(ex);
      const last = await getLastSession(id);
      if (last && last.sets.length) {
        setSets(last.sets.map((s) => makeSet(String(s.weight ?? ''), String(s.reps ?? ''), s.rpe != null ? String(s.rpe) : '')));
      } else {
        const count = ex.workSets > 0 ? ex.workSets : 1;
        setSets(Array.from({ length: count }, () => makeSet()));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function updateSet(i, field, value) {
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }

  function addRow() {
    setSets((prev) => [...prev, makeSet()]);
  }

  function removeRow(i) {
    setSets((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave(e) {
    e.preventDefault();
    const cleanSets = sets
      .filter((s) => s.weight !== '' || s.reps !== '')
      .map((s) => ({
        weight: Number(s.weight) || 0,
        reps: Number(s.reps) || 0,
        rpe: s.rpe === '' ? null : Number(s.rpe),
      }));
    if (cleanSets.length === 0) return;
    await addSession({ exerciseId: id, date: Date.now(), sets: cleanSets, note });
    setSaved(true);
    setTimeout(() => navigate(`/exercise/${id}/progress`), 600);
  }

  if (!exercise) return <p className="helper-text">Cargando...</p>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Link
          to={`/exercise/${id}/progress`}
          className="back-link"
          style={{ marginBottom: 0 }}
          aria-label="Volver al ejercicio"
          title="Volver al ejercicio"
        >
          <ArrowLeftIcon size={16} />
        </Link>
        <h1 style={{ marginBottom: 0 }}>{exercise.name}</h1>
      </div>
      <p className="helper-text" style={{ margin: '0.35rem 0 0.15rem' }}>Registrar sesión</p>
      <p className="target-ref">
        Objetivo: {exercise.workSets} series · {exercise.targetReps} reps · RPE {exercise.rpeInitial} → {exercise.rpeLast}
      </p>

      <form onSubmit={handleSave}>
        <div className="card">
          <div className="set-row" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span className="set-index"></span>
            <span style={{ width: '100%' }}>Peso (kg)</span>
            <span style={{ width: '100%' }}>Reps</span>
            <span style={{ width: '100%' }}>RPE</span>
            <span style={{ width: '1.5rem' }}></span>
          </div>
          {sets.map((s, i) => (
            <div className="set-row" key={i}>
              <span className="set-index">{i + 1}</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="kg"
                value={s.weight}
                onChange={(e) => updateSet(i, 'weight', e.target.value)}
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="reps"
                value={s.reps}
                onChange={(e) => updateSet(i, 'reps', e.target.value)}
              />
              <input
                type="number"
                inputMode="decimal"
                placeholder="RPE"
                value={s.rpe}
                onChange={(e) => updateSet(i, 'rpe', e.target.value)}
              />
              <button type="button" className="remove-set" onClick={() => removeRow(i)} aria-label="Quitar serie">
                <TrashIcon size={14} />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-block" onClick={addRow} style={{ marginTop: '0.5rem' }} aria-label="Agregar serie" title="Agregar serie">
            <PlusIcon size={14} />
          </button>
        </div>

        <div className="field" style={{ marginTop: '1rem' }}>
          <label>Nota (opcional)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <button type="submit" className="btn btn-primary btn-block" aria-label="Guardar sesión" title="Guardar sesión">
          <SaveIcon size={14} />
        </button>
        {saved && <p className="helper-text" style={{ textAlign: 'center', marginTop: '0.5rem' }}>Guardado ✓</p>}
      </form>
    </div>
  );
}
