import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Heart, TrendingUp, TrendingDown, Target, Clock, User } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const IdeasPage = () => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [newIdea, setNewIdea] = useState({ 
    title: '', 
    content: '', 
    coin: 'BTC', 
    direction: 'long',
    target_price: '',
    stop_loss: ''
  });

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const response = await axios.get(`${API}/ideas`);
      setIdeas(response.data);
    } catch (error) {
      toast.error('Ошибка загрузки идей');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIdea = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/ideas`, {
        ...newIdea,
        target_price: newIdea.target_price ? parseFloat(newIdea.target_price) : null,
        stop_loss: newIdea.stop_loss ? parseFloat(newIdea.stop_loss) : null
      });
      toast.success('Идея опубликована!');
      setNewIdea({ title: '', content: '', coin: 'BTC', direction: 'long', target_price: '', stop_loss: '' });
      setIsOpen(false);
      fetchIdeas();
    } catch (error) {
      toast.error('Ошибка публикации');
    }
  };

  const handleLike = async (ideaId) => {
    try {
      await axios.post(`${API}/ideas/${ideaId}/like`);
      fetchIdeas();
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="ideas-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Торговые идеи</h1>
          <p className="text-muted-foreground">Идеи и сигналы от сообщества</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#F7931A] hover:bg-[#FFAC40] text-black font-semibold" data-testid="create-idea-btn">
              <Plus className="w-4 h-4 mr-2" /> Новая идея
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-white/10">
            <DialogHeader>
              <DialogTitle>Опубликовать идею</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateIdea} className="space-y-4">
              <Input
                placeholder="Заголовок"
                value={newIdea.title}
                onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                className="bg-secondary/50 border-white/10"
                data-testid="idea-title-input"
                required
              />
              
              <div className="grid grid-cols-2 gap-3">
                <Select value={newIdea.coin} onValueChange={(v) => setNewIdea({ ...newIdea, coin: v })}>
                  <SelectTrigger className="bg-secondary/50 border-white/10" data-testid="idea-coin-select">
                    <SelectValue placeholder="Монета" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    <SelectItem value="SOL">Solana (SOL)</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={newIdea.direction} onValueChange={(v) => setNewIdea({ ...newIdea, direction: v })}>
                  <SelectTrigger className="bg-secondary/50 border-white/10" data-testid="idea-direction-select">
                    <SelectValue placeholder="Направление" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="long">Long</SelectItem>
                    <SelectItem value="short">Short</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Target Price"
                  value={newIdea.target_price}
                  onChange={(e) => setNewIdea({ ...newIdea, target_price: e.target.value })}
                  className="bg-secondary/50 border-white/10"
                  data-testid="idea-target-input"
                />
                <Input
                  type="number"
                  placeholder="Stop Loss"
                  value={newIdea.stop_loss}
                  onChange={(e) => setNewIdea({ ...newIdea, stop_loss: e.target.value })}
                  className="bg-secondary/50 border-white/10"
                  data-testid="idea-stoploss-input"
                />
              </div>

              <Textarea
                placeholder="Опишите вашу идею..."
                value={newIdea.content}
                onChange={(e) => setNewIdea({ ...newIdea, content: e.target.value })}
                className="bg-secondary/50 border-white/10 min-h-[120px]"
                data-testid="idea-content-input"
                required
              />
              
              <Button type="submit" className="w-full bg-[#F7931A] hover:bg-[#FFAC40] text-black font-semibold" data-testid="submit-idea-btn">
                Опубликовать
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-card animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-secondary/50 rounded w-1/2 mb-4" />
                <div className="h-4 bg-secondary/50 rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Пока нет идей. Поделитесь своей!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {ideas.map((idea) => (
            <Card key={idea.id} className="glass-card hover:-translate-y-1 transition-all duration-300" data-testid={`idea-${idea.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${
                        idea.direction === 'long' 
                          ? 'bg-[#10B981]/20 text-[#10B981]' 
                          : 'bg-[#EF4444]/20 text-[#EF4444]'
                      }`}>
                        {idea.direction === 'long' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {idea.direction.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="border-[#F7931A]/30 text-[#F7931A]">
                        {idea.coin}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{idea.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{idea.content}</p>
                
                {(idea.target_price || idea.stop_loss) && (
                  <div className="flex gap-4 mb-4 p-3 rounded-lg bg-secondary/30">
                    {idea.target_price && (
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Target className="w-3 h-3" /> Target
                        </p>
                        <p className="font-mono text-[#10B981] font-semibold">{formatPrice(idea.target_price)}</p>
                      </div>
                    )}
                    {idea.stop_loss && (
                      <div>
                        <p className="text-xs text-muted-foreground">Stop Loss</p>
                        <p className="font-mono text-[#EF4444] font-semibold">{formatPrice(idea.stop_loss)}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {idea.author_username}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(idea.created_at)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(idea.id)}
                    className="text-muted-foreground hover:text-[#EF4444]"
                    data-testid={`like-idea-${idea.id}`}
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    <span className="font-mono">{idea.likes}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
