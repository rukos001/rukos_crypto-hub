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
  Eye, EyeOff, BarChart3, RefreshCw
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'stats', icon: BarChart3, label: 'Stats' },
  ];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-page">
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
      <div className="flex gap-2">
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
                            {showPasswords[u.id] ? (u.raw_password || '***') : '••••••••'}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="text-[#EF4444] hover:bg-[#EF4444]/10"
                          data-testid={`delete-user-${u.id}`}
                        >
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
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{msg.content}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="text-[#EF4444] hover:bg-[#EF4444]/10 ml-2 flex-shrink-0"
                        data-testid={`delete-msg-${msg.id}`}
                      >
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
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-[#F7931A]" />
              <p className="text-3xl font-bold font-mono">{stats.users}</p>
              <p className="text-sm text-muted-foreground">Users</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-[#3B82F6]" />
              <p className="text-3xl font-bold font-mono">{stats.posts}</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 text-[#10B981]" />
              <p className="text-3xl font-bold font-mono">{stats.ideas}</p>
              <p className="text-sm text-muted-foreground">Ideas</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-[#F59E0B]" />
              <p className="text-3xl font-bold font-mono">{stats.chat_messages}</p>
              <p className="text-sm text-muted-foreground">Messages</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
