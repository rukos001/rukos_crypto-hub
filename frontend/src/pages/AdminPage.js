import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  Users, MessageCircle, FileText, Lightbulb, Trash2, Shield, 
  Eye, EyeOff, BarChart3, RefreshCw, Wallet, Plus, Save, X, Pencil
} from 'lucide-react';
// watermarks removed

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// === Portfolio Editor Component ===
const PortfolioEditor = () => {
  const [usersList, setUsersList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [applyToAll, setApplyToAll] = useState(false);
  const [portfolio, setPortfolio] = useState(null);
  const [editGroup, setEditGroup] = useState(null);
  const [positions, setPositions] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${API}/admin/portfolios`).then(r => setUsersList(r.data)).catch(() => {});
  }, []);

  const loadPortfolio = async (userId) => {
    try {
      const res = await axios.get(`${API}/admin/portfolio/${userId}`);
      setPortfolio(res.data);
      setSelectedUser(userId);
      setEditGroup(null);
    } catch (err) {
      toast.error('Failed to load portfolio');
    }
  };

  const startEdit = (groupName) => {
    const group = portfolio?.groups?.[groupName];
    setEditGroup(groupName);
    setPositions(group?.positions?.map(p => ({ ...p })) || []);
  };

  const addPosition = () => {
    setPositions(prev => [...prev, { asset: '', size: 0, entry: 0, current: 0, notes: '' }]);
  };

  const updatePosition = (index, field, value) => {
    setPositions(prev => prev.map((p, i) => i === index ? { ...p, [field]: field === 'asset' || field === 'notes' ? value : parseFloat(value) || 0 } : p));
  };

  const removePosition = (index) => {
    setPositions(prev => prev.filter((_, i) => i !== index));
  };

  const saveGroup = async () => {
    if ((!selectedUser && !applyToAll) || !editGroup) return;
    setSaving(true);
    try {
      await axios.put(`${API}/admin/portfolio`, {
        user_id: applyToAll ? 'ALL' : selectedUser,
        group: editGroup,
        positions: positions.filter(p => p.asset.trim()),
        description: portfolio?.groups?.[editGroup]?.description || ''
      });
      if (applyToAll) {
        toast.success(`${editGroup} applied to ALL users`);
      } else {
        toast.success(`${editGroup} saved`);
        await loadPortfolio(selectedUser);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const GROUPS = ['HOLD', 'ALTs', 'HI_RISK'];
  const GROUP_COLORS = { HOLD: '#F7931A', ALTs: '#3B82F6', HI_RISK: '#EF4444' };
  const selectedUsername = usersList.find(u => u.user_id === selectedUser)?.username;

  return (
    <div className="space-y-4">
      {/* Apply to All Users Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[#F7931A]/10 border border-[#F7931A]/30">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-[#F7931A]" />
          <div>
            <p className="font-semibold text-sm">Apply to All Users</p>
            <p className="text-xs text-muted-foreground">Changes will be applied to every registered user</p>
          </div>
        </div>
        <button
          onClick={() => {
            setApplyToAll(!applyToAll);
            if (!applyToAll) {
              setSelectedUser(null);
              setPortfolio({ groups: { HOLD: { description: '', positions: [] }, ALTs: { description: '', positions: [] }, HI_RISK: { description: '', positions: [] } } });
              setEditGroup(null);
            } else {
              setPortfolio(null);
              setEditGroup(null);
            }
          }}
          className={`w-12 h-6 rounded-full transition-colors ${applyToAll ? 'bg-[#F7931A]' : 'bg-white/10'}`}
          data-testid="apply-to-all-toggle"
        >
          <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${applyToAll ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* User Selector (when not applying to all) */}
      {!applyToAll && !selectedUser ? (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Select User</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {usersList.map(u => (
                  <button
                    key={u.user_id}
                    onClick={() => loadPortfolio(u.user_id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
                    data-testid={`portfolio-select-${u.user_id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F7931A] to-[#FFD700] flex items-center justify-center font-bold text-black text-xs">
                        {u.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-sm">{u.username}</span>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs border-white/10">
                      {u.positions_count} pos
                    </Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Selected User or All Users Header */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#F7931A]" />
              <span className="font-semibold">
                {applyToAll ? (
                  <span className="text-[#F7931A]">ALL USERS ({usersList.length})</span>
                ) : selectedUsername}
              </span>
            </div>
            {!applyToAll && (
              <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(null); setPortfolio(null); setEditGroup(null); }} className="text-muted-foreground">
                <X className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
          </div>

          {/* Group Selector */}
          <div className="flex gap-2">
            {GROUPS.map(g => (
              <Button
                key={g}
                variant={editGroup === g ? 'default' : 'outline'}
                onClick={() => startEdit(g)}
                className={editGroup === g ? 'text-black' : 'border-white/10'}
                style={editGroup === g ? { backgroundColor: GROUP_COLORS[g] } : {}}
                data-testid={`admin-portfolio-group-${g}`}
              >
                {g === 'HI_RISK' ? 'HI RISK' : g}
                <Badge className="ml-2 text-xs" variant="secondary">
                  {portfolio?.groups?.[g]?.positions?.length || 0}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Position Editor */}
          {editGroup && (
            <Card className="glass-card" style={{ borderTop: `3px solid ${GROUP_COLORS[editGroup]}` }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base" style={{ color: GROUP_COLORS[editGroup] }}>
                    {editGroup === 'HI_RISK' ? 'HI RISK' : editGroup} Positions
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={addPosition} className="border-white/10" data-testid="add-position-btn">
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                    <Button size="sm" onClick={saveGroup} disabled={saving} style={{ backgroundColor: GROUP_COLORS[editGroup], color: 'black' }} data-testid="save-portfolio-btn">
                      <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {positions.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">No positions. Click "Add" to create one.</p>
                ) : (
                  <div className="space-y-3">
                    {positions.map((pos, i) => (
                      <div key={i} className="grid grid-cols-6 gap-2 items-center p-3 rounded-lg bg-secondary/20" data-testid={`edit-position-${i}`}>
                        <input
                          value={pos.asset}
                          onChange={e => updatePosition(i, 'asset', e.target.value)}
                          placeholder="Asset"
                          className="bg-secondary/50 rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-[#F7931A] outline-none"
                          data-testid={`pos-asset-${i}`}
                        />
                        <input
                          type="number"
                          value={pos.size || ''}
                          onChange={e => updatePosition(i, 'size', e.target.value)}
                          placeholder="Size"
                          className="bg-secondary/50 rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-[#F7931A] outline-none"
                          data-testid={`pos-size-${i}`}
                        />
                        <input
                          type="number"
                          value={pos.entry || ''}
                          onChange={e => updatePosition(i, 'entry', e.target.value)}
                          placeholder="Entry $"
                          className="bg-secondary/50 rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-[#F7931A] outline-none"
                          data-testid={`pos-entry-${i}`}
                        />
                        <input
                          type="number"
                          value={pos.current || ''}
                          onChange={e => updatePosition(i, 'current', e.target.value)}
                          placeholder="Current $"
                          className="bg-secondary/50 rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-[#F7931A] outline-none"
                          data-testid={`pos-current-${i}`}
                        />
                        <input
                          value={pos.notes}
                          onChange={e => updatePosition(i, 'notes', e.target.value)}
                          placeholder="Notes"
                          className="bg-secondary/50 rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-[#F7931A] outline-none"
                          data-testid={`pos-notes-${i}`}
                        />
                        <Button variant="ghost" size="sm" onClick={() => removePosition(i)} className="text-[#EF4444] hover:bg-[#EF4444]/10 justify-self-center" data-testid={`pos-delete-${i}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="text-xs text-muted-foreground pt-2">
                      Fields: Asset | Size | Entry Price | Current Price | Notes
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

// === Main Admin Page ===
export const AdminPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [showPasswords, setShowPasswords] = useState({});
  const [activeSection, setActiveSection] = useState('users');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes, chatRes] = await Promise.all([
        axios.get(`${API}/admin/users`),
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/chat-messages`)
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
      setChatMessages(chatRes.data);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Delete user "${username}" and all their content?`)) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`);
      toast.success(`User ${username} deleted`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`${API}/admin/chat-messages/${messageId}`);
      toast.success('Message deleted');
      setChatMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const togglePassword = (userId) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-[60vh]" data-testid="admin-access-denied">
        <div className="text-center">
          <Shield className="w-16 h-16 text-[#EF4444] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#EF4444]">Access Denied</h2>
          <p className="text-muted-foreground mt-2">Admin privileges required</p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'portfolio', icon: Wallet, label: 'Portfolio' },
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'stats', icon: BarChart3, label: 'Stats' },
  ];

  return (
    <div className="space-y-6 animate-fade-in relative" data-testid="admin-page">
      <RukosWatermark position="bottom-right" size={60} />
      <RukosWatermark position="top-right" size={35} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#F7931A]" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground text-sm">Platform management</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="border-white/10" data-testid="admin-refresh">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 flex-wrap">
        {sections.map(s => (
          <Button
            key={s.id}
            variant={activeSection === s.id ? 'default' : 'outline'}
            onClick={() => setActiveSection(s.id)}
            className={activeSection === s.id ? 'bg-[#F7931A] text-black' : 'border-white/10'}
            data-testid={`admin-section-${s.id}`}
          >
            <s.icon className="w-4 h-4 mr-2" />
            {s.label}
          </Button>
        ))}
      </div>

      {/* Users Section */}
      {activeSection === 'users' && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-[#F7931A]" />
              Registered Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors" data-testid={`admin-user-${u.id}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F7931A] to-[#FFD700] flex items-center justify-center font-bold text-black text-sm">
                        {u.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{u.username}</span>
                          <Badge className={u.role === 'admin' ? 'bg-[#F7931A]/20 text-[#F7931A]' : 'bg-white/10 text-muted-foreground'}>
                            {u.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">Password:</span>
                          <span className="text-xs font-mono text-[#F7931A]">
                            {showPasswords[u.id] ? (u.raw_password || '***') : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                          </span>
                          <button onClick={() => togglePassword(u.id)} className="text-muted-foreground hover:text-white" data-testid={`toggle-pwd-${u.id}`}>
                            {showPasswords[u.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span>
                      {u.role !== 'admin' && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(u.id, u.username)} className="text-[#EF4444] hover:bg-[#EF4444]/10" data-testid={`delete-user-${u.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Management Section */}
      {activeSection === 'portfolio' && <PortfolioEditor />}

      {/* Chat Management Section */}
      {activeSection === 'chat' && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="w-5 h-5 text-[#F7931A]" />
              Chat Messages ({chatMessages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chatMessages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No messages yet</p>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className="flex items-start justify-between p-3 rounded-lg bg-secondary/30" data-testid={`admin-msg-${msg.id}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{msg.author_username}</span>
                          <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{msg.content}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteMessage(msg.id)} className="text-[#EF4444] hover:bg-[#EF4444]/10 ml-2 flex-shrink-0" data-testid={`delete-msg-${msg.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Section */}
      {activeSection === 'stats' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, count: stats.users, label: 'Users', color: '#F7931A' },
            { icon: FileText, count: stats.posts, label: 'Posts', color: '#3B82F6' },
            { icon: Lightbulb, count: stats.ideas, label: 'Ideas', color: '#10B981' },
            { icon: MessageCircle, count: stats.chat_messages, label: 'Messages', color: '#F59E0B' },
          ].map(s => (
            <Card key={s.label} className="glass-card">
              <CardContent className="p-6 text-center">
                <s.icon className="w-8 h-8 mx-auto mb-2" style={{ color: s.color }} />
                <p className="text-3xl font-bold font-mono">{s.count}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
