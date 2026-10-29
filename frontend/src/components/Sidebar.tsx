import React from 'react';
import {
  Home,
  LayoutDashboard,
  CloudRain,
  TrendingUp,
  UploadCloud,
  BarChart3,
  ScanLine,
  MessageSquare,
  Droplets,
  History,
  Info,
  Settings,
  X
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export type PageId =
  | 'landing'
  | 'dashboard'
  | 'weather'
  | 'yield'
  | 'datasets'
  | 'analytics'
  | 'disease'
  | 'assistant'
  | 'recommendations'
  | 'history'
  | 'about'
  | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItemDef {
  id: PageId;
  labelKey: string;
  defaultLabel: string;
  sublabelKey: string;
  defaultSublabel: string;
  icon: React.ElementType;
}

const navItems: NavItemDef[] = [
  {
    id: 'landing',
    labelKey: 'navWelcome',
    defaultLabel: 'Welcome & Overview',
    sublabelKey: 'navWelcomeSub',
    defaultSublabel: 'Project Introduction',
    icon: Home
  },
  {
    id: 'dashboard',
    labelKey: 'navDashboard',
    defaultLabel: 'Dashboard',
    sublabelKey: 'navDashboardSub',
    defaultSublabel: 'Live Weather & Farm Advisory',
    icon: LayoutDashboard
  },
  {
    id: 'weather',
    labelKey: 'navWeather',
    defaultLabel: 'Weather & Rain Alerts',
    sublabelKey: 'navWeatherSub',
    defaultSublabel: '7-Day Forecast & Timelines',
    icon: CloudRain
  },
  {
    id: 'yield',
    labelKey: 'navYield',
    defaultLabel: 'Yield Prediction',
    sublabelKey: 'navYieldSub',
    defaultSublabel: 'ML Regression Engine',
    icon: TrendingUp
  },
  {
    id: 'datasets',
    labelKey: 'navDatasets',
    defaultLabel: 'Dataset Ingestion',
    sublabelKey: 'navDatasetsSub',
    defaultSublabel: 'Upload, Validate, Preprocess',
    icon: UploadCloud
  },
  {
    id: 'analytics',
    labelKey: 'navAnalytics',
    defaultLabel: 'Agricultural Analytics',
    sublabelKey: 'navAnalyticsSub',
    defaultSublabel: 'Correlations & Visuals',
    icon: BarChart3
  },
  {
    id: 'disease',
    labelKey: 'navDisease',
    defaultLabel: 'Disease Diagnosis',
    sublabelKey: 'navDiseaseSub',
    defaultSublabel: 'Multimodal Leaf Inspection',
    icon: ScanLine
  },
  {
    id: 'assistant',
    labelKey: 'navAssistant',
    defaultLabel: 'Cotton AI Assistant',
    sublabelKey: 'navAssistantSub',
    defaultSublabel: 'Multilingual Voice & Chat',
    icon: MessageSquare
  },
  {
    id: 'recommendations',
    labelKey: 'navRecommendations',
    defaultLabel: 'Smart Recommendations',
    sublabelKey: 'navRecommendationsSub',
    defaultSublabel: 'Fertilizer & Irrigation',
    icon: Droplets
  },
  {
    id: 'history',
    labelKey: 'navHistory',
    defaultLabel: 'History & Archives',
    sublabelKey: 'navHistorySub',
    defaultSublabel: 'Past Scans & Predictions',
    icon: History
  },
  {
    id: 'about',
    labelKey: 'navAbout',
    defaultLabel: 'About Us',
    sublabelKey: 'navAboutSub',
    defaultSublabel: 'Mission, Technology & Team',
    icon: Info
  },
  {
    id: 'settings',
    labelKey: 'navSettings',
    defaultLabel: 'Profile & Settings',
    sublabelKey: 'navSettingsSub',
    defaultSublabel: 'Farmer & System Config',
    icon: Settings
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isOpenMobile,
  onCloseMobile
}) => {
  const { t } = useLanguage();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-20 h-screen w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Mobile header inside sidebar */}
        <div className="flex md:hidden items-center justify-between p-4 border-b border-slate-100">
          <span className="font-bold text-slate-800 text-sm">Navigation Menu</span>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section title */}
        <div className="px-5 pt-6 pb-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {t('navAgriculturalPlatform', 'Agricultural Platform')}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectPage(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-cotton-50 text-cotton-800 font-bold border border-cotton-200 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    isActive
                      ? 'bg-cotton-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs truncate">
                    {t(item.labelKey, item.defaultLabel)}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {t(item.sublabelKey, item.defaultSublabel)}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom Institutional Badge */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="text-[11px] font-bold text-slate-800 leading-tight">
            CottonCare AI
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            MIT Chhatrapati Sambhajinagar
          </div>
        </div>
      </aside>
    </>
  );
};
