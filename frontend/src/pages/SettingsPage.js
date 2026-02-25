import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { Settings, Send, Bell, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage = () => {
  const { user, logout } = useAuth();
  const [telegramToken, setTelegramToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [notifications, setNotifications] = useState({
    prices: true,
    whales: true,
    liquidations: true,
    posts: false
  });

  const handleSaveTelegram = () => {
    // Placeholder - будет реализовано позже
    toast.info('Telegram интеграция будет добавлена позже');
  };

  const handleLogout = () => {
    logout();
    toast.success('Вы вышли из аккаунта');
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in" data-testid="settings-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground">Управление аккаунтом и уведомлениями</p>
      </div>

      {/* Profile Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#F7931A]" />
            Профиль
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div>
              <p className="font-semibold">{user?.username}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F7931A] to-[#FFD700] flex items-center justify-center font-bold text-black text-lg">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/10"
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Выйти из аккаунта
          </Button>
        </CardContent>
      </Card>

      {/* Telegram Integration */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="w-5 h-5 text-[#0088cc]" />
            Telegram интеграция
          </CardTitle>
          <CardDescription>
            Подключите бота для получения уведомлений в Telegram
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-[#0088cc]/10 border border-[#0088cc]/20">
            <p className="text-sm text-muted-foreground mb-2">
              Для подключения Telegram:
            </p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Создайте бота через @BotFather</li>
              <li>Скопируйте токен бота</li>
              <li>Напишите боту команду /start</li>
              <li>Получите ваш Chat ID</li>
            </ol>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="telegram-token">Bot Token</Label>
              <Input
                id="telegram-token"
                placeholder="123456:ABC-DEF..."
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                className="bg-secondary/50 border-white/10 font-mono text-sm"
                data-testid="telegram-token-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chat-id">Chat ID</Label>
              <Input
                id="chat-id"
                placeholder="123456789"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="bg-secondary/50 border-white/10 font-mono text-sm"
                data-testid="telegram-chatid-input"
              />
            </div>
            <Button 
              onClick={handleSaveTelegram}
              className="w-full bg-[#0088cc] hover:bg-[#0088cc]/80 text-white"
              data-testid="save-telegram-btn"
            >
              Подключить Telegram
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#F7931A]" />
            Уведомления
          </CardTitle>
          <CardDescription>
            Настройте какие уведомления вы хотите получать
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'prices', label: 'Изменения цен', desc: 'При резких движениях BTC, ETH, SOL' },
            { key: 'whales', label: 'Активность китов', desc: 'Крупные транзакции от Arkham' },
            { key: 'liquidations', label: 'Ликвидации', desc: 'При приближении к рекордам' },
            { key: 'posts', label: 'Новые посты', desc: 'Когда появляются новые посты' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/30 transition-colors">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={notifications[item.key]}
                onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                data-testid={`notification-${item.key}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
