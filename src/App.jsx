import { HashRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import RoutineList from './pages/RoutineList.jsx';
import RoutineDetail from './pages/RoutineDetail.jsx';
import ExerciseLog from './pages/ExerciseLog.jsx';
import ExerciseProgress from './pages/ExerciseProgress.jsx';
import Backup from './pages/Backup.jsx';
import './App.css';

export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <header className="app-header">
          <Link to="/" className="app-title">
            Gym Splits
          </Link>
          <nav className="app-nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Rutinas
            </NavLink>
            <NavLink to="/backup" className={({ isActive }) => (isActive ? 'active' : '')}>
              Respaldo
            </NavLink>
          </nav>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<RoutineList />} />
            <Route path="/routine/:id" element={<RoutineDetail />} />
            <Route path="/exercise/:id/log" element={<ExerciseLog />} />
            <Route path="/exercise/:id/progress" element={<ExerciseProgress />} />
            <Route path="/backup" element={<Backup />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
