import React from 'react';
import { Sprout, Globe, User, ShieldCheck, LogIn, LogOut } from 'lucide-react';
import { HealthStatus, FarmerProfile } from '../types';
import { useLanguage, AppLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  health: HealthStatus | null;
  profile: FarmerProfile | null;
  onOpenMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  profile,
  onOpenMobileMenu
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout, setAuthModalOpen, setAuthMode } = useAuth();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as AppLanguage);
  };

  const displayName = user?.name || profile?.name || t('farmerFriend', 'Farmer Friend');
  const displayLocation = user?.location || profile?.location || 'छत्रपती संभाजीनगर';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Mobile menu button & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cotton-700 to-cotton-500 flex items-center justify-center text-white shadow-md shadow-cotton-500/20">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  CottonCare <span className="text-cotton-600">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-cotton-700 bg-cotton-50 px-2 py-0.5 rounded-full border border-cotton-200">
                  <ShieldCheck className="w-3 h-3 text-cotton-600" /> {t('researchEdition', 'Research & Farm Edition')}
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-600 font-medium -mt-0.5">
                {t('appSubtitle', 'Increasing Yield of Cotton Plant Using AI')}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Language selector & Profile/Auth Badge */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 hover:bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium transition">
            <Globe className="w-3.5 h-3.5 text-cotton-600 shrink-0" />
            <select
              value={language}
              onChange={handleLanguageChange}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer text-xs"
              aria-label="Select Language"
            >
              <option value="en">English</option>
              <option value="mr">मराठी (Marathi)</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </div>

          {/* System Health Indicator */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <span
              className={`w-2 h-2 rounded-full ${
                health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-slate-600 font-semibold">
              {health?.model_loaded ? 'ML Engine Online' : 'Connecting ML...'}
            </span>
          </div>

          {/* Authentication & Profile Control */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-cotton-50 border border-cotton-200/90 px-3 py-1.5 rounded-xl text-xs font-semibold text-cotton-900 shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-cotton-600 text-white flex items-center justify-center font-bold text-[11px]">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="truncate max-w-[120px] font-bold text-slate-800">
                    {displayName}
                  </div>
                  <div className="text-[10px] text-cotton-700 font-medium">
                    {displayLocation.split(' ')[0]}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                title={t('logout', 'Sign Out')}
                className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition cursor-pointer"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthMode('login');
                setAuthModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 bg-cotton-600 hover:bg-cotton-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-md shadow-cotton-600/20 transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t('login', 'Sign In')}</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
