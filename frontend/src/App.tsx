import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, PageId } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { WeatherPage } from './pages/WeatherPage';
import { YieldPrediction } from './pages/YieldPrediction';
import { DatasetUpload } from './pages/DatasetUpload';
import { Analytics } from './pages/Analytics';
import { DiseaseDetection } from './pages/DiseaseDetection';
import { AssistantChat } from './pages/AssistantChat';
import { Recommendations } from './pages/Recommendations';
import { History } from './pages/History';
import { About } from './pages/About';
import { Settings } from './pages/Settings';
import { AuthModal } from './components/AuthModal';
import { api } from './services/api';
import { HealthStatus, FarmerProfile } from './types';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('landing');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { language, t } = useLanguage();
  const { user } = useAuth();

  const refreshProfile = () => {
    const targetId = user?.identifier || 'demo_farmer';
    api.getProfile(targetId)
      .then((data) => setProfile(data))
      .catch((e) => console.warn('Profile fetch:', e));
  };

  useEffect(() => {
    api.getHealth()
      .then((h) => setHealth(h))
      .catch((e) => console.warn('Health check:', e));

    refreshProfile();
  }, [user?.identifier]);

  const renderActivePage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={(p) => setCurrentPage(p)} />;
      case 'dashboard':
        return (
          <Dashboard
            profile={user ? { ...profile, ...user } as FarmerProfile : profile}
            health={health}
            language={language}
            onNavigate={(p) => setCurrentPage(p)}
          />
        );
      case 'weather':
        return (
          <WeatherPage
            profile={user ? { ...profile, ...user } as FarmerProfile : profile}
            language={language}
          />
        );
      case 'yield':
        return <YieldPrediction />;
      case 'datasets':
        return <DatasetUpload />;
      case 'analytics':
        return <Analytics />;
      case 'disease':
        return <DiseaseDetection language={language} />;
      case 'assistant':
        return <AssistantChat currentLanguage={language} />;
      case 'recommendations':
        return <Recommendations />;
      case 'history':
        return <History />;
      case 'about':
        return <About />;
      case 'settings':
        return (
          <Settings
            currentLanguage={language}
            onLanguageChange={() => {}}
            onProfileUpdated={refreshProfile}
          />
        );
      default:
        return <LandingPage onNavigate={(p) => setCurrentPage(p)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-cotton-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        health={health}
        profile={user ? { ...profile, ...user } as FarmerProfile : profile}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      {/* Main Body Layout (Sidebar + Content) */}
      <div className="flex-1 flex w-full">
        <Sidebar
          currentPage={currentPage}
          onSelectPage={(p) => setCurrentPage(p)}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
          {renderActivePage()}
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CottonCare AI • {t('appSubtitle', 'Increasing Yield of Cotton Plant Using AI')}</span>
          <span>MIT Chhatrapati Sambhajinagar • Department of CSE</span>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
