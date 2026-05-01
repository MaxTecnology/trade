import './App.css'
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Resultado from './Modals/Resultado';
import { useSnapshot } from 'valtio';
import state from './store';
import { useQueryLogin } from './hooks/ReactQuery/useQueryLogin';

function App() {
  const { data, isLoading } = useQueryLogin();
  const snap = useSnapshot(state);

  const navigate = useNavigate();

  if (isLoading) {
    return null
  }
  if (!snap.logged) {
    return navigate("/login")
  }


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
