import React, { useState, useEffect } from 'react';
import {
  Thermometer,
  Wind,
  Droplets,
  Sun,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ScanLine,
  MessageSquare,
  ShieldAlert,
  PhoneCall,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  History,
  CloudRain
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { FarmerProfile, HealthStatus, ModelInfo, HistoryData, WeatherData } from '../types';
import { PageId } from '../components/Sidebar';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

interface DashboardProps {
  profile: FarmerProfile | null;
  health: HealthStatus | null;
  language: string;
  onNavigate: (page: PageId) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  health,
  language,
  onNavigate
}) => {
  const { t } = useLanguage();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weather, setWeather] = useState({
    temp: 28.5,
    wind: 12.0,
    humidity: 55,
    status: 'Clear / Sunny',
    advice: 'Weather conditions are favorable for crop inspection and balanced foliar spray.',
    hasAlert: false,
    alertMsg: '',
    locationName: 'छत्रपती संभाजीनगर'
  });
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [history, setHistory] = useState<HistoryData | null>(null);

  useEffect(() => {
    // Fetch live weather from CottonCare backend service
    api.getWeatherForecast({
      latitude: profile?.latitude,
      longitude: profile?.longitude,
      location_name: profile?.location_name || profile?.location,
      user_identifier: profile?.identifier || 'demo_farmer'
    })
      .then((data) => {
        setWeatherData(data);
        const currentT = data.current.temperature ?? 28.0;
        const currentW = data.current.windspeed ?? 12.0;
        const currentH = data.current.humidity ?? 55;
        const topAlert = data.active_alerts?.[0];
        setWeather({
          temp: currentT,
          wind: currentW,
          humidity: currentH,
          status: data.current.condition || (currentT > 30 ? 'Warm & Sunny' : 'Pleasant / Clear'),
          advice: data.advisory_summary,
          hasAlert: Boolean(topAlert),
          alertMsg: topAlert ? (language === 'मराठी' && topAlert.message_mr ? topAlert.message_mr : topAlert.message_en) : '',
          locationName: data.location_name
        });
      })
      .catch(() => {});

    // Fetch live model info and recent history
    api.getModelInfo().then(setModelInfo).catch(() => {});
    api.getHistory(profile?.identifier || 'demo_farmer', 'all').then(setHistory).catch(() => {});
  }, [language, profile?.identifier, profile?.latitude, profile?.longitude]);

  const latestYield = history?.yield_predictions?.[0];
  const latestScan = history?.disease_scans?.[0];

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Welcome Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-cotton-700 bg-cotton-50 px-3 py-1 rounded-full border border-cotton-200">
            <MapPin className="w-3.5 h-3.5" />
            {profile?.location || 'छत्रपती संभाजीनगर, महाराष्ट्र'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('dashGreeting', 'Welcome,')}{' '}
            <span className="text-cotton-700">{profile?.name || t('farmerFriend', 'Farmer Friend')}</span> 👋
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            {t('dashSubtitle', 'Real-time agro-meteorology, ML-driven cotton yield forecasting, and immediate crop protection advisories.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('disease')}
            className="inline-flex items-center gap-2 bg-cotton-600 hover:bg-cotton-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-cotton-600/20 text-xs transition cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            {t('dashScanLeaf', 'Scan Leaf Sample')}
          </button>
          <button
            onClick={() => onNavigate('yield')}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition border border-slate-300 cursor-pointer"
          >
            <TrendingUp className="w-4 h-4 text-cotton-600" />
            {t('dashPredictYield', 'Predict Yield')}
          </button>
        </div>
      </div>

      {/* Weather Alert if any */}
      {weather.hasAlert && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex items-center justify-between gap-3 text-amber-900 text-sm font-semibold shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{weather.alertMsg}</span>
          </div>
          <button
            onClick={() => onNavigate('weather')}
            className="shrink-0 text-xs font-bold text-cotton-700 bg-white hover:bg-cotton-50 px-3 py-1.5 rounded-lg border border-amber-200 transition cursor-pointer"
          >
            {t('dashRainForecastLink', 'View Weather Alert →')}
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title={t('dashTemp', 'Ambient Temperature')}
          value={`${weather.temp} °C`}
          subtitle={`Location: ${profile?.location?.split(' ')[0] || 'Sambhajinagar'}`}
          icon={Thermometer}
          colorScheme="amber"
          trend="Optimal Range (22-32°C)"
          trendPositive={weather.temp >= 20 && weather.temp <= 34}
        />
        <MetricCard
          title={t('dashWind', 'Wind Velocity')}
          value={`${weather.wind} km/h`}
          subtitle="Spray drift threshold < 18 km/h"
          icon={Wind}
          colorScheme="blue"
          trend="Calm Conditions"
          trendPositive={weather.wind < 18}
        />
        <MetricCard
          title={t('yieldPlotAcres', 'Registered Farm Area')}
          value={`${profile?.land_acres || 2.0} ${t('acres', 'Acres')}`}
          subtitle="Cotton plot"
          icon={Droplets}
          colorScheme="green"
        />
        <MetricCard
          title="ML Engine Accuracy"
          value={modelInfo ? `${(modelInfo.metrics.r2_score * 100).toFixed(1)}% R²` : '97.88% R²'}
          subtitle={modelInfo?.model_name || 'Random Forest Regressor'}
          icon={TrendingUp}
          colorScheme="slate"
          trend={modelInfo ? `MAE: ${modelInfo.metrics.mae} kg/acre` : 'MAE: 3.34 kg/acre'}
          trendPositive={true}
        />
      </div>

      {/* Quick Tools Grid */}
      <div className="space-y-4">
        <h2 className="font-extrabold text-slate-900 text-base">
          {t('dashQuickTools', 'Smart Farming Modules')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('yield')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-cotton-300 hover:shadow-md transition cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-cotton-50 text-cotton-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">{t('dashToolYield', 'Yield Forecast')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{t('dashToolYieldDesc', 'Predict harvest quintals based on agro-climatic inputs.')}</p>
          </div>

          <div
            onClick={() => onNavigate('disease')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-cotton-300 hover:shadow-md transition cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <ScanLine className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">{t('dashToolDisease', 'Leaf Disease Scan')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{t('dashToolDiseaseDesc', 'Upload a leaf photo for instant condition detection.')}</p>
          </div>

          <div
            onClick={() => onNavigate('assistant')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-cotton-300 hover:shadow-md transition cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">{t('dashToolAssistant', 'AI Krishi Mitra')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{t('dashToolAssistantDesc', 'Ask farming questions in Marathi, Hindi, or English.')}</p>
          </div>

          <div
            onClick={() => onNavigate('recommendations')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-cotton-300 hover:shadow-md transition cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Droplets className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">{t('dashToolRecs', 'Fertilizer & Water')}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{t('dashToolRecsDesc', 'Stage-wise nutrient schedules and drip irrigation advice.')}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity / Farm Status */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cotton-600" />
            <h2 className="font-extrabold text-slate-900 text-base">
              {t('dashRecentInferences', 'Recent Farm Inferences')}
            </h2>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-bold text-cotton-700 hover:text-cotton-800 flex items-center gap-1 cursor-pointer"
          >
            {t('dashViewHistory', 'View History Archive →')}
          </button>
        </div>

        {latestYield || latestScan ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {latestYield ? (
              <div className="p-4 rounded-xl bg-cotton-50/60 border border-cotton-200 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-cotton-700 tracking-wider">
                    {t('dashLatestYield', 'Latest Harvest Prediction')}
                  </span>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    {latestYield.predicted_yield_per_acre} {t('kgPerAcre', 'kg/acre')}
                    <span className="text-xs font-semibold text-slate-500 ml-2">({latestYield.total_predicted_yield_quintals} {t('quintals', 'quintals')})</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">Plot: {latestYield.acres} {t('acres', 'Acres')} • {t('yieldGrowthCycle', 'Cycle')}: {latestYield.growth_cycle} {t('days', 'Days')}</div>
                </div>
                <span className="text-[11px] font-medium text-slate-400">{latestYield.created_at}</span>
              </div>
            ) : null}

            {latestScan ? (
              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-rose-700 tracking-wider">
                    {t('dashLatestScan', 'Latest Leaf Pathology Scan')}
                  </span>
                  <div className="text-base font-black text-slate-900 mt-1">
                    {latestScan.condition_detected}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">{t('diseaseSeverity', 'Severity')}: {latestScan.severity_level} • Conf: {(latestScan.confidence_score * 100).toFixed(0)}%</div>
                </div>
                <span className="text-[11px] font-medium text-slate-400">{latestScan.created_at}</span>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
            <p className="text-xs font-medium text-slate-500">{t('dashNoDataYet', 'No inferences recorded yet. Run a yield prediction or leaf scan to view analytics.')}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => onNavigate('yield')}
                className="text-xs font-bold text-cotton-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 shadow-2xs cursor-pointer"
              >
                + {t('dashPredictYield', 'Predict Yield')}
              </button>
              <button
                onClick={() => onNavigate('disease')}
                className="text-xs font-bold text-rose-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 shadow-2xs cursor-pointer"
              >
                + {t('dashScanLeaf', 'Scan Leaf Sample')}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
