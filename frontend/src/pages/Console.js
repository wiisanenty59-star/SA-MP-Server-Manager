import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Terminal, Send, Trash } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Console({ serverConfig }) {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleSendCommand = async (e) => {
    e.preventDefault();
    
    if (!command.trim()) return;

    const currentCommand = command.trim();
    setHistory(prev => [...prev, { type: 'command', text: currentCommand }]);
    setCommandHistory(prev => [...prev, currentCommand]);
    setHistoryIndex(-1);
    setCommand('');

    try {
      const response = await axios.post(`${BACKEND_URL}/api/server/rcon`, {
        host: serverConfig.host,
        port: serverConfig.port,
        password: serverConfig.rcon_password,
        command: currentCommand
      });

      if (response.data.success) {
        setHistory(prev => [...prev, {
          type: 'response',
          text: response.data.result || 'Command executed successfully'
        }]);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message;
      setHistory(prev => [...prev, { type: 'error', text: `Error: ${errorMsg}` }]);
      toast.error('Command failed');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const clearConsole = () => {
    setHistory([]);
  };

  return (
    <div data-testid="console-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-50 mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
            RCON Console
          </h1>
          <p className="text-sm text-zinc-400">Send commands directly to the server</p>
        </div>
        <Button
          onClick={clearConsole}
          data-testid="clear-console-button"
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-50 rounded-sm font-bold uppercase text-xs"
        >
          <Trash className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-5 h-5 text-green-500" />
          <h3 className="text-xl font-bold text-zinc-50" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Terminal
          </h3>
        </div>

        <div 
          ref={terminalRef}
          className="terminal scrollbar-thin"
          data-testid="terminal-output"
        >
          {history.length === 0 ? (
            <div className="terminal-line text-zinc-600">
              SAMP RCON Console v1.0
              <br />
              Connected to {serverConfig.host}:{serverConfig.port}
              <br />
              Type commands and press Enter...
            </div>
          ) : (
            history.map((entry, index) => (
              <div
                key={index}
                className="terminal-line"
                style={{
                  color: entry.type === 'command' ? '#fbbf24' :
                         entry.type === 'error' ? '#ef4444' : '#22c55e'
                }}
              >
                {entry.type === 'command' && '> '}
                {entry.text}
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSendCommand} className="mt-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 font-mono font-bold">
                &gt;
              </span>
              <Input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                data-testid="console-command-input"
                placeholder="Enter RCON command..."
                className="pl-8 bg-black border-zinc-800 text-green-400 font-mono focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-sm"
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              data-testid="send-command-button"
              className="bg-green-900/20 hover:bg-green-900/40 text-green-500 border border-green-900 rounded-sm font-bold uppercase text-xs px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-zinc-950 border border-zinc-800 rounded-sm">
          <p className="text-xs text-zinc-500 font-mono">
            <strong className="text-amber-500">Common commands:</strong> akick [id], aban [id], givemoney [id] [amount], 
            setlevel [id] [level], makeadmin [id] [level], gmx (restart)
          </p>
        </div>
      </div>
    </div>
  );
}

export default Console;
