import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getRoutines,
  getExercisesByRoutine,
  addRoutine,
  updateRoutine,
  deleteRoutine,
  seedIfEmpty,
} from '../lib/db.js';
import seedData from '../data/seed-data.json';
import { PlusIcon, EditIcon, TrashIcon, SaveIcon, SparklesIcon, CloseIcon } from '../components/Icons.jsx';

export default function RoutineList() {
  const [routines, setRoutines] = useState(null);
  const [counts, setCounts] = useState({});
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  async function load() {
    const list = await getRoutines();
    setRoutines(list);
    const entries = await Promise.all(
      list.map(async (r) => [r.id, (await getExercisesByRoutine(r.id)).length])
    );
    setCounts(Object.fromEntries(entries));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    await addRoutine({ name });
    setNewName('');
    setShowNew(false);
    load();
  }

  async function handleRename(id) {
    const name = editingName.trim();
    if (name) {
      await updateRoutine(id, { name });
    }
    setEditingId(null);
    load();
  }

  async function handleDelete(id) {
    await deleteRoutine(id);
    setConfirmDeleteId(null);
    load();
  }

  async function handleLoadSeed() {
    await seedIfEmpty(seedData);
    load();
  }

  if (routines === null) {
    return <p className="helper-text">Cargando...</p>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1.25rem' }}>Rutinas</h1>
      <button
        className="btn btn-primary btn-block"
        onClick={() => setShowNew(true)}
        aria-label="Nueva rutina"
        title="Nueva rutina"
        style={{ marginBottom: '1rem' }}
      >
        <PlusIcon />
      </button>

      {routines.length === 0 && (
        <div className="empty-state">
          <p>Todavía no tienes rutinas.</p>
          <p style={{ marginTop: '0.5rem' }}>
            <button className="btn" onClick={handleLoadSeed} aria-label="Cargar rutinas de ejemplo" title="Cargar rutinas de ejemplo">
              <SparklesIcon size={14} />
            </button>
          </p>
        </div>
      )}

      {routines.map((r) => (
        <div className="card" key={r.id}>
          {editingId === r.id ? (
            <div className="field-row" style={{ marginBottom: 0 }}>
              <input
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename(r.id)}
              />
              <button className="btn btn-sm" onClick={() => handleRename(r.id)} aria-label="Guardar" title="Guardar">
                <SaveIcon size={14} />
              </button>
              <button className="btn btn-sm" onClick={() => setEditingId(null)} aria-label="Cancelar" title="Cancelar">
                <CloseIcon size={14} />
              </button>
            </div>
          ) : (
            <div className="routine-card">
              <Link to={`/routine/${r.id}`} style={{ flex: 1 }}>
                <h2 style={{ marginBottom: '0.15rem' }}>{r.name}</h2>
                <div className="meta">{counts[r.id] ?? 0} ejercicios</div>
              </Link>
              <div className="routine-card-actions">
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    setEditingId(r.id);
                    setEditingName(r.name);
                  }}
                  aria-label="Renombrar"
                  title="Renombrar"
                >
                  <EditIcon size={14} />
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => setConfirmDeleteId(r.id)} aria-label="Eliminar" title="Eliminar">
                  <TrashIcon size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva rutina</h2>
            <form onSubmit={handleCreate}>
              <div className="field">
                <label>Nombre</label>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ej. Pecho, Hombro y Tríceps"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowNew(false)} aria-label="Cancelar" title="Cancelar">
                  <CloseIcon size={14} />
                </button>
                <button type="submit" className="btn btn-primary" aria-label="Crear" title="Crear">
                  <PlusIcon size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>¿Eliminar rutina?</h2>
            <p className="helper-text">
              Se eliminarán también todos sus ejercicios y sesiones registradas. Esta acción no se puede deshacer.
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setConfirmDeleteId(null)} aria-label="Cancelar" title="Cancelar">
                <CloseIcon size={14} />
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDeleteId)} aria-label="Eliminar" title="Eliminar">
                <TrashIcon size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
