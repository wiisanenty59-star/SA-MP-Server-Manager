import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Users, Ban, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Players({ serverConfig }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [actionValue, setActionValue] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/server/players`, serverConfig);
      setPlayers(response.data.players || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (player, action, value = null) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/server/player-action`,
        {
          player_id: player.id,
          player_name: player.name,
          action: action,
          value: value
        },
        {
          headers: { 'Content-Type': 'application/json' },
          params: serverConfig
        }
      );

      if (response.data.success) {
        toast.success(`Action ${action} executed on ${player.name}`);
        setIsDialogOpen(false);
        setActionValue('');
        fetchPlayers();
      }
    } catch (error) {
      toast.error('Action failed: ' + (error.response?.data?.detail || error.message));
    }
  };

  const openActionDialog = (player, type) => {
    setSelectedPlayer(player);
    setActionType(type);
    setIsDialogOpen(true);
  };

  const executeDialogAction = () => {
    if (actionType === 'givemoney' || actionType === 'setlevel') {
      if (!actionValue || isNaN(actionValue)) {
        toast.error('Please enter a valid number');
        return;
      }
      handleAction(selectedPlayer, actionType, parseInt(actionValue));
    }
  };

  if (loading) {
    return <div className="text-zinc-400 font-mono">Loading players...</div>;
  }

  return (
    <div data-testid="players-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-50 mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Player Management
          </h1>
          <p className="text-sm text-zinc-400">Manage online players in real-time</p>
        </div>
        <Button
          onClick={fetchPlayers}
          data-testid="refresh-players-button"
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-50 border border-zinc-700 rounded-sm font-bold uppercase text-xs"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>NAME</th>
              <th>SCORE</th>
              <th>PING</th>
              <th className="text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-zinc-500">
                  No players online
                </td>
              </tr>
            ) : (
              players.map((player) => (
                <tr key={player.id} data-testid={`player-row-${player.id}`}>
                  <td className="font-mono font-bold text-amber-500">{player.id}</td>
                  <td className="font-medium text-zinc-50">{player.name}</td>
                  <td className="font-mono">{player.score}</td>
                  <td className="font-mono">
                    <span className={player.ping > 150 ? 'text-red-500' : player.ping > 80 ? 'text-amber-500' : 'text-green-500'}>
                      {player.ping}ms
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => openActionDialog(player, 'givemoney')}
                        data-testid={`givemoney-button-${player.id}`}
                        size="sm"
                        className="bg-green-900/20 hover:bg-green-900/40 text-green-500 border border-green-900 rounded-sm text-xs"
                      >
                        <DollarSign className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => openActionDialog(player, 'setlevel')}
                        data-testid={`setlevel-button-${player.id}`}
                        size="sm"
                        className="bg-blue-900/20 hover:bg-blue-900/40 text-blue-500 border border-blue-900 rounded-sm text-xs"
                      >
                        <TrendingUp className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => handleAction(player, 'kick')}
                        data-testid={`kick-button-${player.id}`}
                        size="sm"
                        className="bg-amber-900/20 hover:bg-amber-900/40 text-amber-500 border border-amber-900 rounded-sm text-xs"
                      >
                        Kick
                      </Button>
                      <Button
                        onClick={() => handleAction(player, 'ban')}
                        data-testid={`ban-button-${player.id}`}
                        size="sm"
                        className="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900 rounded-sm text-xs"
                      >
                        <Ban className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50">
          <DialogHeader>
            <DialogTitle className="text-zinc-50">
              {actionType === 'givemoney' ? 'Give Money' : 'Set Level'} - {selectedPlayer?.name}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {actionType === 'givemoney' ? 'Enter amount to give' : 'Enter new level (1-5)'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-300">
                {actionType === 'givemoney' ? 'Amount' : 'Level'}
              </Label>
              <Input
                type="number"
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
                data-testid="action-value-input"
                placeholder={actionType === 'givemoney' ? '1000' : '1'}
                className="mt-2 bg-zinc-950 border-zinc-800 text-zinc-50"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={executeDialogAction}
                data-testid="execute-action-button"
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-sm"
              >
                Execute
              </Button>
              <Button
                onClick={() => setIsDialogOpen(false)}
                variant="outline"
                className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-50 rounded-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Players;
