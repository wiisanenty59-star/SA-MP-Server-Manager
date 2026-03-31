import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import Admins from './pages/Admins';
import Territories from './pages/Territories';
import Rankings from './pages/Rankings';
import Gangs from './pages/Gangs';
import GangRankings from './pages/GangRankings';
import Console from './pages/Console';
import Settings from './pages/Settings';
import ServerControl from './pages/ServerControl';
import Login from './pages/Login';
import Layout from './components/Layout';
import { Toaster } from './components/ui/sonner';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [serverConfig, setServerConfig] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const savedConfig = localStorage.getItem('samp_server_config');
    if (savedConfig) {
      setServerConfig(JSON.parse(savedConfig));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (config) => {
    setServerConfig(config);
    setIsAuthenticated(true);
    localStorage.setItem('samp_server_config', JSON.stringify(config));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setServerConfig(null);
    localStorage.removeItem('samp_server_config');
  };

  if (!isAuthenticated) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  return (
    <Router>
      <Layout onLogout={handleLogout} serverConfig={serverConfig}>
        <Routes>
          <Route path="/" element={<Dashboard serverConfig={serverConfig} />} />
          <Route path="/players" element={<Players serverConfig={serverConfig} />} />
          <Route path="/admins" element={<Admins />} />
          <Route path="/territories" element={<Territories />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/gangs" element={<Gangs />} />
          <Route path="/gang-rankings" element={<GangRankings />} />
          <Route path="/server-control" element={<ServerControl />} />
          <Route path="/console" element={<Console serverConfig={serverConfig} />} />
          <Route path="/settings" element={<Settings serverConfig={serverConfig} setServerConfig={setServerConfig} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <Toaster />
    </Router>
  );
}

export default App;
