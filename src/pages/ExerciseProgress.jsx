import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getExercise, getSessionsByExercise, deleteSession } from '../lib/db.js';
import { TrashIcon, PlusIcon, ArrowLeftIcon } from '../components/Icons.jsx';
import {
  bestWeightPR,
  best1RM,
  maxReps,
  maxSets,
  maxVolume,
  progressSeries,
} from '../lib/stats.js';

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('es-419', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ChartCard({ title, data, unit }) {
  if (data.length < 2) return null;
  return (
    <div className="card chart-card">
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data.map((d) => ({ ...d, label: formatDate(d.date) }))}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit={unit} />
          <Tooltip
            formatter={(value) => [`${Math.round(value * 10) / 10}${unit}`, title]}
            contentStyle={{ fontSize: 12 }}
          />
          <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ExerciseProgress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState(null);
  const [sessions, setSessions] = useState([]);

  async function load() {
    const ex = await getExercise(id);
    if (!ex) {
      navigate('/');
      return;
    }
    setExercise(ex);
    setSessions(await getSessionsByExercise(id));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDeleteSession(sid) {
    await deleteSession(sid);
    load();
  }

  if (!exercise) return <p className="helper-text">Cargando...</p>;

  const weightPR = bestWeightPR(sessions);
  const rmPR = best1RM(sessions);
  const repsPR = maxReps(sessions);
  const setsPR = maxSets(sessions);
  const volumePR = maxVolume(sessions);

  const rmSeries = progressSeries(sessions, '1rm');
  const volumeSeries = progressSeries(sessions, 'volume');
  const topWeightSeries = progressSeries(sessions, 'topWeight');

  const sortedDesc = [...sessions].sort((a, b) => b.date - a.date);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <Link
          to={`/routine/${exercise.routineId}`}
          className="back-link"
          style={{ marginBottom: 0 }}
          aria-label="Volver a la rutina"
          title="Volver a la rutina"
        >
          <ArrowLeftIcon size={16} />
        </Link>
        <h1 style={{ marginBottom: 0 }}>{exercise.name}</h1>
      </div>
      <Link
        to={`/exercise/${id}/log`}
        className="btn btn-primary btn-block"
        aria-label="Registrar sesión"
        title="Registrar sesión"
        style={{ marginBottom: '1rem' }}
      >
        <PlusIcon size={14} />
      </Link>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <p>Todavía no hay sesiones registradas para este ejercicio.</p>
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-tile">
              <div className="label">PR de peso</div>
              <div className="value">{weightPR.value} kg</div>
              <div className="sub">{formatDate(weightPR.date)}</div>
            </div>
            <div className="stat-tile">
              <div className="label">1RM estimado</div>
              <div className="value">{Math.round(rmPR.value * 10) / 10} kg</div>
              <div className="sub">{formatDate(rmPR.date)}</div>
            </div>
            <div className="stat-tile">
              <div className="label">Máx. reps</div>
              <div className="value">{repsPR.value}</div>
              <div className="sub">{formatDate(repsPR.date)}</div>
            </div>
            <div className="stat-tile">
              <div className="label">Máx. series</div>
              <div className="value">{setsPR.value}</div>
              <div className="sub">{formatDate(setsPR.date)}</div>
            </div>
            <div className="stat-tile">
              <div className="label">Máx. volumen</div>
              <div className="value">{volumePR.value}</div>
              <div className="sub">{formatDate(volumePR.date)}</div>
            </div>
          </div>

          <ChartCard title="1RM estimado" data={rmSeries} unit=" kg" />
          <ChartCard title="Volumen por sesión" data={volumeSeries} unit="" />
          <ChartCard title="Peso top-set" data={topWeightSeries} unit=" kg" />

          <div className="section-title">
            <h2>Historial</h2>
          </div>
          {sortedDesc.map((s) => (
            <div className="card" key={s.id}>
              <div className="session-history-item">
                <div>
                  <b>{formatDate(s.date)}</b>
                  <div className="sets-summary">
                    {s.sets.map((set) => `${set.weight}kg × ${set.reps}${set.rpe != null ? ` @${set.rpe}` : ''}`).join(' · ')}
                  </div>
                  {s.note && <div className="sets-summary">{s.note}</div>}
                </div>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteSession(s.id)} aria-label="Eliminar" title="Eliminar">
                  <TrashIcon size={14} />
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
