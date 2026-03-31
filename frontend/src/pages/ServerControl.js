import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Power, RotateCcw, Activity, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function ServerControl() {
  const [serverStatus, setServerStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/server/control`, {
        action: 'status'
      });
      setServerStatus(response.data);
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const handleServerAction = async (action) => {
    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/server/control`, {
        action: action
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        checkStatus();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Action failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setIsRefreshing(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/server/logs?lines=100`);
      setLogs(response.data.logs || 'No logs available');
    } catch (error) {
      toast.error('Failed to fetch logs');
      setLogs('Error loading logs');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const isRunning = serverStatus?.running || false;

  return (
    <div data-testid="server-control-container">
      <div className="mb-6">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-50 mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
          Server Control
        </h1>
        <p className="text-sm text-zinc-400">Start, stop, and monitor your SA-MP server</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-zinc-50" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Server Status
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className={`status-dot ${isRunning ? 'status-online' : 'status-offline'}`} />
            <span className={`text-lg font-bold ${isRunning ? 'text-green-500' : 'text-red-500'}`}>
              {isRunning ? 'RUNNING' : 'STOPPED'}
            </span>
          </div>
        </div>

        {serverStatus && (
          <div className="bg-zinc-950 p-4 rounded-sm mb-4">
            <p className="font-mono text-sm text-zinc-300">{serverStatus.status}</p>
          </div>
        )}

        <Alert className={`${isRunning ? 'bg-green-900/20 border-green-900' : 'bg-red-900/20 border-red-900'}`}>
          {isRunning ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription className={isRunning ? 'text-green-400' : 'text-red-400'}>
            {isRunning 
              ? 'SA-MP server is running. Players can connect.'
              : 'SA-MP server is stopped. Start it to allow connections.'}
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Button
          onClick={() => handleServerAction('start')}
          disabled={loading || isRunning}
          data-testid="start-server-button"
          className="bg-green-900/20 hover:bg-green-900/40 text-green-500 border border-green-900 rounded-sm font-bold uppercase text-sm py-6"
        >
          <Power className="w-5 h-5 mr-2" />
          Start Server
        </Button>

        <Button
          onClick={() => handleServerAction('restart')}
          disabled={loading || !isRunning}
          data-testid="restart-server-button"
          className="bg-amber-900/20 hover:bg-amber-900/40 text-amber-500 border border-amber-900 rounded-sm font-bold uppercase text-sm py-6"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Restart Server
        </Button>

        <Button
          onClick={() => handleServerAction('stop')}
          disabled={loading || !isRunning}
          data-testid="stop-server-button"
          className="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900 rounded-sm font-bold uppercase text-sm py-6"
        >
          <Power className="w-5 h-5 mr-2" />
          Stop Server
        </Button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-sm">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <h3 className="text-xl font-bold text-zinc-50" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Server Logs (Last 100 lines)
            </h3>
          </div>
          <Button
            onClick={fetchLogs}
            disabled={isRefreshing}
            size="sm"
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-50 rounded-sm text-xs"
          >
            <RotateCcw className={`w-3 h-3 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="p-4">
          <div className="terminal scrollbar-thin" style={{ height: '400px' }}>
            {logs.split('\n').map((line, index) => (
              <div key={index} className="terminal-line">
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-zinc-900 border border-zinc-800 rounded-sm">
        <h4 className="text-sm font-bold text-amber-500 mb-2">⚠️ Important Notes:</h4>
        <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
          <li>Restarting the server will disconnect all online players</li>
          <li>Server logs refresh automatically every 10 seconds</li>
          <li>Changes to server.cfg require a restart to take effect</li>
          <li>Use the RCON console for in-game commands without restart</li>
        </ul>
      </div>
    </div>
  );
}

export default ServerControl;
