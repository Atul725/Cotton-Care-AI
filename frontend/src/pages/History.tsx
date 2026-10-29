import React, { useState, useEffect } from 'react';
import {
  History as HistoryIcon,
  TrendingUp,
  ScanLine,
  Calendar,
  Layers,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { HistoryData } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

export const History: React.FC = () => {
  const { t, language } = useLanguage();
  const [data, setData] = useState<HistoryData | null>(null);
  const [filter, setFilter] = useState<'all' | 'yield' | 'disease'>('all');
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getHistory('demo_farmer', filter);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <HistoryIcon className="w-3.5 h-3.5 text-cotton-600" />
            {t('historyTitle')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('historySubtitle')}
          </h1>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
          {(['all', 'yield', 'disease'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize ${
                filter === cat
                  ? 'bg-cotton-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat === 'all' ? t('historyFilterAll') : cat === 'yield' ? t('historyFilterYield') : t('historyFilterDisease')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-cotton-600" />
          <span className="text-xs font-bold">{t('loading')}</span>
        </div>
      ) : data ? (
        <div className="space-y-8">
          
          {/* Yield Predictions Section */}
          {(filter === 'all' || filter === 'yield') && data.yield_predictions && (
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cotton-600" />
                Yield Predictions ({data.yield_predictions.length})
              </h2>

              {data.yield_predictions.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 italic">
                  No yield predictions logged yet. Run a prediction on the Yield Prediction page.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.yield_predictions.map((y) => (
                    <div key={y.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs text-slate-500">
                        <span className="font-semibold">Log #{y.id}</span>
                        <span>{y.created_at}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-black text-slate-900">
                            {y.total_predicted_yield_quintals}{' '}
                            <span className="text-xs font-semibold text-slate-500">Quintals</span>
                          </div>
                          <div className="text-xs text-slate-600 font-medium mt-0.5">
                            {y.predicted_yield_per_acre} kg/acre • {y.acres} Acres
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-500">
                          <div>Temp: {y.temperature}°C</div>
                          <div>Rain: {y.precipitation} mm</div>
                          <div>Cycle: {y.growth_cycle}d</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Disease Scans Section */}
          {(filter === 'all' || filter === 'disease') && data.disease_scans && (
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-rose-600" />
                Crop Disease Diagnoses ({data.disease_scans.length})
              </h2>

              {data.disease_scans.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 italic">
                  No disease scans logged yet. Upload a leaf sample on the Disease Diagnosis page.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.disease_scans.map((s) => (
                    <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      <div className="md:col-span-3">
                        {s.image_data_url ? (
                          <img
                            src={s.image_data_url}
                            alt="Crop leaf sample"
                            className="w-full h-36 object-cover rounded-xl border border-slate-200"
                          />
                        ) : (
                          <div className="w-full h-36 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                            <ScanLine className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-9 space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div>
                            <span className="text-xs font-bold text-slate-900">{s.condition_detected}</span>
                            <span className="ml-2 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              {s.severity_level}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">{s.created_at}</span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed line-clamp-3 font-medium bg-slate-50 p-3 rounded-lg border border-slate-200/60 whitespace-pre-line">
                          {s.diagnostic_report}
                        </p>

                        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                          <span>Engine: {s.detection_engine}</span>
                          <span>Confidence: {(s.confidence_score * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      ) : null}

    </div>
  );
};
