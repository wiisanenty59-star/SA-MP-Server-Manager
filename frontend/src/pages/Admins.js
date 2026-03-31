import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Shield, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Admins() {
  const [admins, setAdmins] = useState([]);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminLevel, setNewAdminLevel] = useState('1');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admins`);
      setAdmins(response.data.admins || []);
    } catch (error) {
      toast.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminName.trim()) {
      toast.error('Admin name is required');
      return;
    }

    try {
      await axios.post(`${BACKEND_URL}/api/admins`, {
        name: newAdminName.trim(),
        level: parseInt(newAdminLevel)
      });
      
      toast.success(`Admin ${newAdminName} added successfully`);
      setNewAdminName('');
      setNewAdminLevel('1');
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add admin');
    }
  };

  const handleRemoveAdmin = async (name) => {
    if (!window.confirm(`Remove admin ${name}?`)) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/admins/${encodeURIComponent(name)}`);
      toast.success(`Admin ${name} removed`);
      fetchAdmins();
    } catch (error) {
      toast.error('Failed to remove admin');
    }
  };

  const getLevelBadge = (level) => {
    const badges = {
      1: { label: 'Moderator', class: 'badge-info' },
      2: { label: 'Admin', class: 'badge-warning' },
      3: { label: 'Super Admin', class: 'badge-danger' },
      4: { label: 'Head Admin', class: 'badge-danger' },
      5: { label: 'Owner', class: 'badge-success' }
    };
    const badge = badges[level] || badges[1];
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  return (
    <div data-testid="admins-container">
      <div className="mb-6">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-50 mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
          Admin Management
        </h1>
        <p className="text-sm text-zinc-400">Add, remove, and manage server administrators</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-sm">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-50" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Current Admins ({admins.length})
              </h3>
              <Button
                onClick={fetchAdmins}
                data-testid="refresh-admins-button"
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
                    <th>NAME</th>
                    <th>LEVEL</th>
                    <th>ADDED</th>
                    <th className="text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-zinc-500">
                        No admins added yet
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin, index) => (
                      <tr key={index} data-testid={`admin-row-${index}`}>
                        <td className="font-medium text-zinc-50">{admin.name}</td>
                        <td>{getLevelBadge(admin.level)}</td>
                        <td className="text-xs font-mono text-zinc-500">
                          {admin.added_at ? new Date(admin.added_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="text-right">
                          <Button
                            onClick={() => handleRemoveAdmin(admin.name)}
                            data-testid={`remove-admin-button-${index}`}
                            size="sm"
                            className="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900 rounded-sm text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-amber-500" />
              <h3 className="text-xl font-bold text-zinc-50" style={{ fontFamily: 'Chivo, sans-serif' }}>
                Add Admin
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="adminName" className="text-zinc-300 text-xs font-bold uppercase tracking-wider">
                  Admin Name
                </Label>
                <Input
                  id="adminName"
                  data-testid="add-admin-name-input"
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Enter player name"
                  className="mt-1.5 bg-zinc-950 border-zinc-800 focus:border-amber-500 text-zinc-50 rounded-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="adminLevel" className="text-zinc-300 text-xs font-bold uppercase tracking-wider">
                  Admin Level
                </Label>
                <Select value={newAdminLevel} onValueChange={setNewAdminLevel}>
                  <SelectTrigger data-testid="add-admin-level-select" className="mt-1.5 bg-zinc-950 border-zinc-800 text-zinc-50 rounded-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-50">
                    <SelectItem value="1">1 - Moderator</SelectItem>
                    <SelectItem value="2">2 - Admin</SelectItem>
                    <SelectItem value="3">3 - Super Admin</SelectItem>
                    <SelectItem value="4">4 - Head Admin</SelectItem>
                    <SelectItem value="5">5 - Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleAddAdmin}
                data-testid="add-admin-button"
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase text-xs rounded-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Admin
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-800">
              <p className="text-xs text-zinc-500">
                <strong className="text-amber-500">Note:</strong> Admins are stored in the database. You may need to sync with your gamemode's admin list.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admins;
