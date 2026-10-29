import React from 'react';
import {
  GraduationCap,
  Users,
  Award,
  Layers,
  Database,
  Target,
  UserCheck,
  Cpu,
  BarChart2,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export const About: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cotton-700 bg-cotton-50 px-3 py-1 rounded-full border border-cotton-200">
          <GraduationCap className="w-3.5 h-3.5 text-cotton-600" />
          {t('aboutDegreeName', 'Bachelor of Technology (B.Tech) Capstone Engineering Project')}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('aboutTitle', 'About CottonCare AI')}
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          {t('aboutSubtitle', 'Smart Artificial Intelligence for Cotton Yield Enhancement and Crop Health')}
        </p>
      </div>

      {/* Purpose, Beneficiaries & Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Mission & Purpose */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cotton-50 text-cotton-700 flex items-center justify-center border border-cotton-200">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="text-base font-extrabold text-slate-900">
            {t('aboutMissionTitle', 'Project Mission & Purpose')}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('aboutMissionDesc', 'CottonCare AI is an advanced agricultural intelligence platform created to empower Indian cotton farmers with machine learning yield forecasts, automated foliar pathology diagnosis, hyperlocal weather hazard warnings, and multilingual voice assistance.')}
          </p>
        </div>

        {/* Target Beneficiaries */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200">
            <UserCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-extrabold text-slate-900">
            {t('aboutUsersTitle', 'Intended Beneficiaries')}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('aboutUsersDesc', 'Designed specifically for smallholder and commercial cotton growers in Vidarbha, Marathwada, and across India, as well as agricultural extension officers and agronomy researchers.')}
          </p>
        </div>

      </div>

      {/* Core Features & Technological Pillars */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cotton-600" />
          {t('aboutFeaturesTitle', 'Key Technological Pillars')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-cotton-600 text-white flex items-center justify-center font-bold text-xs">1</div>
            <strong className="block text-slate-900">{t('navYield', 'Yield Prediction')}</strong>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              RandomForestRegressor trained on 80,000 empirical observations with 97.88% R² score predicting quintals/acre.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs">2</div>
            <strong className="block text-slate-900">{t('navDisease', 'Disease Diagnosis')}</strong>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Google Gemini Multimodal Vision with two-stage validation and grounded biological advisory fallback.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">3</div>
            <strong className="block text-slate-900">{t('navWeather', 'Weather & Rain Alerts')}</strong>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Open-Meteo hyper-local 24h timeline and automated push notifications alerting farmers to rain and heat stress.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">4</div>
            <strong className="block text-slate-900">{t('navAssistant', 'Cotton AI Assistant')}</strong>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Conversational voice and chat companion providing grounded farming guidance in Marathi, Hindi, and English.
            </p>
          </div>
        </div>
      </div>

      {/* Research Methodology & Technical Architecture Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-cotton-600" />
          {t('aboutMethodologyTitle', 'Research Methodology & Technical Architecture')}
        </h2>

        {/* Dataset Provenance */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-3 leading-relaxed">
          <p>
            <strong>Empirical Training Dataset:</strong> 80,000 real agricultural growing observations extracted from <code>cotton_growth_cycle_data.csv</code>. Evaluates 9 numerical features against the target variable <code>Yield (kg/acre)</code>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-1">Baseline: Linear Regression</strong>
              <ul className="space-y-0.5 text-slate-600 text-[11px]">
                <li>Mean Absolute Error (MAE): 8.72 kg/acre</li>
                <li>Root Mean Squared Error (RMSE): 10.89 kg/acre</li>
                <li>R² Score: 0.8872 (88.7%)</li>
              </ul>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <strong className="text-cotton-700 block mb-1">Selected: Random Forest Regressor</strong>
              <ul className="space-y-0.5 text-slate-600 text-[11px]">
                <li>Mean Absolute Error (MAE): 3.34 kg/acre</li>
                <li>Root Mean Squared Error (RMSE): 4.72 kg/acre</li>
                <li>R² Score: 0.9788 (97.88%)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Credentials & Team Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-cotton-700 uppercase tracking-wider">
              {t('aboutInstitutionTitle', 'Institutional Affiliation')}
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
              {t('aboutInstitutionName', 'Maharashtra Institute of Technology (MIT)')}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {t('aboutDepartmentName', 'Department of Computer Science & Engineering, Chhatrapati Sambhajinagar, Maharashtra')}
            </p>
          </div>
        </div>

        {/* Project Team & Guide Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Authors */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-cotton-600" />
              {t('aboutAuthorsTitle', 'Project Development Team')}
            </h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/60">
                <span className="font-bold text-slate-800">Nilesh Suresh Sonawane</span>
                <span className="text-slate-500 font-mono text-[11px]">Roll No: BT31079</span>
              </li>
              <li className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/60">
                <span className="font-bold text-slate-800">Atul Raju Suradkar</span>
                <span className="text-slate-500 font-mono text-[11px]">Roll No: BT31081</span>
              </li>
              <li className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/60">
                <span className="font-bold text-slate-800">Dinesh Nagorao Thadke</span>
                <span className="text-slate-500 font-mono text-[11px]">Roll No: BT31087</span>
              </li>
            </ul>
          </div>

          {/* Guide */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              {t('aboutSupervisorTitle', 'Academic Guidance & Mentorship')}
            </h3>
            <div className="p-4 bg-white rounded-xl border border-slate-200/60 space-y-1.5">
              <div className="font-extrabold text-sm text-slate-900">Dr. Prachi Deshpande</div>
              <div className="text-xs text-slate-600 font-medium">Department of Computer Science and Engineering</div>
              <p className="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
                Provided academic direction, algorithm evaluation standards, dataset validation, and agricultural advisory review.
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
