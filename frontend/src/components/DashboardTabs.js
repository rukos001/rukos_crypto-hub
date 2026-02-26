import React from 'react';

const MarketCoreTab = ({ data, loading }) => {
  if (loading) return <div>Loading...</div>;
  return <div>Market Core</div>;
};

const DerivativesTab = ({ data, loading }) => {
  if (loading) return <div>Loading...</div>;
  return <div>Derivatives</div>;
};

const LoadingSkeleton = () => <div>Loading...</div>;
const MetricCard = () => <div />;
const SectionHeader = () => <div />;
const CustomTooltip = () => <div />;
const formatNumber = (n) => String(n);
const formatPct = (n) => String(n);
const formatCompact = (n) => String(n);
const ValueChange = () => <span />;

export { MarketCoreTab, DerivativesTab, LoadingSkeleton, MetricCard, SectionHeader, CustomTooltip, formatNumber, formatPct, formatCompact, ValueChange };
