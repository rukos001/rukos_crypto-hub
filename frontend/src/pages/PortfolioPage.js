import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, Plus, Trash2, Edit2, Wallet, Lock, RefreshCw, PieChartIcon
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const fmt = (n, d = 2) => n ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}` : '$0';
const fmtPct = (n) => n ? `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%` : '0%';

const GROUP_COLORS = {
  HOLD: 'border-emerald-500/30 bg-emerald-500/5',
  ALTs: 'border-blue-500/30 bg-blue-500/5',
  HI_RISK: 'border-rose-500/30 bg-rose-500/5',
};

const PIE_COLORS = {
  HOLD: '#10B981',
  ALTs: '#3B82F6', 
  HI_RISK: '#EF4444',
};

const GROUP_LABELS_EN = { HOLD: 'HOLD', ALTs: 'ALTs', HI_RISK: 'HI RISK' };

// ── Portfolio Pie Chart ──
const PortfolioPieChart = ({ data, t }) => {
  if (!data || !data.groups) return null;
  
  const chartData = Object.entries(data.groups)
    .filter(([_, group]) => group.positions?.length > 0)
    .map(([name, group]) => ({
      name: name,
      value: group.positions.reduce((sum, p) => sum + (p.value_usd || 0), 0),
      label: t(name.toLowerCase()) || name,
    }));

  if (chartData.length === 0) return null;

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const pct = ((d.value / total) * 100).toFixed(1);
      return (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-2 text-sm">
          <p className="font-medium">{d.label}</p>
          <p className="text-white/60">${d.value.toLocaleString()}</p>
          <p className="text-[#F7931A]">{pct}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-[#F7931A]" />
          {t('allocation') || 'Распределение'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={55}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#0a0a0a"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || '#F7931A'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {chartData.map((d) => {
              const pct = ((d.value / total) * 100).toFixed(1);
              return (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[d.name] }} />
                    <span className="text-white/70">{d.label}</span>
                  </div>
                  <span className="font-mono text-white/90">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ── Loading Skeleton ──
const PortfolioSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-20 w-full" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  </div>
);

// ── Position Row ──
const PositionRow = ({ pos, onDelete, onEdit, readOnly, t }) => {
  const pnlColor = pos.pnl_usd >= 0 ? 'text-emerald-400' : 'text-rose-400';
  const PnlIcon = pos.pnl_usd >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors group" data-testid={`position-${pos.asset}`}>
      {pos.image && <img src={pos.image} alt="" className="w-7 h-7 rounded-full" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{pos.asset}</span>
          <span className="text-xs text-white/30">{pos.size} {t('pieces')}</span>
        </div>
        <div className="text-xs text-white/40">
          {t('entry')}: {fmt(pos.entry_price)} | {t('current')}: {fmt(pos.current_price)}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-medium">{fmt(pos.value_usd)}</div>
        <div className={`text-xs flex items-center gap-1 justify-end ${pnlColor}`}>
          <PnlIcon className="w-3 h-3" />
          {fmt(pos.pnl_usd)} ({fmtPct(pos.pnl_pct)})
        </div>
      </div>
      {!readOnly && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onEdit(pos)} className="p-1.5 rounded hover:bg-white/10" data-testid={`edit-${pos.asset}`}>
            <Edit2 className="w-3.5 h-3.5 text-white/40" />
          </button>
          <button onClick={() => onDelete(pos.id)} className="p-1.5 rounded hover:bg-rose-500/20" data-testid={`delete-${pos.asset}`}>
            <Trash2 className="w-3.5 h-3.5 text-rose-400/60" />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Group Card ──
const GroupCard = ({ name, data, readOnly, onDelete, onEdit, t }) => {
  if (!data || data.count === 0) return null;
  const groupLabels = { 
    HOLD: t('hold'), 
    ALTs: t('alts'), 
    HI_RISK: t('hi_risk') 
  };
  return (
    <Card className={`glass-card ${GROUP_COLORS[name] || ''}`} data-testid={`group-${name}`}>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold tracking-wider">{groupLabels[name] || name}</CardTitle>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-white/40">{data.count} {t('positions_count')}</span>
            <span className="font-medium">{fmt(data.total_value)}</span>
            <span className={data.total_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {fmtPct(data.total_pnl_pct)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 divide-y divide-white/5">
        {(data.positions || []).map(pos => (
          <PositionRow key={pos.id || pos.asset} pos={pos} readOnly={readOnly} onDelete={onDelete} onEdit={onEdit} t={t} />
        ))}
      </CardContent>
    </Card>
  );
};

// ── Add/Edit Position Dialog ──
const PositionDialog = ({ open, onClose, onSave, editPos, t }) => {
  const [asset, setAsset] = useState('');
  const [size, setSize] = useState('');
  const [entry, setEntry] = useState('');
  const [group, setGroup] = useState('HOLD');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editPos) {
      setAsset(editPos.asset);
      setSize(String(editPos.size));
      setEntry(String(editPos.entry_price));
      setGroup(editPos.group || 'HOLD');
      setNotes(editPos.notes || '');
    } else {
      setAsset(''); setSize(''); setEntry(''); setGroup('HOLD'); setNotes('');
    }
  }, [editPos, open]);

  const handleSubmit = () => {
    if (!asset || !size || !entry) {
      toast.error(t('fill_all_fields'));
      return;
    }
    onSave({ asset: asset.toUpperCase(), size: parseFloat(size), entry_price: parseFloat(entry), group, notes }, editPos?.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-sm" data-testid="position-dialog">
        <DialogHeader>
          <DialogTitle>{editPos ? t('edit_position') : t('add_position')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <Input placeholder={t('ticker_placeholder')} value={asset} onChange={e => setAsset(e.target.value)} disabled={!!editPos} data-testid="input-asset" />
          <Input placeholder={t('amount')} type="number" step="any" value={size} onChange={e => setSize(e.target.value)} data-testid="input-size" />
          <Input placeholder={t('entry_price')} type="number" step="any" value={entry} onChange={e => setEntry(e.target.value)} data-testid="input-entry" />
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger data-testid="select-group"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="HOLD">{t('hold')}</SelectItem>
              <SelectItem value="ALTs">{t('alts')}</SelectItem>
              <SelectItem value="HI_RISK">{t('hi_risk')}</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder={t('note_optional')} value={notes} onChange={e => setNotes(e.target.value)} data-testid="input-notes" />
          <Button onClick={handleSubmit} className="w-full bg-[#F7931A] hover:bg-[#FFAC40] text-black font-bold" data-testid="save-position-btn">
            {editPos ? t('save') : t('add')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Summary Card ──
const SummaryCard = ({ data, label, t }) => {
  const pnlColor = (data?.total_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400';
  return (
    <Card className="glass-card" data-testid="portfolio-summary">
      <CardContent className="p-4 flex flex-wrap items-center gap-x-8 gap-y-2">
        <div>
          <div className="text-xs text-white/40 mb-0.5">{label || t('portfolio')}</div>
          <div className="text-xl font-bold">{fmt(data?.total_value)}</div>
        </div>
        <div>
          <div className="text-xs text-white/40 mb-0.5">{t('pnl')}</div>
          <div className={`text-lg font-semibold ${pnlColor}`}>
            {fmt(data?.total_pnl)} ({fmtPct(data?.total_pnl_pct)})
          </div>
        </div>
        <div>
          <div className="text-xs text-white/40 mb-0.5">{t('positions')}</div>
          <div className="text-lg font-semibold">{data?.positions_count || 0}</div>
        </div>
      </CardContent>
    </Card>
  );
};

// ═══════════════════════════════════════════
// Main Portfolio Page
// ═══════════════════════════════════════════
export const PortfolioPage = () => {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [tab, setTab] = useState('my');
  const [myData, setMyData] = useState(null);
  const [rukosData, setRukosData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPos, setEditPos] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchMy = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/portfolio/my`, { headers });
      setMyData(res.data);
    } catch (err) { console.error(err); }
  }, [token]);

  const fetchRukos = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/portfolio/rukos`);
      setRukosData(res.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    Promise.all([fetchMy(), fetchRukos()]).finally(() => setLoading(false));
    const iv = setInterval(() => { fetchMy(); fetchRukos(); }, 60000);
    return () => clearInterval(iv);
  }, [fetchMy, fetchRukos]);

  const handleSave = async (data, editId) => {
    try {
      if (editId) {
        await axios.put(`${API}/portfolio/positions/${editId}`, data, { headers });
        toast.success(t('position_updated'));
      } else {
        await axios.post(`${API}/portfolio/positions`, data, { headers });
        toast.success(t('position_added'));
      }
      fetchMy();
    } catch (err) {
      toast.error(err.response?.data?.detail || t('error'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/portfolio/positions/${id}`, { headers });
      toast.success(t('position_deleted'));
      fetchMy();
    } catch (err) {
      toast.error(t('delete_error'));
    }
  };

  const handleEdit = (pos) => {
    setEditPos(pos);
    setDialogOpen(true);
  };

  if (loading) return <PortfolioSkeleton />;

  return (
    <div className="space-y-5 animate-fade-in" data-testid="portfolio-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#F7931A]" />
            {t('portfolio')}
          </h1>
          <p className="text-sm text-white/40">{t('portfolio_management')}</p>
        </div>
        <Button variant="outline" size="sm" className="border-white/10" onClick={() => { fetchMy(); fetchRukos(); }} data-testid="refresh-portfolio-btn">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('refresh')}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary/30 rounded-xl p-1">
          <TabsTrigger value="my" className="px-5 py-2 rounded-lg data-[state=active]:bg-[#F7931A]/20 data-[state=active]:text-[#F7931A]" data-testid="tab-my-portfolio">
            <Wallet className="w-4 h-4 mr-2" />
            {t('portfolio_my') || 'Мой портфель'}
          </TabsTrigger>
          <TabsTrigger value="rukos" className="px-5 py-2 rounded-lg data-[state=active]:bg-[#F7931A]/20 data-[state=active]:text-[#F7931A]" data-testid="tab-rukos-portfolio">
            <Lock className="w-4 h-4 mr-2" />
            {t('portfolio_rukos') || 'RUKOS_CRYPTO'}
          </TabsTrigger>
        </TabsList>

        {/* MY PORTFOLIO */}
        <TabsContent value="my" className="mt-5 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <SummaryCard data={myData} label={t('my_portfolio_label')} t={t} />
            <Button onClick={() => { setEditPos(null); setDialogOpen(true); }} className="bg-[#F7931A] hover:bg-[#FFAC40] text-black font-bold shrink-0" data-testid="add-position-btn">
              <Plus className="w-4 h-4 mr-1" />
              {t('add')}
            </Button>
          </div>

          {myData && myData.positions_count > 0 ? (
            <div className="space-y-4">
              {/* Pie Chart */}
              <PortfolioPieChart data={myData} t={t} />
              
              {/* Position Groups */}
              {['HOLD', 'ALTs', 'HI_RISK'].map(g => (
                <GroupCard key={g} name={g} data={myData.groups[g]} readOnly={false} onDelete={handleDelete} onEdit={handleEdit} t={t} />
              ))}
            </div>
          ) : (
            <Card className="glass-card">
              <CardContent className="py-16 text-center">
                <Wallet className="w-12 h-12 mx-auto mb-4 text-white/10" />
                <p className="text-white/40 mb-4">{t('portfolio_empty')}</p>
                <Button onClick={() => { setEditPos(null); setDialogOpen(true); }} className="bg-[#F7931A] hover:bg-[#FFAC40] text-black font-bold" data-testid="add-first-position-btn">
                  <Plus className="w-4 h-4 mr-1" />
                  {t('add_position')}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* RUKOS_CRYPTO PORTFOLIO */}
        <TabsContent value="rukos" className="mt-5 space-y-4">
          <Card className="glass-card border-[#F7931A]/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Lock className="w-5 h-5 text-[#F7931A]" />
                <div>
                  <h3 className="font-bold text-sm">{t('portfolio_rukos')}</h3>
                  <p className="text-xs text-white/40">{t('low_risk_portfolio')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {rukosData && rukosData.positions_count > 0 ? (
            <>
              <SummaryCard data={rukosData} label="RUKOS_CRYPTO" t={t} />
              {/* Pie Chart for RUKOS */}
              <PortfolioPieChart data={rukosData} t={t} />
              <div className="space-y-4">
                {['HOLD', 'ALTs', 'HI_RISK'].map(g => (
                  rukosData.groups[g] && rukosData.groups[g].positions?.length > 0 && (
                    <GroupCard key={g} name={g} data={{
                      ...rukosData.groups[g],
                      count: rukosData.groups[g].positions.length,
                      total_value: rukosData.groups[g].total_value,
                      total_pnl: rukosData.groups[g].total_pnl,
                      total_pnl_pct: rukosData.groups[g].total_pnl_pct,
                    }} readOnly={true} t={t} />
                  )
                ))}
              </div>
            </>
          ) : (
            <Card className="glass-card">
              <CardContent className="py-16 text-center">
                <Lock className="w-12 h-12 mx-auto mb-4 text-white/10" />
                <p className="text-white/40">{rukosData?.description || t('portfolio_not_configured')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <PositionDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setEditPos(null); }} onSave={handleSave} editPos={editPos} t={t} />
    </div>
  );
};
