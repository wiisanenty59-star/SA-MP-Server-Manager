import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Users, Server as ServerIcon, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Dashboard({ serverConfig }) {
  const [serverStatus, setServerStatus] = useState(null);
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statusRes, playersRes, statsRes] = await Promise.all([
        axios.post(`${BACKEND_URL}/api/server/status`, serverConfig),
        axios.post(`${BACKEND_URL}/api/server/players`, serverConfig),
        axios.get(`${BACKEND_URL}/api/stats`)
      ]);
      
      setServerStatus(statusRes.data);
      setPlayers(playersRes.data.players || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-zinc-400 font-mono">Loading...</div>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-container">
      <div className="mb-6">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-50 mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
          Dashboard
        </h1>
        <p className="text-sm text-zinc-400">Real-time server monitoring and statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card" data-testid="server-status-card">
          <div className="flex items-center justify-between mb-3">
            <ServerIcon className="w-5 h-5 text-amber-500" />
            <div className={`status-dot ${serverStatus?.online ? 'status-online' : 'status-offline'}`} />
          </div>
          <div className="metric-label">SERVER STATUS</div>
          <div className="text-lg font-bold text-zinc-50 mt-1">
            {serverStatus?.online ? 'Online' : 'Offline'}
          </div>
        </div>

        <div className="stat-card" data-testid="players-online-card">
          <Users className="w-5 h-5 text-green-500 mb-3" />
          <div className="metric-label">PLAYERS ONLINE</div>
          <div className="metric-number">
            {serverStatus?.players || 0}
            <span className="text-lg text-zinc-500"> / {serverStatus?.max_players || 0}</span>
          </div>
        </div>

        <div className="stat-card" data-testid="total-admins-card">
          <Activity className="w-5 h-5 text-amber-500 mb-3" />
          <div className="metric-label">TOTAL ADMINS</div>
          <div className="metric-number">{stats?.total_admins || 0}</div>
        </div>

        <div className="stat-card" data-testid="activity-logs-card">
          <TrendingUp className="w-5 h-5 text-blue-500 mb-3" />
          <div className="metric-label">ACTIVITY LOGS</div>
          <div className="metric-number">{stats?.total_logs || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-5">
          <h3 className="text-xl font-bold text-zinc-50 mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Server Information
          </h3>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Hostname:</span>
              <span className="text-zinc-50">{serverStatus?.hostname || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Gamemode:</span>
              <span className="text-zinc-50">{serverStatus?.gamemode || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Password:</span>
              <span className="text-zinc-50">{serverStatus?.password_protected ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Address:</span>
              <span className="text-zinc-50">{serverConfig.host}:{serverConfig.port}</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-5">
          <h3 className="text-xl font-bold text-zinc-50 mb-4" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Recent Players ({players.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
            {players.length === 0 ? (
              <p className="text-zinc-500 text-sm">No players online</p>
            ) : (
              players.slice(0, 5).map((player) => (
                <div key={player.id} className="flex items-center justify-between p-2 bg-zinc-950 rounded-sm">
                  <div>
                    <div className="text-sm font-medium text-zinc-50">{player.name}</div>
                    <div className="text-xs text-zinc-500">ID: {player.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-400">Score: {player.score}</div>
                    <div className="text-xs text-zinc-500">Ping: {player.ping}ms</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
