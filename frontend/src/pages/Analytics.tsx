import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Sun,
  Droplets,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { AnalyticsSummary } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

export const Analytics: React.FC = () => {
  const { t, language } = useLanguage();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalyticsSummary()
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to load analytics:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cotton-700 bg-cotton-50 px-3 py-1 rounded-full border border-cotton-200">
          <Activity className="w-3.5 h-3.5" />
          {t('analyticsTitle')}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('analyticsTitle')}
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          {t('analyticsSubtitle')}
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-cotton-600" />
          <span className="text-xs font-bold">{t('loading')}</span>
        </div>
      ) : data ? (
        <div className="space-y-8">
          
          {/* Key Insights Overview Banner */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cotton-600" />
              {t('analyticsSummaryCard')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-cotton-50/60 p-4 rounded-xl border border-cotton-200/60">
              {data.summary_text}
            </p>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Yield Distribution Bins */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cotton-600" />
                  {language === 'mr' ? 'कापूस उत्पादन वितरण (किलो/एकर)' : language === 'hi' ? 'कपास उत्पादन वितरण (किलो/एकड़)' : 'Yield Distribution (kg/acre Bins)'}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">Population Frequencies</span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.distributions.yield_bins}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any) => [val.toLocaleString(), 'Observations']}
                      contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    />
                    <Bar dataKey="count" fill="#3e954e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Temperature vs Yield Curve */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-600" />
                  Temperature Impact on Yield Curve
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">Avg Yield vs °C</span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.distributions.temperature_vs_yield}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="temp" tick={{ fontSize: 11 }} label={{ value: '°C', position: 'insideBottomRight', offset: -5 }} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any) => [`${val} kg/acre`, 'Average Yield']}
                      contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="avg_yield" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Key Yield Factors Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-cotton-600" />
              Yield Impact Factor Breakdown & Agronomic Interventions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {data.key_factors.map((factor, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{factor.factor}</span>
                    <span className="text-xs font-bold text-cotton-700 bg-cotton-100 px-2 py-0.5 rounded">
                      {factor.importance_pct}% Weight
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-600">
                    Correlation Trend: <strong className="text-slate-800">{factor.impact}</strong>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-200">
                    💡 <strong>Field Strategy:</strong> {factor.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Correlation Coefficients Grid */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Statistical Correlation Matrix with Cotton Yield
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {Object.entries(data.correlations).map(([key, val]) => (
                <div key={key} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className={`text-base font-extrabold ${val >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {val >= 0 ? `+${val}` : val}
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium truncate mt-0.5">{key}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : null}

    </div>
  );
};
