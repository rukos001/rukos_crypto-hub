import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import { useLanguage } from '../context/LanguageContext';
import { 
  BookOpen, Layers, BarChart3, Target, Globe2, 
  ChevronDown, ChevronUp, Tag
} from 'lucide-react';
// watermarks removed

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  { key: 'defi', label: 'DeFi', icon: Layers, color: '#3B82F6', desc_ru: 'Децентрализованные финансы: ликвидность, фарминг, протоколы', desc_en: 'Decentralized finance: liquidity, farming, protocols' },
  { key: 'perp', label: 'PERP', icon: BarChart3, color: '#F7931A', desc_ru: 'Бессрочные фьючерсы: фандинг, ОИ, ликвидации', desc_en: 'Perpetual futures: funding, OI, liquidations' },
  { key: 'options', label: 'OPTIONS', icon: Target, color: '#10B981', desc_ru: 'Опционы: греки, стратегии, гамма-экспозиция', desc_en: 'Options: greeks, strategies, gamma exposure' },
  { key: 'macro', label: 'MACRO', icon: Globe2, color: '#F59E0B', desc_ru: 'Макроэкономика: DXY, ставки, M2, ликвидность', desc_en: 'Macroeconomics: DXY, rates, M2, liquidity' },
];

const ArticleCard = ({ article, isExpanded, onToggle }) => {
  return (
    <Card className="glass-card border-white/5 hover:border-white/10 transition-colors" data-testid={`article-${article.id}`}>
      <CardHeader className="pb-2 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{article.title}</CardTitle>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
        {article.tags?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-1">
            {article.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs border-white/10 px-2 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="prose prose-invert prose-sm max-w-none">
            {article.content.split('\n').map((line, i) => {
              if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={i} className="font-bold text-[#F7931A] mt-2">{line.replace(/\*\*/g, '')}</p>;
              }
              if (line.match(/^\*\*.*\*\*/)) {
                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <p key={i} className="text-sm text-gray-300 leading-relaxed">
                    {parts.map((part, j) => 
                      part.startsWith('**') ? <strong key={j} className="text-white">{part.replace(/\*\*/g, '')}</strong> : part
                    )}
                  </p>
                );
              }
              if (line.trim() === '') return <br key={i} />;
              return <p key={i} className="text-sm text-gray-300 leading-relaxed">{line}</p>;
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export const KnowledgePage = () => {
  const { language } = useLanguage();
  const { category: urlCategory } = useParams();
  const [activeCategory, setActiveCategory] = useState(urlCategory || 'defi');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (urlCategory && CATEGORIES.find(c => c.key === urlCategory)) {
      setActiveCategory(urlCategory);
    }
  }, [urlCategory]);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/knowledge?category=${activeCategory}`);
        setArticles(res.data);
        setExpandedId(res.data[0]?.id || null);
      } catch (err) {
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [activeCategory]);

  const activeCat = CATEGORIES.find(c => c.key === activeCategory);

  return (
    <div className="space-y-6 animate-fade-in relative" data-testid="knowledge-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#F7931A]" />
          {language === 'ru' ? 'База знаний' : 'Knowledge Base'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {language === 'ru' ? 'Образовательные материалы по трейдингу и криптовалютам' : 'Educational materials on trading and crypto'}
        </p>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="knowledge-categories">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => { setActiveCategory(cat.key); setExpandedId(null); }}
              className={`p-4 rounded-xl text-left transition-all duration-200 border ${
                isActive 
                  ? 'border-2 bg-opacity-20'
                  : 'border-white/5 hover:border-white/15 bg-secondary/20'
              }`}
              style={isActive ? { borderColor: cat.color, backgroundColor: `${cat.color}15` } : {}}
              data-testid={`knowledge-cat-${cat.key}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}20` }}>
                  <Icon className="w-4 h-4" style={{ color: cat.color }} />
                </div>
                <span className="font-bold text-sm" style={isActive ? { color: cat.color } : {}}>{cat.label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">
                {language === 'ru' ? cat.desc_ru : cat.desc_en}
              </p>
            </button>
          );
        })}
      </div>

      {/* Category header */}
      {activeCat && (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: `${activeCat.color}10`, borderLeft: `4px solid ${activeCat.color}` }}>
          <activeCat.icon className="w-6 h-6" style={{ color: activeCat.color }} />
          <div>
            <h2 className="font-bold text-lg" style={{ color: activeCat.color }}>{activeCat.label}</h2>
            <p className="text-sm text-muted-foreground">
              {language === 'ru' ? activeCat.desc_ru : activeCat.desc_en}
            </p>
          </div>
          <Badge className="ml-auto" variant="outline" style={{ borderColor: activeCat.color, color: activeCat.color }}>
            {articles.length} {language === 'ru' ? 'статей' : 'articles'}
          </Badge>
        </div>
      )}

      {/* Articles */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>{language === 'ru' ? 'Статей пока нет' : 'No articles yet'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              isExpanded={expandedId === article.id}
              onToggle={() => setExpandedId(expandedId === article.id ? null : article.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
