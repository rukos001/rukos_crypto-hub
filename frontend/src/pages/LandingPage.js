import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { RukosLogo, RukosIcon, RukosWatermark } from '../components/RukosLogo';
import { 
  BarChart3, MessageCircle, Lightbulb, Bot, ArrowRight, Zap, TrendingUp
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const features = [
    { icon: BarChart3, title: 'Криптовалютные данные', description: 'Цены BTC, ETH, SOL, капитализация рынка и ETF потоки в реальном времени' },
    { icon: Zap, title: 'Whale Activity', description: 'Отслеживайте крупные транзакции и движения китов от Arkham' },
    { icon: TrendingUp, title: 'Ликвидации', description: 'Данные о ликвидациях от Coinglass с предупреждениями о рекордах' },
    { icon: Lightbulb, title: 'Торговые идеи', description: 'Делитесь и обсуждайте торговые идеи с сообществом' },
    { icon: MessageCircle, title: 'Общий чат', description: 'Общайтесь с другими трейдерами в реальном времени' },
    { icon: Bot, title: 'AI Ассистент', description: 'Персональный криптовалютный помощник на базе GPT-5.2' },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Video */}
      <section className="relative h-screen overflow-hidden flex items-center justify-center">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          data-testid="hero-video"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black" />

        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          {/* Logo from image */}
          <div className="flex items-center justify-center mb-8 animate-fade-in">
            <img 
              src="/logo.jpg" 
              alt="RUKOS CRYPTO" 
              className="h-28 md:h-36 lg:h-44 object-contain drop-shadow-2xl"
              data-testid="hero-logo-img"
            />
          </div>
          
          <p className="text-lg md:text-xl text-white/70 mb-10 animate-fade-in max-w-2xl mx-auto" style={{ animationDelay: '0.2s' }}>
            Все данные крипторынка в одном месте.
            <br className="hidden md:block" />
            Цены, ETF, киты, ликвидации и AI-помощник.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {isAuthenticated ? (
              <Button 
                size="lg"
                onClick={() => navigate('/dashboard')}
                className="bg-[#F7931A] hover:bg-[#FFAC40] text-black font-bold text-lg px-10 py-7 rounded-2xl neon-glow"
                data-testid="go-to-dashboard-btn"
              >
                <RukosIcon size={20} className="mr-2 text-black" />
                Перейти в Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <>
                <Button 
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="bg-[#F7931A] hover:bg-[#FFAC40] text-black font-bold text-lg px-10 py-7 rounded-2xl neon-glow"
                  data-testid="get-started-btn"
                >
                  <RukosIcon size={20} className="mr-2 text-black" />
                  Начать бесплатно
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/auth')}
                  className="border-white/20 hover:bg-white/10 text-lg px-10 py-7 rounded-2xl backdrop-blur-sm"
                  data-testid="login-btn"
                >
                  Войти
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center pt-2">
            <div className="w-1.5 h-3 rounded-full bg-[#F7931A] animate-pulse" />
          </div>
        </div>

        {/* Subtle watermark cube */}
        <RukosWatermark position="bottom-right" size={60} />
      </section>

      {/* Features Section */}
      <section className="relative py-24 lg:py-32 bg-[#050505]">
        <RukosWatermark position="top-left" size={80} />
        <RukosWatermark position="center-right" size={50} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <RukosIcon size={28} className="text-[#F7931A]" />
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Всё что нужно трейдеру
              </h2>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Собрали ключевые данные с CoinMarketCap, SoSoValue, Arkham и Coinglass в одном месте
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card 
                key={i} 
                className="glass-card hover:-translate-y-1 transition-all duration-300 animate-fade-in group"
                style={{ animationDelay: `${0.1 * i}s` }}
              >
                <CardContent className="p-6 relative overflow-hidden">
                  {/* Subtle cube watermark in each card */}
                  <div className="absolute -bottom-2 -right-2 text-white/[0.03] group-hover:text-[#F7931A]/[0.06] transition-colors">
                    <RukosIcon size={48} />
                  </div>
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
      <section className="relative py-20 border-t border-white/5 bg-[#050505]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="glass-card p-12 rounded-3xl relative overflow-hidden">
            <RukosWatermark position="top-right" size={50} />
            <img 
              src="/logo.jpg" 
              alt="RUKOS CRYPTO" 
              className="h-16 object-contain mx-auto mb-6 opacity-80"
            />
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
                className="bg-[#F7931A] hover:bg-[#FFAC40] text-black font-bold px-12 rounded-2xl"
                data-testid="cta-signup-btn"
              >
                <RukosIcon size={18} className="mr-2 text-black" />
                Создать аккаунт
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-3">
          <RukosIcon size={16} className="text-[#F7931A]/50" />
          <p className="text-muted-foreground text-sm">
            2025 RUKOS_CRYPTO | HUB. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
};
