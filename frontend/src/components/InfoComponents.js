import React, { useState } from 'react';
import { Info, ExternalLink } from 'lucide-react';
import { dataSourceLinks } from '../context/LanguageContext';

export const InfoTooltip = ({ text, testId }) => {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1.5">
      <button
        data-testid={testId || 'info-tooltip'}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="w-4 h-4 rounded-full bg-white/10 hover:bg-[#F7931A]/30 flex items-center justify-center transition-colors cursor-help"
      >
        <Info className="w-3 h-3 text-muted-foreground" />
      </button>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg bg-[#1a1a2e] border border-white/10 text-xs text-gray-300 shadow-xl leading-relaxed pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1a2e] border-r border-b border-white/10 rotate-45 -mt-1" />
        </div>
      )}
    </span>
  );
};

export const SourceLink = ({ source, label, testId }) => {
  const url = dataSourceLinks[source] || source;
  const displayLabel = label || source;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-testid={testId || `source-link-${source}`}
      className="inline-flex items-center gap-1 text-xs text-[#F7931A]/70 hover:text-[#F7931A] transition-colors mt-1"
    >
      <ExternalLink className="w-3 h-3" />
      <span>{displayLabel}</span>
    </a>
  );
};
