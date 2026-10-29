import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Calendar,
  Sparkles,
  Layers,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { RecommendationResult } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

export const Recommendations: React.FC = () => {
  const { t, language } = useLanguage();
  const [cropDays, setCropDays] = useState(45);
  const [landAcres, setLandAcres] = useState(3.0);
  const [soilType, setSoilType] = useState('काळी माती (Black Soil)');
  const [waterSource, setWaterSource] = useState('विहीर / बोरवेल (Irrigated)');
  const [data, setData] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [weatherContext, setWeatherContext] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    // Attempt to load current weather context
    api.getWeatherForecast({ user_identifier: 'demo_farmer' })
      .then((w) => {
        const hourly = w.hourly_next24 || [];
        const daily = w.daily_forecast || [];
        const rain6h = Math.max(...hourly.slice(0, 6).map((h) => h.precip_prob || 0), 0);
        const rain24h = hourly.slice(0, 24).reduce((sum, h) => sum + (h.precipitation_mm || 0), 0);
        const rain7d = daily.reduce((sum, d) => sum + (d.precipitation_sum_mm || 0), 0);
        setWeatherContext({
          temperature_c: w.current.temperature,
          humidity_pct: w.current.humidity,
          wind_kmh: w.current.windspeed,
          rain_6h_probability_pct: rain6h,
          rain_24h_mm: rain24h,
          rain_7d_mm: rain7d,
          condition: w.current.condition
        });
      })
      .catch(() => {});
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.getRecommendations(cropDays, landAcres, soilType, waterSource, weatherContext || undefined);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [cropDays, landAcres, soilType, waterSource, weatherContext]);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          <Droplets className="w-3.5 h-3.5" />
          {t('recsTitle')}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('recsSubtitle')}
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          {language === 'mr' ? 'कापूस पिकाच्या अचूक वयानुसार (१ ते १८० दिवस) खत आणि पाण्याचे शास्त्रीय नियोजन.' : language === 'hi' ? 'कपास की फसल की सटीक आयु (१ से १८० दिन) के अनुसार खाद और पानी का वैज्ञानिक प्रबंधन।' : "Dynamic agronomic schedules calibrated to your cotton crop's exact age (1 to 180 days). Prevents excessive nitrogen burn and optimizes irrigation to conserve groundwater."}
        </p>
      </div>

      {/* Control Panel Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
          {t('recsGrowthStageHeader')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          
          {/* Days slider */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span>{language === 'mr' ? 'पेरणीनंतरचे दिवस:' : language === 'hi' ? 'बुवाई के बाद के दिन:' : 'Days Since Sowing:'}</span>
              <span className="text-cotton-700 bg-cotton-50 border border-cotton-200 px-2.5 py-0.5 rounded-lg text-sm font-black">
                {cropDays} {t('days')}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="180"
              value={cropDays}
              onChange={(e) => setCropDays(parseInt(e.target.value))}
              className="w-full accent-cotton-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>{language === 'mr' ? 'दिवस १ (उगवण)' : language === 'hi' ? 'दिन १ (अंकुरण)' : 'Day 1 (Emergence)'}</span>
              <span>{language === 'mr' ? 'दिवस ७५ (फुलोरा)' : language === 'hi' ? 'दिन ७५ (फूल आना)' : 'Day 75 (Flowering)'}</span>
              <span>{language === 'mr' ? 'दिवस १८० (काढणी)' : language === 'hi' ? 'दिन १८० (कटाई)' : 'Day 180 (Harvest)'}</span>
            </div>
          </div>

          {/* Land area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('yieldPlotAcres')}</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="100"
              value={landAcres}
              onChange={(e) => setLandAcres(parseFloat(e.target.value) || 1)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cotton-500/20 focus:border-cotton-500"
            />
          </div>

          {/* Soil category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('yieldSoilType')}</label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none"
            >
              <option value="काळी माती (Black Soil)">{language === 'mr' ? 'काळी माती (Black Soil)' : language === 'hi' ? 'काली मिट्टी (Black Soil)' : 'Black Soil'}</option>
              <option value="मध्यम भारी माती (Medium Deep)">{language === 'mr' ? 'मध्यम भारी माती (Medium Deep)' : language === 'hi' ? 'मध्यम भारी मिट्टी (Medium Deep)' : 'Medium Deep Soil'}</option>
              <option value="तांबडी / हलकी माती (Red / Light)">{language === 'mr' ? 'तांबडी / हलकी माती (Red / Light)' : language === 'hi' ? 'लाल / हल्की मिट्टी (Red / Light)' : 'Red / Light Soil'}</option>
            </select>
          </div>

        </div>
      </div>

      {data && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Stage Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-cotton-800 to-slate-900 text-white shadow-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-cotton-300 tracking-wider">
                {t('recsGrowthStageHeader')}
              </span>
              <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
                {cropDays} {t('days')}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">{data.growth_stage}</h3>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              {data.stage_description}
            </p>
          </div>

          {/* Fertilizer & Irrigation Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Fertilizer Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-cotton-600" />
                {t('recsFertilizerHeader')} ({landAcres} {t('acres')})
              </h3>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-cotton-50 p-3 rounded-xl border border-cotton-200">
                  <div className="text-xs text-slate-500 font-bold uppercase">Urea</div>
                  <div className="text-xl font-extrabold text-cotton-800 mt-1">
                    {data.fertilizer_schedule.urea_kg} kg
                  </div>
                </div>
                <div className="bg-sky-50 p-3 rounded-xl border border-sky-200">
                  <div className="text-xs text-slate-500 font-bold uppercase">DAP</div>
                  <div className="text-xl font-extrabold text-sky-800 mt-1">
                    {data.fertilizer_schedule.dap_kg} kg
                  </div>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <div className="text-xs text-slate-500 font-bold uppercase">Potash (MOP)</div>
                  <div className="text-xl font-extrabold text-amber-800 mt-1">
                    {data.fertilizer_schedule.potash_mop_kg} kg
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 leading-relaxed">
                <div>
                  <strong>🔬 {language === 'mr' ? 'सूक्ष्मअन्नद्रव्ये:' : language === 'hi' ? 'सूक्ष्म पोषक तत्व:' : 'Micronutrients:'}</strong> {data.fertilizer_schedule.micronutrients}
                </div>
                <div>
                  <strong>🌱 {language === 'mr' ? 'पद्धती:' : language === 'hi' ? 'विधि:' : 'Method:'}</strong> {data.fertilizer_schedule.application_method}
                </div>
              </div>
            </div>

            {/* Irrigation Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-600" />
                {t('recsIrrigationHeader')}
              </h3>

              <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-bold">{language === 'mr' ? 'शिफारस वारंवारता:' : language === 'hi' ? 'अनुशंसित अंतराल:' : 'Recommended Frequency:'}</span>
                  <span className="text-xs font-extrabold text-sky-900">{data.irrigation_schedule.frequency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-bold">{language === 'mr' ? 'पाण्याचे प्रमाण:' : language === 'hi' ? 'पानी की मात्रा:' : 'Water Volume:'}</span>
                  <span className="text-xs font-extrabold text-sky-900">{data.irrigation_schedule.volume_level}</span>
                </div>
                <div className="text-xs text-slate-600 pt-1 border-t border-sky-200">
                  {data.irrigation_schedule.soil_adaptation}
                </div>
              </div>

              <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                💧 <strong>{language === 'mr' ? 'सिंचन तंत्रज्ञान:' : language === 'hi' ? 'सिंचाई तकनीक:' : 'Technology Recommendation:'}</strong> {data.irrigation_schedule.method}
              </div>
            </div>

          </div>

          {/* Pest Watch & Precautions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Pest Watch */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                {t('recsPestHeader')}
              </h3>
              <div className="space-y-2">
                {data.pest_disease_watch.map((p, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <strong className="text-rose-900 block">{p.pest}</strong>
                    <span className="text-slate-600 mt-0.5 block">{p.action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Precautions */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {t('recsPrecautionsHeader')}
              </h3>
              <ul className="space-y-2">
                {data.expert_precautions.map((prec, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{prec}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
