import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: string;
  trendPositive?: boolean;
  colorScheme?: 'green' | 'blue' | 'amber' | 'slate';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  colorScheme = 'green'
}) => {
  const schemeClasses = {
    green: 'bg-cotton-50/70 border-cotton-200/80 text-cotton-800',
    blue: 'bg-sky-50/70 border-sky-200/80 text-sky-800',
    amber: 'bg-amber-50/70 border-amber-200/80 text-amber-800',
    slate: 'bg-slate-50 border-slate-200 text-slate-800'
  };

  const iconBgClasses = {
    green: 'bg-cotton-600 text-white shadow-cotton-500/20',
    blue: 'bg-sky-600 text-white shadow-sky-500/20',
    amber: 'bg-amber-600 text-white shadow-amber-500/20',
    slate: 'bg-slate-700 text-white shadow-slate-500/20'
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-xs transition-all hover:shadow-md ${schemeClasses[colorScheme]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md ${iconBgClasses[colorScheme]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</div>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-xs font-semibold">
          <span className={trendPositive ? 'text-emerald-600' : 'text-rose-600'}>
            {trendPositive ? '↑' : '↓'} {trend}
          </span>
          <span className="text-slate-400 font-normal">vs seasonal benchmark</span>
        </div>
      )}
    </div>
  );
};
