import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  ShieldCheck,
  Server,
  Database,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Save,
  RefreshCw,
  Globe
} from 'lucide-react';
import { api } from '../services/api';
import { FarmerProfile, HealthStatus } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface SettingsProps {
  currentLanguage?: string;
  onLanguageChange?: (lang: string) => void;
  onProfileUpdated: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  onLanguageChange,
  onProfileUpdated
}) => {
  const { t, language, setLanguage } = useLanguage();
  const [profile, setProfile] = useState<FarmerProfile>({
    identifier: 'demo_farmer',
    name: 'शेतकरी मित्र',
    location: 'छत्रपती संभाजीनगर',
    contact_number: '+91 98765 43210',
    land_acres: 3.5
  });
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getProfile('demo_farmer')
      .then((data) => setProfile(data))
      .catch((e) => console.warn(e));

    api.getHealth()
      .then((data) => setHealth(data))
      .catch((e) => console.warn(e));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedSuccess(false);
    try {
      await api.updateProfile(profile, 'demo_farmer');
      setSavedSuccess(true);
      onProfileUpdated();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          <SettingsIcon className="w-3.5 h-3.5 text-cotton-600" />
          {t('settingsTitle')}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('settingsSubtitle')}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Profile Settings (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-cotton-600" />
              {t('settingsProfileHeader')}
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">Stored locally in SQLite</span>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('settingsName')}</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                required
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cotton-500/20 focus:border-cotton-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('settingsLocation')}</label>
                <input
                  type="text"
                  name="location"
                  value={profile.location}
                  onChange={handleChange}
                  required
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cotton-500/20 focus:border-cotton-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('settingsAcres')}</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  max="500"
                  name="land_acres"
                  value={profile.land_acres}
                  onChange={handleChange}
                  required
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cotton-500/20 focus:border-cotton-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('settingsPhone')}</label>
              <input
                type="text"
                name="contact_number"
                value={profile.contact_number || ''}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cotton-500/20 focus:border-cotton-500"
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {savedSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Farmer profile updated successfully!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-cotton-600 hover:bg-cotton-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md shadow-cotton-600/20 text-xs transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t('settingsSaveProfile')}
                </>
              )}
            </button>
          </form>
        </div>

        {/* System Diagnostics (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-cotton-600" />
              {t('settingsBackendHeader')}
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">FastAPI & AI Health</span>
          </div>

          <div className="space-y-3">
            {/* Database status */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-cotton-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800">SQLite Database</div>
                  <div className="text-[10px] text-slate-500">cottoncare.db (SQLAlchemy ORM)</div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Connected
              </span>
            </div>

            {/* ML Model status */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-cotton-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Yield Model (RandomForest)</div>
                  <div className="text-[10px] text-slate-500">cotton_yield_model.joblib</div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Loaded (97.88%)
              </span>
            </div>

            {/* Gemini AI Status */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-cotton-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Google Gemini AI</div>
                  <div className="text-[10px] text-slate-500">Models: gemini-3.8-flash, 3.6, 3.5</div>
                </div>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                  health?.ai_configured
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200'
                }`}
              >
                {health?.ai_configured ? 'Active Key' : 'Check .env'}
              </span>
            </div>

            {/* Offline CNN Model Status */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-slate-500" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Offline CNN Weights (.keras)</div>
                  <div className="text-[10px] text-slate-500">cotton_disease_model.keras</div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                Cloud Vision Active
              </span>
            </div>
          </div>

          {/* Language Preference Card */}
          <div className="p-4 rounded-xl bg-cotton-50/60 border border-cotton-200 space-y-2">
            <div className="text-xs font-bold text-cotton-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cotton-700" />
              {t('settingsLangHeader')}
            </div>
            <div className="flex gap-2">
              {([
                { id: 'en', label: 'English', legacyName: 'English' },
                { id: 'hi', label: 'हिंदी', legacyName: 'Hindi' },
                { id: 'mr', label: 'मराठी', legacyName: 'Marathi' }
              ] as const).map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setLanguage(l.id as any);
                    if (onLanguageChange) onLanguageChange(l.legacyName);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                    language === l.id
                      ? 'bg-cotton-700 text-white border-cotton-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
