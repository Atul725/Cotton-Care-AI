import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Sliders,
  Sparkles,
  BarChart2,
  AlertCircle,
  HelpCircle,
  Info,
  CheckCircle2,
  Calendar,
  Sun,
  CloudRain,
  Thermometer,
  Layers
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../services/api';
import { YieldPredictionInput, YieldPredictionResult, ModelInfo } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

export const YieldPrediction: React.FC = () => {
  const { t } = useLanguage();

  const [formData, setFormData] = useState<YieldPredictionInput>({
    user_identifier: 'demo_farmer',
    acres: 3.0,
    growth_cycle: 125,
    sunlight_hours: 8.0,
    precipitation: 540,
    temperature: 26.5,
    soil_moisture: 70,
    soil_ph: 6.8,
    co2_concentration: 420,
    drought_days: 20,
    flood_days: 8,
    soil_type: 'काळी माती (Black Soil)',
    water_source: 'विहीर / बोरवेल (Irrigated)'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<YieldPredictionResult | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getModelInfo()
      .then((data) => setModelInfo(data))
      .catch((err) => console.warn('Model metadata fetch:', err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.predictYield(formData);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to predict cotton yield.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cotton-700 bg-cotton-50 px-3 py-1 rounded-full border border-cotton-200">
          <Sparkles className="w-3.5 h-3.5" />
          Trained Machine Learning Model • 80,000 Dataset Observations
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('yieldTitle', 'Cotton Yield Prediction Engine')}
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          {t('yieldSubtitle', 'Trained on 80,000 Agricultural Growing Observations (R² = 0.9788, MAE = 3.34 kg/acre)')}
        </p>
      </div>

      {/* Model Benchmark Card */}
      {modelInfo && (
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs uppercase font-bold text-cotton-400 tracking-wider">Active ML Model</span>
            <div className="text-base font-extrabold flex items-center gap-2">
              <span>{modelInfo.model_name}</span>
              <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60">
                Verified R² = {modelInfo.metrics.r2_score}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300">
            <div>
              <span className="text-slate-400">Mean Abs Error:</span>{' '}
              <strong className="text-white">{modelInfo.metrics.mae} kg/acre</strong>
            </div>
            <div>
              <span className="text-slate-400">Root Mean Sq Error:</span>{' '}
              <strong className="text-white">{modelInfo.metrics.rmse} kg/acre</strong>
            </div>
            <div>
              <span className="text-slate-400">Training Samples:</span>{' '}
              <strong className="text-white">{modelInfo.trained_on_rows.toLocaleString()} rows</strong>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Form on Left, Output & Charts on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form Inputs */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cotton-600" />
              {t('yieldFormHeader', 'Field Growth & Climatic Parameters')}
            </h2>
          </div>

          <form onSubmit={handlePredict} className="space-y-4">
            
            {/* Land Area & Growth Cycle */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('yieldPlotAcres', 'Farm Area (Acres)')}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  max="100"
                  name="acres"
                  value={formData.acres}
                  onChange={handleChange}
                  required
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cotton-500/20 focus:border-cotton-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('yieldGrowthCycle', 'Growth Cycle (Days)')}
                </label>
                <input
                  type="number"
                  step="1"
                  min="30"
                  max="220"
                  name="growth_cycle"
                  value={formData.growth_cycle}
                  onChange={handleChange}
                  required
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cotton-500/20 focus:border-cotton-500"
                />
              </div>
            </div>

            {/* Sunlight & Temperature */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('yieldSunlight', 'Daily Sunlight (Hours)')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="14"
                  name="sunlight_hours"
                  value={formData.sunlight_hours}
                  onChange={handleChange}
                  required
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cotton-500/20 focus:border-cotton-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('yieldTemperature', 'Average Temperature (°C)')}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="10"
                  max="48"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  required
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cotton-500/20 focus:border-cotton-500"
                />
              </div>
            </div>

            {/* Precipitation & Soil Moisture */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('yieldRainfall', 'Total Rainfall (mm)')}
                </label>
                <input
                  type="number"
                  step="10"
                  min="50"
                  max="1500"
                  name="precipitation"
                  value={formData.precipitation}
                  onChange={handleChange}
                  required
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cotton-500/20 focus:border-cotton-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('yieldSoilMoisture', 'Soil Moisture (%)')}
                </label>
                <input
                  type="number"
                  step="1"
                  min="10"
                  max="100"
                  name="soil_moisture"
                  value={formData.soil_moisture}
                  onChange={handleChange}
                  required
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cotton-500/20 focus:border-cotton-500"
                />
              </div>
            </div>

            {/* Soil pH & CO2 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('yieldSoilPh', 'Soil pH (4.0 - 9.5)')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="4"
                  max="9.5"
                  name="soil_ph"
                  value={formData.soil_ph}
                  onChange={handleChange}
                  required
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cotton-500/20 focus:border-cotton-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('yieldCo2', 'CO2 (ppm)')}
                </label>
                <input
                  type="number"
                  step="5"
                  min="350"
                  max="600"
                  name="co2_concentration"
                  value={formData.co2_concentration}
                  onChange={handleChange}
                  required
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cotton-500/20 focus:border-cotton-500"
                />
              </div>
            </div>

            {/* Drought & Flood Days */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('yieldDroughtDays', 'Drought Days')}
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="120"
                  name="drought_days"
                  value={formData.drought_days}
                  onChange={handleChange}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cotton-500/20 focus:border-cotton-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('yieldFloodDays', 'Flood Days')}
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="60"
                  name="flood_days"
                  value={formData.flood_days}
                  onChange={handleChange}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cotton-500/20 focus:border-cotton-500"
                />
              </div>
            </div>

            {/* Soil Type and Water Source */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('yieldSoilType', 'Soil Type')}</label>
              <select
                name="soil_type"
                value={formData.soil_type}
                onChange={handleChange}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cotton-500/20 focus:border-cotton-500 bg-white"
              >
                <option>काळी माती (Black Soil / Regur)</option>
                <option>मध्यम भारी माती (Medium Deep Loam)</option>
                <option>तांबडी / हलकी माती (Red / Sandy Loam)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('yieldWaterSource', 'Water / Irrigation Source')}</label>
              <select
                name="water_source"
                value={formData.water_source}
                onChange={handleChange}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cotton-500/20 focus:border-cotton-500 bg-white"
              >
                <option>विहीर / बोरवेल (Irrigated Well)</option>
                <option>ठिबक सिंचन (Drip Pipeline)</option>
                <option>कोरडवाहू / पावसावर अवलंबून (Rainfed)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cotton-600 hover:bg-cotton-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-cotton-600/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>{t('loading', 'Loading...')}</span>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  {t('yieldCalculateBtn', 'Calculate Harvest Forecast')}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results & Visualization Column */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 animate-fadeIn">
              
              {/* Highlight Harvest Output */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-cotton-900 to-slate-900 text-white shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-cotton-400 tracking-wider">
                    {t('yieldResultHeader', 'Harvest Prediction Result')}
                  </span>
                  <span className="text-xs font-semibold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {result.confidence_level}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="border-r border-white/10 pr-4">
                    <div className="text-3xl sm:text-4xl font-extrabold text-white">
                      {result.predicted_yield_per_acre_kg}{' '}
                      <span className="text-base font-normal text-slate-300">{t('kgPerAcre', 'kg/acre')}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{t('yieldPerAcreLabel', 'Predicted Yield / Acre')}</p>
                  </div>

                  <div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-cotton-300">
                      {result.total_predicted_yield_quintals}{' '}
                      <span className="text-base font-normal text-slate-300">{t('quintals', 'Quintals')}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {t('yieldTotalQuintals', 'Total Estimated Harvest')} ({formData.acres} {t('acres', 'acres')})
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Importance Recharts Chart */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-cotton-600" />
                  {t('yieldTopFactors', 'Key Growth Influencing Factors')}
                </h3>
                
                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={result.top_influencing_factors}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 0.6]} />
                      <YAxis dataKey="feature" type="category" tick={{ fontSize: 11, fill: '#475569' }} width={120} />
                      <Tooltip
                        formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Weight']}
                        contentStyle={{ borderRadius: 12, fontSize: 12 }}
                      />
                      <Bar dataKey="importance" fill="#3e954e" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Agronomic Advisory Generated by Rules */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {t('yieldAgronomicAdvisory', 'Agronomic Field Advisory')}
                </h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                  {result.agronomic_advisory}
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[11px] text-slate-600 italic bg-amber-50/60 p-3 rounded-lg border border-amber-200/60">
                ⚠️ {result.disclaimer}
              </p>

            </div>
          ) : (
            /* Empty State */
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-cotton-50 border border-cotton-200 text-cotton-600 flex items-center justify-center mx-auto">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-bold text-slate-900 text-base">{t('yieldTitle', 'Yield Prediction')}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('yieldSubtitle', 'Enter your farm acreage and environmental factors to calculate expected yield.')}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
