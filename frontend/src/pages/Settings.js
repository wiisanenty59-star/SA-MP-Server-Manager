import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Save, Server } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Settings({ serverConfig, setServerConfig }) {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [rconPassword, setRconPassword] = useState('');

  useEffect(() => {
    if (serverConfig) {
      setHost(serverConfig.host || '127.0.0.1');
      setPort(serverConfig.port?.toString() || '7777');
      setRconPassword(serverConfig.rcon_password || '');
    }
  }, [serverConfig]);

  const handleSave = async () => {
    const newConfig = {
      host,
      port: parseInt(port),
      rcon_password: rconPassword
    };

    try {
      // Test connection first
      const testResponse = await axios.post(`${BACKEND_URL}/api/server/status`, newConfig);
      
      if (!testResponse.data.online) {
        toast.error('Cannot connect to server with these settings');
        return;
      }

      // Save to backend
      await axios.post(`${BACKEND_URL}/api/server/config`, newConfig);
      
      // Update local config
      setServerConfig(newConfig);
      localStorage.setItem('samp_server_config', JSON.stringify(newConfig));
      
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div data-testid="settings-container">
      <div className="mb-6">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-50 mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
          Settings
        </h1>
        <p className="text-sm text-zinc-400">Configure your server connection</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Server className="w-5 h-5 text-amber-500" />
            <h3 className="text-xl font-bold text-zinc-50" style={{ fontFamily: 'Chivo, sans-serif' }}>
              Server Configuration
            </h3>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="settingsHost" className="text-zinc-300 text-xs font-bold uppercase tracking-wider">
                Server Host
              </Label>
              <Input
                id="settingsHost"
                data-testid="settings-host-input"
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="127.0.0.1"
                className="mt-1.5 bg-zinc-950 border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-zinc-50 rounded-sm"
              />
            </div>

            <div>
              <Label htmlFor="settingsPort" className="text-zinc-300 text-xs font-bold uppercase tracking-wider">
                Server Port
              </Label>
              <Input
                id="settingsPort"
                data-testid="settings-port-input"
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="7777"
                className="mt-1.5 bg-zinc-950 border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-zinc-50 rounded-sm"
              />
            </div>

            <div>
              <Label htmlFor="settingsRconPassword" className="text-zinc-300 text-xs font-bold uppercase tracking-wider">
                RCON Password
              </Label>
              <Input
                id="settingsRconPassword"
                data-testid="settings-password-input"
                type="password"
                value={rconPassword}
                onChange={(e) => setRconPassword(e.target.value)}
                placeholder="Enter RCON password"
                className="mt-1.5 bg-zinc-950 border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-zinc-50 rounded-sm"
              />
            </div>

            <Button
              onClick={handleSave}
              data-testid="save-settings-button"
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase text-xs tracking-wider py-3 rounded-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">
              <strong className="text-amber-500">Note:</strong> Changing these settings will test the connection before saving. 
              Make sure your RCON password matches the one in server.cfg.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
