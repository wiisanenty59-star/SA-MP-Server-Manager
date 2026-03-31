import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Swords, Plus, Edit, Trash2, Users, Target, Crown, Save, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Gangs() {
  const [gangs, setGangs] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGang, setSelectedGang] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [formData, setFormData] = useState({ gang_id: 0, name: '', tag: '', color: '#FF6D00', description: '', leader: '' });
  const [newMemberName, setNewMemberName] = useState('');

  useEffect(() => { fetchGangs(); }, []);

  const fetchGangs = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/gangs`);
      setGangs(res.data.gangs || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchMembers = async (gangId) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/gang-members?gang_id=${gangId}`);
      setMembers(res.data.members || []);
    } catch (err) { console.error(err); }
  };

  const openCreate = () => {
    const nextId = gangs.length > 0 ? Math.max(...gangs.map(g => g.gang_id)) + 1 : 1;
    setFormData({ gang_id: nextId, name: '', tag: '', color: '#FF6D00', description: '', leader: '' });
    setIsCreateOpen(true);
  };

  const openEdit = (gang) => {
    setFormData({ gang_id: gang.gang_id, name: gang.name, tag: gang.tag, color: gang.color, description: gang.description || '', leader: gang.leader || '' });
    setSelectedGang(gang);
    setIsEditOpen(true);
  };

  const openMembers = (gang) => {
    setSelectedGang(gang);
    fetchMembers(gang.gang_id);
    setIsMembersOpen(true);
    setNewMemberName('');
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.tag) { toast.error('Name and tag are required'); return; }
    try {
      await axios.post(`${BACKEND_URL}/api/gangs`, { ...formData, total_kills: 0, total_deaths: 0, total_respect: 0, members: 0, territories_owned: 0 });
      toast.success(`Gang "${formData.name}" created`);
      setIsCreateOpen(false);
      fetchGangs();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to create gang'); }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${BACKEND_URL}/api/gangs/${formData.gang_id}`, { name: formData.name, tag: formData.tag, color: formData.color, description: formData.description, leader: formData.leader });
      toast.success('Gang updated');
      setIsEditOpen(false);
      fetchGangs();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to update'); }
  };

  const handleDelete = async (gangId, gangName) => {
    if (!window.confirm(`Delete "${gangName}"? All members will be unassigned.`)) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/gangs/${gangId}`);
      toast.success(`Gang "${gangName}" deleted`);
      fetchGangs();
    } catch (err) { toast.error('Failed to delete gang'); }
  };

  const addMember = async () => {
    if (!newMemberName.trim()) return;
    try {
      await axios.post(`${BACKEND_URL}/api/gang-members/assign`, { player_name: newMemberName.trim(), gang_id: selectedGang.gang_id });
      toast.success(`${newMemberName} added to ${selectedGang.name}`);
      setNewMemberName('');
      fetchMembers(selectedGang.gang_id);
      fetchGangs();
    } catch (err) { toast.error('Failed to add member'); }
  };

  const removeMember = async (playerName) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/gang-members/${playerName}`);
      toast.success(`${playerName} removed`);
      fetchMembers(selectedGang.gang_id);
      fetchGangs();
    } catch (err) { toast.error('Failed to remove member'); }
  };

  if (loading) return <div className="text-zinc-400 font-mono">Loading gangs...</div>;

  return (
    <div data-testid="gangs-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-50 mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>Gang Management</h1>
          <p className="text-sm text-zinc-400">Create, edit, and manage gangs</p>
        </div>
        <Button onClick={openCreate} data-testid="create-gang-button" className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase text-xs rounded-sm">
          <Plus className="w-4 h-4 mr-2" /> Create Gang
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {gangs.map((gang) => (
          <div key={gang.gang_id} data-testid={`gang-card-${gang.gang_id}`}
            className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden hover:border-zinc-700 transition-colors"
            style={{ borderLeftWidth: '4px', borderLeftColor: gang.color }}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm flex items-center justify-center text-sm font-black" style={{ backgroundColor: gang.color + '22', color: gang.color, border: `1px solid ${gang.color}44` }}>
                    {gang.tag}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-zinc-50" style={{ fontFamily: 'Chivo, sans-serif' }}>{gang.name}</h3>
                    {gang.leader && <p className="text-xs text-zinc-500">Leader: <span className="text-zinc-300">{gang.leader}</span></p>}
                  </div>
                </div>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: gang.color, boxShadow: `0 0 10px ${gang.color}66` }} />
              </div>

              {gang.description && <p className="text-xs text-zinc-500 mb-4 italic">"{gang.description}"</p>}

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-zinc-950 rounded-sm p-2 text-center">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Members</div>
                  <div className="text-lg font-bold font-mono text-zinc-50">{gang.members || 0}</div>
                </div>
                <div className="bg-zinc-950 rounded-sm p-2 text-center">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Kills</div>
                  <div className="text-lg font-bold font-mono text-green-500">{gang.total_kills || 0}</div>
                </div>
                <div className="bg-zinc-950 rounded-sm p-2 text-center">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Turf</div>
                  <div className="text-lg font-bold font-mono text-amber-500">{gang.territories_owned || 0}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => openMembers(gang)} size="sm" data-testid={`gang-members-btn-${gang.gang_id}`}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-sm text-xs">
                  <Users className="w-3 h-3 mr-1" /> Members
                </Button>
                <Button onClick={() => openEdit(gang)} size="sm" data-testid={`gang-edit-btn-${gang.gang_id}`}
                  className="bg-amber-900/20 hover:bg-amber-900/40 text-amber-500 border border-amber-900 rounded-sm text-xs">
                  <Edit className="w-3 h-3" />
                </Button>
                <Button onClick={() => handleDelete(gang.gang_id, gang.name)} size="sm" data-testid={`gang-delete-btn-${gang.gang_id}`}
                  className="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900 rounded-sm text-xs">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Gang Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 max-w-md">
          <DialogHeader><DialogTitle className="text-zinc-50 font-black" style={{ fontFamily: 'Chivo, sans-serif' }}>Create New Gang</DialogTitle></DialogHeader>
          <GangForm formData={formData} setFormData={setFormData} onSubmit={handleCreate} submitLabel="Create Gang" />
        </DialogContent>
      </Dialog>

      {/* Edit Gang Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 max-w-md">
          <DialogHeader><DialogTitle className="text-zinc-50 font-black" style={{ fontFamily: 'Chivo, sans-serif' }}>Edit Gang</DialogTitle></DialogHeader>
          <GangForm formData={formData} setFormData={setFormData} onSubmit={handleUpdate} submitLabel="Save Changes" hideId />
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-zinc-50 font-black flex items-center gap-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedGang?.color }} />
              {selectedGang?.name} - Members
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Player name..." data-testid="add-member-input"
                className="bg-zinc-950 border-zinc-800 text-zinc-50 rounded-sm" onKeyDown={(e) => e.key === 'Enter' && addMember()} />
              <Button onClick={addMember} data-testid="add-member-button" className="bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-sm text-xs font-bold">Add</Button>
            </div>
            <div className="max-h-60 overflow-y-auto scrollbar-thin space-y-1">
              {members.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-4">No members in this gang</p>
              ) : members.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-zinc-950 rounded-sm">
                  <div>
                    <span className="text-sm text-zinc-50 font-medium">{m.player_name}</span>
                    <span className="text-xs text-zinc-500 ml-2">K:{m.kills || 0} D:{m.deaths || 0} R:{m.respect || 0}</span>
                  </div>
                  <Button onClick={() => removeMember(m.player_name)} size="sm" className="bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-sm text-xs h-7 px-2">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GangForm({ formData, setFormData, onSubmit, submitLabel, hideId }) {
  return (
    <div className="space-y-4">
      {!hideId && (
        <div>
          <Label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Gang ID</Label>
          <Input type="number" value={formData.gang_id} onChange={(e) => setFormData({ ...formData, gang_id: parseInt(e.target.value) })}
            data-testid="gang-id-input" className="mt-1.5 bg-zinc-950 border-zinc-800 text-zinc-50 rounded-sm" />
        </div>
      )}
      <div>
        <Label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Gang Name</Label>
        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          data-testid="gang-name-input" placeholder="Kill 2 Survive" className="mt-1.5 bg-zinc-950 border-zinc-800 text-zinc-50 rounded-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Tag</Label>
          <Input value={formData.tag} onChange={(e) => setFormData({ ...formData, tag: e.target.value.toUpperCase().slice(0, 5) })}
            data-testid="gang-tag-input" placeholder="K2S" maxLength={5} className="mt-1.5 bg-zinc-950 border-zinc-800 text-zinc-50 rounded-sm" />
        </div>
        <div>
          <Label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Color</Label>
          <div className="flex items-center gap-2 mt-1.5">
            <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              data-testid="gang-color-input" className="w-10 h-10 rounded-sm cursor-pointer border border-zinc-700 bg-transparent" />
            <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="bg-zinc-950 border-zinc-800 text-zinc-50 rounded-sm font-mono text-sm" />
          </div>
        </div>
      </div>
      <div>
        <Label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Leader</Label>
        <Input value={formData.leader} onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
          data-testid="gang-leader-input" placeholder="TeeWhy" className="mt-1.5 bg-zinc-950 border-zinc-800 text-zinc-50 rounded-sm" />
      </div>
      <div>
        <Label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">Description</Label>
        <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          data-testid="gang-desc-input" placeholder="The most ruthless gang..." className="mt-1.5 bg-zinc-950 border-zinc-800 text-zinc-50 rounded-sm" />
      </div>
      <Button onClick={onSubmit} data-testid="gang-submit-button" className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase text-xs rounded-sm py-3">
        <Save className="w-4 h-4 mr-2" /> {submitLabel}
      </Button>
    </div>
  );
}

export default Gangs;
