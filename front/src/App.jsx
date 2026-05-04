import './App.css'
import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Resultado from './Modals/Resultado';
import { useSnapshot } from 'valtio';
import state from './store';
import { useQueryLogin } from './hooks/ReactQuery/useQueryLogin';

function App() {
  const { isLoading } = useQueryLogin();
  const snap = useSnapshot(state);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !snap.logged) {
      navigate("/login")
    }
  }, [isLoading, snap.logged, navigate])

  if (isLoading) return null
  if (!snap.logged) return null

  return (
    <div className="app-container">
      <Resultado />
      <Sidebar />
      <div className="main-container">
        <Header />
        <Outlet />
      </div>
    </div>
  );
}

export default App
