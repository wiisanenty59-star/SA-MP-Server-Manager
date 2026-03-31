import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Server, Lock, Wifi } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Login({ onLogin }) {
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState('7777');
  const [rconPassword, setRconPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (e) => {
    e.preventDefault();
    
    if (!host || !port || !rconPassword) {
      toast.error('All fields are required');
      return;
    }

    setIsConnecting(true);

    try {
      const config = {
        host,
        port: parseInt(port),
        rcon_password: rconPassword
      };

      // Test connection
      const response = await axios.post(`${BACKEND_URL}/api/server/status`, config);
      
      if (response.data.online) {
        toast.success(`Connected to ${response.data.hostname}`);
        onLogin(config);
      } else {
        toast.error('Server offline or invalid credentials');
      }
    } catch (error) {
      toast.error('Connection failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center bg-zinc-950"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1669938318791-0e92af592f13?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwyfHxsb3MlMjBhbmdlbGVzJTIwZ2FuZyUyMHN0cmVldCUyMHVyYmFuJTIwc3Vuc2V0JTIwZ3RhfGVufDB8fHx8MTc3NDgyMTE2N3ww&ixlib=rb-4.1.0&q=85)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/85 to-zinc-950/95" />
      
      {/* Server Banner */}
      <div className="relative z-10 mb-8 text-center">
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 mb-2" 
            style={{ fontFamily: 'Chivo, sans-serif', textShadow: '0 0 30px rgba(251, 146, 60, 0.5)' }}>
          BOYZINTHEHOOD
        </h1>
        <h2 className="text-3xl font-bold text-zinc-200 mb-1" style={{ fontFamily: 'Chivo, sans-serif' }}>
          ROLEPLAY
        </h2>
        <p className="text-sm text-amber-500 font-semibold tracking-wider">
          Created by <span className="text-zinc-50">TeeWhy</span>
        </p>
      </div>
      
      <div className="relative z-10 w-full max-w-md p-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-8" data-testid="login-container">
          <div className="flex items-center justify-center mb-8">
            <Server className="w-12 h-12 text-amber-500" />
          </div>
          
          <h1 className="text-4xl font-black text-zinc-50 text-center mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
            BoyzInTheHood RP
          </h1>
          <p className="text-sm text-zinc-400 text-center mb-8">Admin Control Panel - Created by TeeWhy</p>
          
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <Label htmlFor="host" className="text-zinc-300 text-xs font-bold uppercase tracking-wider">
                Server Host
              </Label>
              <div className="relative mt-1.5">
                <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <Input
                  id="host"
                  data-testid="login-host-input"
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="127.0.0.1"
                  className="pl-10 bg-zinc-950 border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-zinc-50 rounded-sm"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="port" className="text-zinc-300 text-xs font-bold uppercase tracking-wider">
                Server Port
              </Label>
              <Input
                id="port"
                data-testid="login-port-input"
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="7777"
                className="mt-1.5 bg-zinc-950 border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-zinc-50 rounded-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="rconPassword" className="text-zinc-300 text-xs font-bold uppercase tracking-wider">
                RCON Password
              </Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <Input
                  id="rconPassword"
                  data-testid="login-password-input"
                  type="password"
                  value={rconPassword}
                  onChange={(e) => setRconPassword(e.target.value)}
                  placeholder="Enter RCON password"
                  className="pl-10 bg-zinc-950 border-zinc-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-zinc-50 rounded-sm"
                />
              </div>
            </div>
            
            <Button
              type="submit"
              data-testid="login-connect-button"
              disabled={isConnecting}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase text-xs tracking-wider py-3 rounded-sm transition-all"
            >
              {isConnecting ? 'Connecting...' : 'Connect to Server'}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 text-center">
              Default RCON port: 7777 • Check your server.cfg
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
