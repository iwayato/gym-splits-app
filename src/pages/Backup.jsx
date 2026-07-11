import { useEffect, useRef, useState } from 'react';
import { exportAll, importAll, seedIfEmpty } from '../lib/db.js';
import seedData from '../data/seed-data.json';
import { DownloadIcon, UploadIcon, SparklesIcon, MergeIcon, ReplaceIcon, CloseIcon } from '../components/Icons.jsx';

const LAST_BACKUP_KEY = 'gymTracker.lastBackupAt';

function formatDateTime(ts) {
  if (!ts) return 'nunca';
  return new Date(ts).toLocaleString('es-419');
}

export default function Backup() {
  const fileInputRef = useRef(null);
  const [lastBackup, setLastBackup] = useState(() => localStorage.getItem(LAST_BACKUP_KEY));
  const [pendingImport, setPendingImport] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleExport() {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `gym-backup-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const now = Date.now();
    localStorage.setItem(LAST_BACKUP_KEY, String(now));
    setLastBackup(String(now));
    setToast('Respaldo exportado');
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.routines) || !Array.isArray(data.exercises) || !Array.isArray(data.sessions)) {
          setToast('El archivo no tiene el formato esperado');
          return;
        }
        setPendingImport(data);
      } catch {
        setToast('No se pudo leer el archivo JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleImport(mode) {
    if (!pendingImport) return;
    try {
      await importAll(pendingImport, mode);
      setToast(mode === 'replace' ? 'Datos reemplazados' : 'Datos fusionados');
    } catch {
      setToast('Error al importar');
    } finally {
      setPendingImport(null);
    }
  }

  async function handleLoadSeed() {
    const loaded = await seedIfEmpty(seedData);
    setToast(loaded ? 'Rutinas de ejemplo cargadas' : 'Ya tienes rutinas — no se sobrescribieron');
  }

  return (
    <div>
      <h1>Respaldo</h1>
      <p className="helper-text" style={{ marginBottom: '1rem' }}>
        Último respaldo: {formatDateTime(lastBackup ? Number(lastBackup) : null)}
      </p>

      <div className="card">
        <h2>Exportar</h2>
        <p className="helper-text" style={{ marginBottom: '0.75rem' }}>
          Descarga un archivo JSON con todas tus rutinas, ejercicios y sesiones.
        </p>
        <button className="btn btn-primary btn-block" onClick={handleExport} aria-label="Exportar JSON" title="Exportar JSON">
          <DownloadIcon size={14} />
        </button>
      </div>

      <div className="card">
        <h2>Importar</h2>
        <p className="helper-text" style={{ marginBottom: '0.75rem' }}>
          Restaura un respaldo previo. Podrás elegir entre fusionar con tus datos actuales o reemplazarlos por completo.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button className="btn btn-block" onClick={() => fileInputRef.current?.click()} aria-label="Elegir archivo JSON" title="Elegir archivo JSON">
          <UploadIcon size={14} />
        </button>
      </div>

      <div className="card">
        <h2>Datos de ejemplo</h2>
        <p className="helper-text" style={{ marginBottom: '0.75rem' }}>
          Carga las 3 rutinas de ejemplo (Pecho/Hombro/Tríceps, Core, Espalda/Dorsales/Bíceps). Solo se aplica si no tienes rutinas.
        </p>
        <button className="btn btn-block" onClick={handleLoadSeed} aria-label="Cargar rutinas de ejemplo" title="Cargar rutinas de ejemplo">
          <SparklesIcon size={14} />
        </button>
      </div>

      {pendingImport && (
        <div className="modal-overlay" onClick={() => setPendingImport(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Importar respaldo</h2>
            <p className="helper-text" style={{ marginBottom: '1rem' }}>
              {pendingImport.routines.length} rutinas · {pendingImport.exercises.length} ejercicios ·{' '}
              {pendingImport.sessions.length} sesiones. ¿Cómo quieres aplicarlo?
            </p>
            <div className="modal-actions" style={{ flexDirection: 'column' }}>
              <button className="btn btn-block" onClick={() => handleImport('merge')} aria-label="Fusionar con datos actuales" title="Fusionar con datos actuales">
                <MergeIcon size={14} />
              </button>
              <button className="btn btn-danger btn-block" onClick={() => handleImport('replace')} aria-label="Reemplazar todo" title="Reemplazar todo">
                <ReplaceIcon size={14} />
              </button>
              <button className="btn btn-block" onClick={() => setPendingImport(null)} aria-label="Cancelar" title="Cancelar">
                <CloseIcon size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
