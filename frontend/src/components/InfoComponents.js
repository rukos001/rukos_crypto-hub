import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';
import { Info, ExternalLink } from 'lucide-react';

// Info tooltip component with "i" icon
export const InfoTooltip = ({ text, className = '' }) => {
  if (!text) return null;
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button className={`inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors ${className}`}>
            <Info className="w-3 h-3 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-[#1A1A1A] border-white/10 text-sm">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Source link button for external analytics
export const SourceLink = ({ href, label, variant = 'ghost', size = 'sm' }) => {
  if (!href) return null;
  
  return (
    <Button
      variant={variant}
      size={size}
      className="text-xs text-muted-foreground hover:text-[#F7931A] gap-1"
      onClick={() => window.open(href, '_blank')}
    >
      <ExternalLink className="w-3 h-3" />
      {label || 'Подробнее'}
    </Button>
  );
};

// Section header with info tooltip and source link
export const SectionHeaderWithInfo = ({ 
  icon: Icon, 
  title, 
  tooltip, 
  sourceUrl, 
  sourceLabel,
  badge,
  badgeColor = ''
}) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-5 h-5 text-[#F7931A]" />}
      <h3 className="text-lg font-semibold">{title}</h3>
      {tooltip && <InfoTooltip text={tooltip} />}
    </div>
    <div className="flex items-center gap-2">
      {badge && (
        <span className={`text-xs text-muted-foreground border border-white/10 px-2 py-0.5 rounded ${badgeColor}`}>
          {badge}
        </span>
      )}
      {sourceUrl && <SourceLink href={sourceUrl} label={sourceLabel} />}
    </div>
  </div>
);

// Language toggle button
export const LanguageToggle = ({ language, onToggle }) => (
  <Button
    variant="outline"
    size="sm"
    onClick={onToggle}
    className="border-white/10 text-xs font-mono gap-1"
  >
    <span className={language === 'ru' ? 'text-[#F7931A]' : 'text-muted-foreground'}>RU</span>
    <span className="text-muted-foreground">/</span>
    <span className={language === 'en' ? 'text-[#F7931A]' : 'text-muted-foreground'}>EN</span>
  </Button>
);
