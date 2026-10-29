import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Sun,
  Wind,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Bell,
  MapPin,
  Compass,
  Calendar,
  Clock,
  ShieldAlert,
  Thermometer,
  Settings as SettingsIcon,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { WeatherData, WeatherAlert, NotificationPrefs, LocationOption, FarmerProfile } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface WeatherPageProps {
  profile: FarmerProfile | null;
  language?: string;
}

export const WeatherPage: React.FC<WeatherPageProps> = ({ profile }) => {
  const { t, language } = useLanguage();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPrefsModal, setShowPrefsModal] = useState(false);

  // Load locations, preferences, and forecast
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [locs, prf] = await Promise.all([
        api.getWeatherLocations(),
        api.getNotificationPrefs(profile?.identifier || 'demo_farmer')
      ]);
      setLocations(locs);
      setPrefs(prf);

      // Default location: match profile or first location
      let initialLoc = locs[0];
      if (profile?.latitude && profile?.longitude) {
        initialLoc = {
          name: profile.location_name || profile.location || locs[0].name,
          state: 'Maharashtra',
          latitude: profile.latitude,
          longitude: profile.longitude
        };
      }
      setSelectedLocation(initialLoc);
      await fetchForecastForLocation(initialLoc.latitude, initialLoc.longitude, initialLoc.name);
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Failed to load weather data: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchForecastForLocation = async (lat: number, lon: number, name: string) => {
    setRefreshing(true);
    try {
      const data = await api.getWeatherForecast({
        latitude: lat,
        longitude: lon,
        location_name: name,
        user_identifier: profile?.identifier || 'demo_farmer'
      });
      setWeather(data);
      const userAlerts = await api.getWeatherAlerts(profile?.identifier || 'demo_farmer');
      setAlerts(userAlerts);
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Error fetching forecast: ' + err.message });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locName = e.target.value;
    const found = locations.find((l) => l.name === locName);
    if (found) {
      setSelectedLocation(found);
      fetchForecastForLocation(found.latitude, found.longitude, found.name);
      // Also update farmer profile location in background
      api.updateProfile({
        location_name: found.name,
        location: found.name.split(' (')[0],
        latitude: found.latitude,
        longitude: found.longitude
      }, profile?.identifier || 'demo_farmer').catch(() => {});
    }
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setMsg({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const gpsLoc: LocationOption = {
          name: `GPS Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
          state: 'Current GPS',
          latitude: lat,
          longitude: lon
        };
        setSelectedLocation(gpsLoc);
        fetchForecastForLocation(lat, lon, gpsLoc.name);
        setMsg({ type: 'success', text: `Using GPS coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}` });
      },
      (err) => {
        setGpsLoading(false);
        setMsg({ type: 'error', text: 'GPS permission denied or unavailable: ' + err.message });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.markAlertRead(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllAlertsRead(profile?.identifier || 'demo_farmer');
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePref = async (key: keyof NotificationPrefs) => {
    if (!prefs) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    try {
      await api.updateNotificationPrefs({ [key]: updated[key] }, profile?.identifier || 'demo_farmer');
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestBrowserAlert = () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification('🌾 CottonCare AI Rain Advisory', {
          body: 'हवामान सूचना: पुढील २४ तासांत शेतातील पाण्याचा निचरा तपासा व फवारणीचे नियोजन करा.',
          icon: '/favicon.ico'
        });
        setMsg({ type: 'success', text: 'Browser notification triggered successfully!' });
      } else {
        setMsg({ type: 'error', text: 'Browser notification permission was not granted.' });
      }
    });
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-cotton-50 text-cotton-700 rounded-xl">
              <CloudRain className="w-5 h-5 text-cotton-600" />
            </span>
            <h1 className="text-xl font-black text-slate-800">
              {t('weatherTitle')}
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {t('weatherSubtitle')}
          </p>
        </div>

        {/* Location selector and actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={selectedLocation?.name || ''}
              onChange={handleLocationChange}
              className="pl-8 pr-4 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-cotton-500"
            >
              {locations.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name} ({loc.state})
                </option>
              ))}
            </select>
            <MapPin className="w-4 h-4 text-slate-600 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          <button
            onClick={handleUseGPS}
            disabled={gpsLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition"
            title="Detect GPS location"
          >
            <Compass className={`w-3.5 h-3.5 text-cotton-600 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>GPS</span>
          </button>

          <button
            onClick={() => selectedLocation && fetchForecastForLocation(selectedLocation.latitude, selectedLocation.longitude, selectedLocation.name)}
            disabled={refreshing}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200"
            title="Refresh weather"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowPrefsModal(!showPrefsModal)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-slate-600" />
            <span>{language === 'mr' ? 'सूचना सेटिंग्ज' : language === 'hi' ? 'अलर्ट सेटिंग्स' : 'Alert Settings'}</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {msg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-slate-600 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Advisory Banner */}
      {weather && (
        <div className="bg-gradient-to-r from-cotton-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold bg-cotton-500/30 text-cotton-300 px-2 py-0.5 rounded-full border border-cotton-400/20">
                  {t('weatherAdvisoryBadge')}
                </span>
                <span className="text-xs text-slate-300">
                  {weather.location_name}
                </span>
              </div>
              <p className="text-sm font-semibold mt-2 leading-relaxed max-w-2xl text-cotton-100">
                {weather.advisory_summary}
              </p>
            </div>
            <button
              onClick={handleTestBrowserAlert}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition"
            >
              <Bell className="w-3.5 h-3.5 text-cotton-300" />
              <span>{t('weatherTestingAlert')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Current Conditions Card Grid */}
      {weather && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-600 text-[11px] font-bold">
              <span>{t('weatherTempLabel')}</span>
              <Thermometer className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-800 mt-2">
              {weather.current.temperature !== undefined ? `${weather.current.temperature}°C` : '--'}
            </div>
            <div className="text-[10px] text-slate-600 mt-1">
              {t('weatherFeelsLike')} {weather.current.apparent_temperature ?? weather.current.temperature}°C
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-600 text-[11px] font-bold">
              <span>{t('weatherHumidityLabel')}</span>
              <Droplets className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-800 mt-2">
              {weather.current.humidity !== undefined ? `${weather.current.humidity}%` : '--'}
            </div>
            <div className="text-[10px] text-slate-600 mt-1">
              {(weather.current.humidity || 0) > 80 ? (language === 'mr' ? 'बुरशीचा धोका अधिक' : language === 'hi' ? 'फंगल जोखिम अधिक' : 'High fungal risk') : (language === 'mr' ? 'अनुकूल आर्द्रता' : language === 'hi' ? 'अनुकूल आर्द्रता' : 'Optimal range')}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-600 text-[11px] font-bold">
              <span>{t('weatherWindLabel')}</span>
              <Wind className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-2xl font-black text-slate-800 mt-2">
              {weather.current.windspeed !== undefined ? `${weather.current.windspeed} km/h` : '--'}
            </div>
            <div className="text-[10px] text-slate-600 mt-1">
              {(weather.current.windspeed || 0) > 20 ? (language === 'mr' ? 'फवारणी टाळा' : language === 'hi' ? 'छिड़काव टालें' : 'Avoid spray') : (language === 'mr' ? 'फवारणीस सुरक्षित' : language === 'hi' ? 'छिड़काव सुरक्षित' : 'Safe to spray')}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-600 text-[11px] font-bold">
              <span>{t('weatherPrecipitation')}</span>
              <CloudRain className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-800 mt-2">
              {weather.current.precipitation ?? 0} mm
            </div>
            <div className="text-[10px] text-slate-600 mt-1">
              {language === 'mr' ? 'मागील १ तासाची नोंद' : language === 'hi' ? 'पिछले १ घंटे का रिकॉर्ड' : 'Past 1-hr observation'}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-600 text-[11px] font-bold">
              <span>{t('dashCondition')}</span>
              <Sun className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-sm font-black text-slate-800 mt-3 truncate" title={weather.current.condition}>
              {weather.current.condition || (language === 'mr' ? 'निरभ्र' : language === 'hi' ? 'साफ मौसम' : 'Clear')}
            </div>
            <div className="text-[10px] text-slate-600 mt-1">
              WMO Code {weather.current.weathercode}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-600 text-[11px] font-bold">
              <span>{t('weatherActiveAlerts')}</span>
              <ShieldAlert className="w-4 h-4 text-cotton-600" />
            </div>
            <div className="text-2xl font-black text-slate-800 mt-2">
              {unreadCount}
            </div>
            <div className="text-[10px] text-slate-600 mt-1">
              {unreadCount > 0 ? (language === 'mr' ? 'कारवाई आवश्यक' : language === 'hi' ? 'कार्रवाई आवश्यक' : 'Action required') : (language === 'mr' ? 'सर्व सुरळीत' : language === 'hi' ? 'सब सुरक्षित' : 'All clear')}
            </div>
          </div>
        </div>
      )}

      {/* Weather Alert Center */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-black text-slate-800">{t('weatherActiveAlerts')}</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-extrabold bg-amber-100 text-amber-800 rounded-full">
                {unreadCount} {language === 'mr' ? 'नवीन' : language === 'hi' ? 'नए' : 'new'}
              </span>
            )}
          </div>
          {alerts.length > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-cotton-600 hover:text-cotton-700"
            >
              {language === 'mr' ? 'सर्व वाचले म्हणून खूण करा' : language === 'hi' ? 'सभी को पढ़ा हुआ चिह्नित करें' : 'Mark all as read'}
            </button>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">{t('weatherNoAlerts')}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {language === 'mr' ? 'हवामान अनुकूल आहे. बॅकग्राउंड मॉनिटर दर ३० मिनिटांनी तपासतो.' : language === 'hi' ? 'मौसम अनुकूल है। बैकग्राउंड मॉनिटर हर ३० मिनट में जांच करता है।' : 'Conditions are favorable. Background monitor runs every 30 minutes.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className={`p-4 rounded-xl border transition ${
                  a.severity === 'danger'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : a.severity === 'warning'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-blue-50/70 border-blue-200 text-blue-950'
                } ${a.is_read ? 'opacity-60' : 'shadow-xs'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          a.severity === 'danger'
                            ? 'bg-rose-200 text-rose-900'
                            : a.severity === 'warning'
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-blue-200 text-blue-900'
                        }`}
                      >
                        {a.alert_type}
                      </span>
                      <span className="text-xs font-extrabold">{a.title_en}</span>
                      {a.expected_time && (
                        <span className="text-[10px] text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {a.expected_time}
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-slate-700">
                      {language === 'mr' && a.message_mr ? a.message_mr : a.message_en}
                    </p>
                    {language !== 'mr' && a.message_mr && (
                      <p className="text-xs leading-relaxed text-slate-600 font-medium">
                        मराठी: {a.message_mr}
                      </p>
                    )}
                  </div>
                  {!a.is_read && (
                    <button
                      onClick={() => handleMarkRead(a.id)}
                      className="shrink-0 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
                    >
                      {language === 'mr' ? 'काढून टाका' : language === 'hi' ? 'हटाएं' : 'Dismiss'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hourly Rain Probability Timeline (Next 24 Hours) */}
      {weather && weather.hourly_next24 && weather.hourly_next24.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-black text-slate-800">{t('weatherHourlyTimeline')}</h2>
              <p className="text-xs text-slate-600">{t('weatherHourlySub')}</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-emerald-600"><span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm"></span> &lt;30% ({language === 'mr' ? 'कमी' : language === 'hi' ? 'कम' : 'Low'})</span>
              <span className="flex items-center gap-1 text-amber-600"><span className="w-2.5 h-2.5 bg-amber-400 rounded-sm"></span> 30-60% ({language === 'mr' ? 'मध्यम' : language === 'hi' ? 'मध्यम' : 'Moderate'})</span>
              <span className="flex items-center gap-1 text-rose-600"><span className="w-2.5 h-2.5 bg-rose-500 rounded-sm"></span> &gt;60% ({language === 'mr' ? 'जास्त - फवारणी टाळा' : language === 'hi' ? 'अधिक - छिड़काव टालें' : 'High - Postpone Spray'})</span>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar">
            {weather.hourly_next24.map((hour, idx) => {
              const hourLabel = hour.time.split('T')[1] || hour.time;
              const prob = hour.precip_prob || 0;
              const barColor =
                prob >= 60 ? 'bg-rose-500' : prob >= 30 ? 'bg-amber-400' : 'bg-emerald-400';
              return (
                <div key={idx} className="flex-shrink-0 w-14 text-center">
                  <div className="text-[10px] font-bold text-slate-600 mb-1">{hourLabel}</div>
                  <div className="h-20 bg-slate-100 rounded-lg flex flex-col justify-end p-1 border border-slate-200/60">
                    <div
                      className={`w-full rounded-md transition-all ${barColor}`}
                      style={{ height: `${Math.max(10, prob)}%` }}
                    />
                  </div>
                  <div className="text-[10px] font-black text-slate-800 mt-1">{prob}%</div>
                  <div className="text-[9px] text-slate-600">{hour.temperature ?? '--'}°C</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7-Day Daily Forecast Grid */}
      {weather && weather.daily_forecast && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-cotton-600" />
            <h2 className="text-base font-black text-slate-800">{t('weather7DayOutlook')}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {weather.daily_forecast.map((day, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-center flex flex-col justify-between ${
                  idx === 0
                    ? 'bg-cotton-50/60 border-cotton-200 ring-2 ring-cotton-500/20'
                    : 'bg-slate-50/70 border-slate-200/80'
                }`}
              >
                <div>
                  <div className="text-xs font-black text-slate-800">
                    {idx === 0 ? t('today') : new Date(day.date).toLocaleDateString(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-600 mt-0.5 truncate" title={day.condition}>
                    {day.condition}
                  </div>
                </div>

                <div className="my-3">
                  <div className="text-lg font-black text-slate-800">
                    {day.temp_max !== undefined ? `${day.temp_max}°` : '--'}
                    <span className="text-xs font-medium text-slate-600 ml-1">
                      / {day.temp_min !== undefined ? `${day.temp_min}°` : '--'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-[10px] font-bold">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{language === 'mr' ? 'पावसाची शक्यता:' : language === 'hi' ? 'बारिश की संभावना:' : 'Rain Prob:'}</span>
                    <span className={day.precipitation_probability_max >= 50 ? 'text-rose-600' : 'text-slate-700'}>
                      {day.precipitation_probability_max}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{language === 'mr' ? 'पावसाचे प्रमाण:' : language === 'hi' ? 'बारिश की मात्रा:' : 'Rain Vol:'}</span>
                    <span className="text-slate-700">{day.precipitation_sum_mm.toFixed(1)} mm</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{language === 'mr' ? 'कमाल वारा:' : language === 'hi' ? 'अधिकतम हवा:' : 'Wind Max:'}</span>
                    <span className="text-slate-700">{day.wind_max_kmh.toFixed(0)} km/h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preferences Modal / Card */}
      {showPrefsModal && prefs && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-slate-800">Notification & Alert Preferences</h3>
            <button
              onClick={() => setShowPrefsModal(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.rain_alerts}
                onChange={() => handleTogglePref('rain_alerts')}
                className="w-4 h-4 text-cotton-600 rounded"
              />
              <div>
                <div className="text-xs font-bold text-slate-800">Rain Alerts</div>
                <div className="text-[10px] text-slate-600">Trigger on &gt;60% 6h rain chance</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.heavy_rain_alerts}
                onChange={() => handleTogglePref('heavy_rain_alerts')}
                className="w-4 h-4 text-cotton-600 rounded"
              />
              <div>
                <div className="text-xs font-bold text-slate-800">Heavy Rain Alerts</div>
                <div className="text-[10px] text-slate-600">Trigger on &gt;15 mm 24h total</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.wind_alerts}
                onChange={() => handleTogglePref('wind_alerts')}
                className="w-4 h-4 text-cotton-600 rounded"
              />
              <div>
                <div className="text-xs font-bold text-slate-800">High Wind Alerts</div>
                <div className="text-[10px] text-slate-600">Trigger on &gt;25 km/h wind</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.heat_alerts}
                onChange={() => handleTogglePref('heat_alerts')}
                className="w-4 h-4 text-cotton-600 rounded"
              />
              <div>
                <div className="text-xs font-bold text-slate-800">Heat Stress Alerts</div>
                <div className="text-[10px] text-slate-600">Trigger on &gt;38°C temp</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.dry_spell_alerts}
                onChange={() => handleTogglePref('dry_spell_alerts')}
                className="w-4 h-4 text-cotton-600 rounded"
              />
              <div>
                <div className="text-xs font-bold text-slate-800">Dry Spell Warnings</div>
                <div className="text-[10px] text-slate-600">Trigger on &lt;1 mm 7-day rain</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.humidity_alerts}
                onChange={() => handleTogglePref('humidity_alerts')}
                className="w-4 h-4 text-cotton-600 rounded"
              />
              <div>
                <div className="text-xs font-bold text-slate-800">High Humidity (Disease)</div>
                <div className="text-[10px] text-slate-600">Trigger on prolonged &gt;85% RH</div>
              </div>
            </label>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Quiet Hours: {prefs.quiet_hours_start}:00 to 0{prefs.quiet_hours_end}:00 IST</span>
            <span>Alerts deduplicated automatically (6-hour cooldown window)</span>
          </div>
        </div>
      )}

      {/* Scientific disclaimer */}
      <div className="text-[11px] text-slate-600 bg-slate-100 p-4 rounded-xl leading-relaxed">
        <strong>⚠️ {t('weatherDisclaimer')}</strong>
      </div>
    </div>
  );
};
