import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  TrendingUp, 
  BarChart3, 
  MessageCircle, 
  Lightbulb, 
  Bot,
  ArrowRight,
  Zap,
  Shield
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: BarChart3,
      title: 'Криптовалютные данные',
      description: 'Цены BTC, ETH, SOL, капитализация рынка и ETF потоки в реальном времени'
    },
    {
      icon: Zap,
      title: 'Whale Activity',
      description: 'Отслеживайте крупные транзакции и движения китов от Arkham'
    },
    {
      icon: TrendingUp,
      title: 'Ликвидации',
      description: 'Данные о ликвидациях от Coinglass с предупреждениями о рекордах'
    },
    {
      icon: Lightbulb,
      title: 'Торговые идеи',
      description: 'Делитесь и обсуждайте торговые идеи с сообществом'
    },
    {
      icon: MessageCircle,
      title: 'Общий чат',
      description: 'Общайтесь с другими трейдерами в реальном времени'
    },
    {
      icon: Bot,
      title: 'AI Ассистент',
      description: 'Персональный криптовалютный помощник на базе GPT-5.2'
    }
  ];

  return (
    <div className="min-h-screen grid-texture">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1759178460799-1ad5a891bf8e?crop=entropy&cs=srgb&fm=jpg&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="flex items-center justify-center gap-4 mb-8 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F7931A] to-[#FFD700] flex items-center justify-center animate-pulse-glow">
                <TrendingUp className="w-8 h-8 text-black" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <span className="gold-gradient">RUKOS_CRYPTO</span>
              <span className="text-muted-foreground"> | HUB</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Все данные крипторынка в одном месте.
              <br className="hidden md:block" />
              Цены, ETF, киты, ликвидации и AI-помощник.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {isAuthenticated ? (
                <Button 
                  size="lg"
                  onClick={() => navigate('/dashboard')}
                  className="bg-[#F7931A] hover:bg-[#FFAC40] text-black font-bold text-lg px-8 py-6 neon-glow"
                  data-testid="go-to-dashboard-btn"
                >
                  Перейти в Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg"
                    onClick={() => navigate('/auth')}
                    className="bg-[#F7931A] hover:bg-[#FFAC40] text-black font-bold text-lg px-8 py-6 neon-glow"
                    data-testid="get-started-btn"
                  >
                    Начать бесплатно
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/auth')}
                    className="border-white/20 hover:bg-white/5 text-lg px-8 py-6"
                    data-testid="login-btn"
                  >
                    Войти
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Всё что нужно трейдеру
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Собрали ключевые данные с CoinMarketCap, SoSoValue, Arkham и Coinglass в одном месте
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card 
                key={i} 
                className="glass-card hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${0.1 * i}s` }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-[#F7931A]/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-[#F7931A]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="glass-card p-12 rounded-3xl">
            <Shield className="w-12 h-12 text-[#F7931A] mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Готовы начать?
            </h2>
            <p className="text-muted-foreground mb-8">
              Присоединяйтесь к сообществу криптотрейдеров
            </p>
            {!isAuthenticated && (
              <Button 
                size="lg"
                onClick={() => navigate('/auth')}
                className="bg-[#F7931A] hover:bg-[#FFAC40] text-black font-bold px-12"
                data-testid="cta-signup-btn"
              >
                Создать аккаунт
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            2025 RUKOS_CRYPTO | HUB. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
};
