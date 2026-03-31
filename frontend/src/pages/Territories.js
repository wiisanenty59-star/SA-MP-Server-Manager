import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Map, Edit, Save, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Territories() {
  const [territories, setTerritories] = useState([]);
  const [gangs, setGangs] = useState([]);
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTerritories();
    fetchGangs();
  }, []);

  const fetchTerritories = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/territories`);
      setTerritories(response.data.territories || []);
    } catch (error) {
      toast.error('Failed to fetch territories');
    } finally {
      setLoading(false);
    }
  };

  const fetchGangs = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/gangs`);
      setGangs(res.data.gangs || []);
    } catch (err) { console.error(err); }
  };

  const handleSelectTerritory = (territory) => {
    setSelectedTerritory(territory);
    setEditData({
      name: territory.name,
      owner_gang_id: territory.owner_gang_id,
      income: territory.income,
      level: territory.level
    });
  };

  const handleUpdateTerritory = async () => {
    if (!selectedTerritory) return;
    try {
      await axios.put(`${BACKEND_URL}/api/territories/${selectedTerritory.id}`, {
        id: selectedTerritory.id,
        ...editData
      });
      toast.success(`Territory ${editData.name} updated`);
      fetchTerritories();
      setSelectedTerritory(null);
    } catch (error) {
      toast.error('Failed to update territory');
    }
  };

  const getGangInfo = (gangId) => {
    if (gangId === -1) return { name: 'Unclaimed', color: '#71717a' };
    const gang = gangs.find(g => g.gang_id === gangId);
    return gang ? { name: gang.name, color: gang.color } : { name: `Gang #${gangId}`, color: '#71717a' };
  };

  return (
    <div data-testid="territories-container">
      <div className="mb-6">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-50 mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
          Territory Management
        </h1>
        <p className="text-sm text-zinc-400">Manage gang territories and income</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-sm">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-50" style={{ fontFamily: 'Chivo, sans-serif' }}>
                All Territories ({territories.length})
              </h3>
              <Button
                onClick={fetchTerritories}
                data-testid="refresh-territories-button"
                size="sm"
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-50 rounded-sm text-xs"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
            <div className="overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>NAME</th>
                    <th>OWNER</th>
                    <th>INCOME</th>
                    <th>LEVEL</th>
                    <th className="text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {territories.map((territory) => (
                    <tr key={territory.id} data-testid={`territory-row-${territory.id}`}>
                      <td className="font-mono font-bold text-amber-500">{territory.id}</td>
                      <td className="font-medium text-zinc-50">{territory.name}</td>
                      <td className={`font-medium ${getOwnerColor(territory.owner_gang_id)}`}>
                        {getOwnerName(territory.owner_gang_id)}
                      </td>
                      <td className="font-mono text-green-500">${territory.income}</td>
                      <td className="font-mono">{territory.level}</td>
                      <td className="text-right">
                        <Button
                          onClick={() => handleSelectTerritory(territory)}
                          data-testid={`edit-territory-button-${territory.id}`}
                          size="sm"
                          className="bg-amber-900/20 hover:bg-amber-900/40 text-amber-500 border border-amber-900 rounded-sm text-xs"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Map className="w-5 h-5 text-amber-500" />
              <h3 className="text-xl font-bold text-zinc-50" style={{ fontFamily: 'Chivo, sans-serif' }}>
                {selectedTerritory ? 'Edit Territory' : 'Select Territory'}
              </h3>
            </div>
            
            {selectedTerritory ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">
                    Territory Name
                  </Label>
                  <Input
                    data-testid="territory-name-input"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="mt-1.5 bg-zinc-950 border-zinc-800 text-zinc-50 rounded-sm"
                  />
                </div>
                
                <div>
                  <Label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">
                    Owner Gang ID (-1 = unclaimed)
                  </Label>
                  <Input
                    type="number"
                    data-testid="territory-owner-input"
                    value={editData.owner_gang_id || -1}
                    onChange={(e) => setEditData({ ...editData, owner_gang_id: parseInt(e.target.value) })}
                    className="mt-1.5 bg-zinc-950 border-zinc-800 text-zinc-50 rounded-sm"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    1=Crips, 2=Bloods, 3=Grove, 4=Ballas, 5=Vagos, 6=Aztecas
                  </p>
                </div>
                
                <div>
                  <Label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">
                    Income per Cycle
                  </Label>
                  <Input
                    type="number"
                    data-testid="territory-income-input"
                    value={editData.income || 0}
                    onChange={(e) => setEditData({ ...editData, income: parseInt(e.target.value) })}
                    className="mt-1.5 bg-zinc-950 border-zinc-800 text-zinc-50 rounded-sm"
                  />
                </div>
                
                <div>
                  <Label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">
                    Territory Level (0-5)
                  </Label>
                  <Input
                    type="number"
                    data-testid="territory-level-input"
                    value={editData.level || 0}
                    onChange={(e) => setEditData({ ...editData, level: parseInt(e.target.value) })}
                    min="0"
                    max="5"
                    className="mt-1.5 bg-zinc-950 border-zinc-800 text-zinc-50 rounded-sm"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateTerritory}
                    data-testid="save-territory-button"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase text-xs rounded-sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={() => setSelectedTerritory(null)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-50 rounded-sm text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-zinc-500 text-sm text-center py-8">
                Select a territory from the list to edit
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Territories;
