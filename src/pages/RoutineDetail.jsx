import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getRoutine,
  getExercisesByRoutine,
  addExercise,
  updateExercise,
  deleteExercise,
} from '../lib/db.js';
import { PlusIcon, EditIcon, TrashIcon, SaveIcon, LogIcon, CloseIcon, ArrowLeftIcon } from '../components/Icons.jsx';

const EMPTY_FORM = {
  name: '',
  muscleGroup: '',
  workSets: '',
  targetReps: '',
  rpeInitial: '',
  rpeLast: '',
  rest: '',
  notes: '',
};

export default function RoutineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [routine, setRoutine] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  async function load() {
    const r = await getRoutine(id);
    if (!r) {
      navigate('/');
      return;
    }
    setRoutine(r);
    setExercises(await getExercisesByRoutine(id));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (showForm || confirmDeleteId !== null) {
      const { overflow } = document.body.style;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = overflow;
      };
    }
  }, [showForm, confirmDeleteId]);

  function openNewForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(ex) {
    setEditingId(ex.id);
    setForm({
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      workSets: String(ex.workSets ?? ''),
      targetReps: ex.targetReps,
      rpeInitial: ex.rpeInitial,
      rpeLast: ex.rpeLast,
      rest: ex.rest,
      notes: ex.notes,
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      workSets: form.workSets === '' ? 0 : Number(form.workSets) || 0,
    };
    if (editingId) {
      await updateExercise(editingId, payload);
    } else {
      await addExercise({ ...payload, routineId: id });
    }
    setShowForm(false);
    load();
  }

  async function handleDelete(exId) {
    await deleteExercise(exId);
    setConfirmDeleteId(null);
    load();
  }

  if (!routine) return <p className="helper-text">Cargando...</p>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <Link to="/" className="back-link" style={{ marginBottom: 0 }} aria-label="Volver a rutinas" title="Volver a rutinas">
          <ArrowLeftIcon size={16} />
        </Link>
        <h1 style={{ marginBottom: 0 }}>{routine.name}</h1>
      </div>
      <button
        className="btn btn-primary btn-block"
        onClick={openNewForm}
        aria-label="Agregar ejercicio"
        title="Agregar ejercicio"
        style={{ marginBottom: '1rem' }}
      >
        <PlusIcon />
      </button>

      {exercises.length === 0 ? (
        <div className="empty-state">
          <p>Esta rutina todavía no tiene ejercicios.</p>
        </div>
      ) : (
        <>
          <div className="exercise-table-wrap">
            <table className="exercise-table">
              <thead>
                <tr>
                  <th>Ejercicio</th>
                  <th>Grupo Muscular</th>
                  <th>Series de Trabajo</th>
                  <th>Repeticiones</th>
                  <th>RPE Iniciales</th>
                  <th>RPE Última</th>
                  <th>Descanso</th>
                  <th>Notas / Técnica</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {exercises.map((ex) => (
                  <tr key={ex.id}>
                    <td>
                      <Link className="exercise-name-link" to={`/exercise/${ex.id}/progress`}>
                        {ex.name}
                      </Link>
                    </td>
                    <td>{ex.muscleGroup}</td>
                    <td>{ex.workSets}</td>
                    <td>{ex.targetReps}</td>
                    <td>{ex.rpeInitial}</td>
                    <td>{ex.rpeLast}</td>
                    <td>{ex.rest}</td>
                    <td>{ex.notes}</td>
                    <td>
                      <div className="exercise-row-actions">
                        <Link className="btn btn-sm btn-primary" to={`/exercise/${ex.id}/log`} aria-label="Registrar sesión" title="Registrar sesión">
                          <LogIcon size={14} />
                        </Link>
                        <button className="btn btn-sm" onClick={() => openEditForm(ex)} aria-label="Editar" title="Editar">
                          <EditIcon size={14} />
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => setConfirmDeleteId(ex.id)} aria-label="Eliminar" title="Eliminar">
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="exercise-cards">
            {exercises.map((ex) => (
              <div className="card exercise-mobile-card" key={ex.id}>
                <Link className="exercise-name-link" to={`/exercise/${ex.id}/progress`}>
                  {ex.name}
                </Link>
                <div className="exercise-meta">
                  <div><b>Grupo:</b> {ex.muscleGroup}</div>
                  <div><b>Series:</b> {ex.workSets}</div>
                  <div><b>Reps:</b> {ex.targetReps}</div>
                  <div><b>Descanso:</b> {ex.rest}</div>
                  <div><b>RPE inicial:</b> {ex.rpeInitial}</div>
                  <div><b>RPE última:</b> {ex.rpeLast}</div>
                </div>
                {ex.notes && <p className="helper-text" style={{ marginBottom: '0.5rem' }}>{ex.notes}</p>}
                <div className="exercise-row-actions">
                  <Link className="btn btn-sm btn-primary" to={`/exercise/${ex.id}/log`} aria-label="Registrar sesión" title="Registrar sesión">
                    <LogIcon size={14} />
                  </Link>
                  <button className="btn btn-sm" onClick={() => openEditForm(ex)} aria-label="Editar" title="Editar">
                    <EditIcon size={14} />
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => setConfirmDeleteId(ex.id)} aria-label="Eliminar" title="Eliminar">
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Editar ejercicio' : 'Nuevo ejercicio'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Ejercicio</label>
                <input
                  autoFocus
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Grupo Muscular</label>
                <input
                  value={form.muscleGroup}
                  onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })}
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Series de Trabajo</label>
                  <input
                    type="number"
                    min="0"
                    value={form.workSets}
                    onChange={(e) => setForm({ ...form, workSets: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Repeticiones</label>
                  <input
                    placeholder="8-10"
                    value={form.targetReps}
                    onChange={(e) => setForm({ ...form, targetReps: e.target.value })}
                  />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>RPE Series Iniciales</label>
                  <input
                    placeholder="~8-9"
                    value={form.rpeInitial}
                    onChange={(e) => setForm({ ...form, rpeInitial: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>RPE Última Serie</label>
                  <input
                    placeholder="10"
                    value={form.rpeLast}
                    onChange={(e) => setForm({ ...form, rpeLast: e.target.value })}
                  />
                </div>
              </div>
              <div className="field">
                <label>Descanso</label>
                <input
                  placeholder="~2-3 min"
                  value={form.rest}
                  onChange={(e) => setForm({ ...form, rest: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Notas / Técnica</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowForm(false)} aria-label="Cancelar" title="Cancelar">
                  <CloseIcon size={14} />
                </button>
                <button type="submit" className="btn btn-primary" aria-label="Guardar" title="Guardar">
                  <SaveIcon size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>¿Eliminar ejercicio?</h2>
            <p className="helper-text">
              Se eliminarán también todas las sesiones registradas de este ejercicio.
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
