import React from 'react';
import {
  TrendingUp,
  ScanLine,
  MessageSquare,
  UploadCloud,
  Droplets,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sprout,
  Users
} from 'lucide-react';
import { PageId } from '../components/Sidebar';
import { useLanguage } from '../i18n/LanguageContext';

interface LandingPageProps {
  onNavigate: (page: PageId) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cotton-800 via-cotton-900 to-slate-900 text-white p-8 sm:p-12 lg:p-16 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(#52b364_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
        
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-cotton-200 border border-white/15">
            <Sprout className="w-4 h-4 text-cotton-400" />
            {t('landingBadge', 'Academic AI Research for Indian Agriculture')}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
            {t('landingTitle', 'Increasing Yield of Cotton Plant Using AI')}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            {t('landingDescription', 'An end-to-end agro-technical platform combining Scikit-learn regression models, multimodal computer vision disease diagnostics, real-time Open-Meteo weather intelligence, and grounded voice assistance tailored for Indian cotton growers.')}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-2 bg-cotton-500 hover:bg-cotton-400 text-slate-950 font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-cotton-500/25 transition transform hover:-translate-y-0.5 text-sm cursor-pointer"
            >
              <Sprout className="w-4 h-4" />
              {t('landingEnterDashboard', 'Enter Farmer Dashboard')}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('yield')}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-5 py-3.5 rounded-xl border border-white/20 transition text-sm cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-cotton-400" />
              {t('landingExploreYield', 'Predict Cotton Yield')}
            </button>
            <button
              onClick={() => onNavigate('disease')}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-5 py-3.5 rounded-xl border border-white/20 transition text-sm cursor-pointer"
            >
              <ScanLine className="w-4 h-4 text-cotton-400" />
              {t('navDisease', 'Disease Diagnosis')}
            </button>
            <button
              onClick={() => onNavigate('assistant')}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-5 py-3.5 rounded-xl border border-white/20 transition text-sm cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-cotton-400" />
              {t('navAssistant', 'Cotton AI Assistant')}
            </button>
          </div>
        </div>

        {/* Highlight pill banner at bottom of hero */}
        <div className="relative z-10 mt-10 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-300">
          <div>
            <div className="text-lg sm:text-xl font-bold text-white">80,000+</div>
            <div className="text-slate-400">Agricultural Data Records</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-emerald-400">97.88%</div>
            <div className="text-slate-400">Random Forest R² Accuracy</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-white">3 Languages</div>
            <div className="text-slate-400">मराठी, हिंदी, English Voice</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-white">MIT Chh. Sambhajinagar</div>
            <div className="text-slate-400">B.Tech Engineering Project</div>
          </div>
        </div>
      </section>

      {/* Core Platform Modules */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('landingKeyCapabilities', 'Core Architectural Modules')}
          </h2>
          <p className="text-sm text-slate-600">
            {t('appSubtitle', 'Increasing Yield of Cotton Plant Using AI')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Yield */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-cotton-300 hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-xl bg-cotton-50 text-cotton-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {t('landingYieldTitle', 'High-Precision Yield Prediction')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {t('landingYieldDesc', 'RandomForestRegressor evaluated on 80,000 empirical observations achieving 97.88% R² score to forecast quintals per acre.')}
            </p>
            <button
              onClick={() => onNavigate('yield')}
              className="text-xs font-bold text-cotton-600 hover:text-cotton-700 inline-flex items-center gap-1 cursor-pointer"
            >
              {t('yieldCalculateBtn', 'Calculate Harvest Forecast')} →
            </button>
          </div>

          {/* Card 2: Disease */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-cotton-300 hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <ScanLine className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {t('landingDiseaseTitle', 'Multimodal Disease Diagnosis')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {t('landingDiseaseDesc', 'Visual leaf pathology diagnostics utilizing Google Gemini Multimodal Vision with two-stage validation and offline biological advice.')}
            </p>
            <button
              onClick={() => onNavigate('disease')}
              className="text-xs font-bold text-cotton-600 hover:text-cotton-700 inline-flex items-center gap-1 cursor-pointer"
            >
              {t('dashScanLeaf', 'Scan Leaf Sample')} →
            </button>
          </div>

          {/* Card 3: Weather */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-cotton-300 hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Droplets className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {t('landingWeatherTitle', 'Hyperlocal Weather & Rain Alerts')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {t('landingWeatherDesc', 'Open-Meteo integration delivering 24-hour precipitation probability timelines and automated push warnings for crop safety.')}
            </p>
            <button
              onClick={() => onNavigate('weather')}
              className="text-xs font-bold text-cotton-600 hover:text-cotton-700 inline-flex items-center gap-1 cursor-pointer"
            >
              {t('dashRainForecastLink', 'View 7-Day Forecast & Hourly Timeline →')}
            </button>
          </div>

          {/* Card 4: Assistant */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-cotton-300 hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {t('landingVoiceTitle', 'Multilingual Conversational AI')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {t('landingVoiceDesc', 'Agronomically grounded conversational assistant supporting Marathi, Hindi, and English voice synthesis and speech recognition.')}
            </p>
            <button
              onClick={() => onNavigate('assistant')}
              className="text-xs font-bold text-cotton-600 hover:text-cotton-700 inline-flex items-center gap-1 cursor-pointer"
            >
              {t('navAssistant', 'Cotton AI Assistant')} →
            </button>
          </div>

          {/* Card 5: Recommendations */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-cotton-300 hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {t('navRecommendations', 'Smart Recommendations')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {t('recsSubtitle', 'Stage-Wise Nutrient Schedules, Irrigation Frequency, and Pest Watch')}
            </p>
            <button
              onClick={() => onNavigate('recommendations')}
              className="text-xs font-bold text-cotton-600 hover:text-cotton-700 inline-flex items-center gap-1 cursor-pointer"
            >
              {t('navRecommendationsSub', 'Fertilizer & Irrigation')} →
            </button>
          </div>

          {/* Card 6: Analytics */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-cotton-300 hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              {t('navAnalytics', 'Agricultural Analytics')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {t('analyticsSubtitle', 'Statistical Distributions, Feature Correlations, and Model Coefficients')}
            </p>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs font-bold text-cotton-600 hover:text-cotton-700 inline-flex items-center gap-1 cursor-pointer"
            >
              {t('viewDetails', 'View Details')} →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
