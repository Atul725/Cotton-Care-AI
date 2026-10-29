import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  CloudRain,
  Sun,
  Wind,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Bell,
  MapPin,
  Calendar,
  Clock,
  RefreshCw,
  Thermometer,
} from 'lucide-react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { mobileApi } from '../services/api';
import { WeatherData, WeatherAlert, LocationOption } from '../types';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';

export const WeatherScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [selectedLoc, setSelectedLoc] = useState<LocationOption>({
    name: 'छत्रपती संभाजीनगर (Chh. Sambhajinagar)',
    state: 'Maharashtra',
    latitude: 19.8762,
    longitude: 75.3433,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLocationList, setShowLocationList] = useState(false);

  const loadWeather = async (loc?: LocationOption) => {
    const target = loc || selectedLoc;
    setRefreshing(true);
    try {
      const data = await mobileApi.getWeatherForecast({
        latitude: target.latitude,
        longitude: target.longitude,
        location_name: target.name,
        user_identifier: 'demo_farmer',
      });
      setWeather(data);
      const userAlerts = await mobileApi.getWeatherAlerts('demo_farmer');
      setAlerts(userAlerts);
    } catch (err: any) {
      Alert.alert('Weather Error', err.message || 'Unable to fetch forecast.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    mobileApi.getWeatherLocations()
      .then((locs) => {
        setLocations(locs);
        if (locs.length > 0) {
          setSelectedLoc(locs[0]);
          loadWeather(locs[0]);
        }
      })
      .catch(() => {
        loadWeather();
      });
  }, []);

  const handleSelectLocation = (loc: LocationOption) => {
    setSelectedLoc(loc);
    setShowLocationList(false);
    loadWeather(loc);
  };

  const handleDismissAlert = async (alertId: number) => {
    try {
      await mobileApi.markAlertRead(alertId);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestNotification = async () => {
    try {
      const res = await mobileApi.testPushNotification('demo_farmer');
      Alert.alert(
        'Push Test Dispatched',
        `Backend dispatched test notification.\nDevices notified: ${res.devices_notified ?? 0}\nStatus: ${res.status}`
      );
    } catch (err: any) {
      Alert.alert('Push Test Error', err.message || 'Failed to dispatch test notification.');
    }
  };

  const unreadAlerts = alerts.filter((a) => !a.is_read);

  return (
    <ScreenWrapper>
      <Header
        title={t('weatherScreenTitle', 'Weather & Rain Alerts')}
        subtitle={t('weatherScreenSubtitle', 'Open-Meteo Agro-Forecasting')}
        onBack={() => navigation.goBack()}
      />

      {/* Location Selector Bar */}
      <Card variant="default">
        <View style={styles.locHeader}>
          <View style={styles.locInfo}>
            <MapPin size={16} color={COLORS.primary} />
            <Text style={styles.locText} numberOfLines={1}>
              {selectedLoc.name}
            </Text>
          </View>
          <View style={styles.locButtons}>
            <TouchableOpacity
              onPress={() => setShowLocationList(!showLocationList)}
              style={styles.changeLocBtn}
            >
              <Text style={styles.changeLocText}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => loadWeather()}
              disabled={refreshing}
              style={styles.refreshBtn}
            >
              <RefreshCw size={14} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {showLocationList && (
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownTitle}>Select Cotton District:</Text>
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
              {locations.map((loc) => (
                <TouchableOpacity
                  key={loc.name}
                  onPress={() => handleSelectLocation(loc)}
                  style={[
                    styles.locOption,
                    selectedLoc.name === loc.name && styles.locOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.locOptionText,
                      selectedLoc.name === loc.name && styles.locOptionTextActive,
                    ]}
                  >
                    {loc.name}
                  </Text>
                  <Text style={styles.locOptionSub}>{loc.state}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </Card>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching real-time weather...</Text>
        </View>
      ) : (
        <>
          {/* Advisory Hero Card */}
          {weather && (
            <Card variant="highlight">
              <View style={styles.advisoryHeader}>
                <Text style={styles.advisoryBadge}>AGRO-METEOROLOGY ADVISORY</Text>
                <TouchableOpacity
                  onPress={handleTestNotification}
                  style={styles.testPushPill}
                >
                  <Bell size={12} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.testPushText}>Test Push</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.advisoryText}>{weather.advisory_summary}</Text>
            </Card>
          )}

          {/* Current Weather Grid */}
          {weather && (
            <View style={styles.metricsGrid}>
              <View style={styles.metricTile}>
                <View style={styles.tileHeader}>
                  <Text style={styles.tileLabel}>Temp</Text>
                  <Thermometer size={14} color="#f59e0b" />
                </View>
                <Text style={styles.tileValue}>{weather.current.temperature ?? '--'}°C</Text>
                <Text style={styles.tileSub}>Feels {weather.current.apparent_temperature ?? weather.current.temperature}°</Text>
              </View>

              <View style={styles.metricTile}>
                <View style={styles.tileHeader}>
                  <Text style={styles.tileLabel}>Humidity</Text>
                  <Droplets size={14} color="#3b82f6" />
                </View>
                <Text style={styles.tileValue}>{weather.current.humidity ?? '--'}%</Text>
                <Text style={styles.tileSub}>{(weather.current.humidity || 0) > 80 ? 'Fungal risk' : 'Normal'}</Text>
              </View>

              <View style={styles.metricTile}>
                <View style={styles.tileHeader}>
                  <Text style={styles.tileLabel}>Wind</Text>
                  <Wind size={14} color="#14b8a6" />
                </View>
                <Text style={styles.tileValue}>{weather.current.windspeed ?? '--'}</Text>
                <Text style={styles.tileSub}>km/h</Text>
              </View>

              <View style={styles.metricTile}>
                <View style={styles.tileHeader}>
                  <Text style={styles.tileLabel}>Rain (1h)</Text>
                  <CloudRain size={14} color="#6366f1" />
                </View>
                <Text style={styles.tileValue}>{weather.current.precipitation ?? 0} mm</Text>
                <Text style={styles.tileSub}>{weather.current.condition || 'Clear'}</Text>
              </View>
            </View>
          )}

          {/* Alert Center */}
          <Card variant="default">
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={18} color="#f59e0b" />
                <Text style={styles.sectionTitle}>{t('activeAlerts', 'Weather Alerts')}</Text>
                {unreadAlerts.length > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{unreadAlerts.length}</Text>
                  </View>
                )}
              </View>
              {alerts.length > 0 && (
                <TouchableOpacity
                  onPress={async () => {
                    await mobileApi.markAllAlertsRead('demo_farmer');
                    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
                  }}
                >
                  <Text style={styles.markAllReadText}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>

            {alerts.length === 0 ? (
              <View style={styles.emptyAlerts}>
                <CheckCircle2 size={24} color={COLORS.primary} />
                <Text style={styles.emptyAlertsText}>{t('noAlertsNow', 'No weather warnings active.')}</Text>
                <Text style={styles.emptyAlertsSub}>Conditions are favorable for cotton farming.</Text>
              </View>
            ) : (
              alerts.slice(0, 4).map((alert) => (
                <View
                  key={alert.id}
                  style={[
                    styles.alertCard,
                    alert.severity === 'danger'
                      ? styles.alertDanger
                      : alert.severity === 'warning'
                      ? styles.alertWarning
                      : styles.alertInfo,
                    alert.is_read && { opacity: 0.6 },
                  ]}
                >
                  <View style={styles.alertTopRow}>
                    <Text style={styles.alertTypeTag}>{alert.alert_type.toUpperCase()}</Text>
                    {alert.expected_time && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Clock size={10} color={COLORS.textMuted} />
                        <Text style={styles.alertTimeText}>{alert.expected_time}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.alertTitle}>{alert.title_en}</Text>
                  <Text style={styles.alertMessage}>{alert.message_en}</Text>
                  {alert.message_mr && (
                    <Text style={styles.alertMessageMr}>मराठी: {alert.message_mr}</Text>
                  )}
                  {!alert.is_read && (
                    <TouchableOpacity
                      onPress={() => handleDismissAlert(alert.id)}
                      style={styles.dismissBtn}
                    >
                      <Text style={styles.dismissBtnText}>Dismiss</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </Card>

          {/* Hourly Rain Probability (Next 24 Hours) */}
          {weather && weather.hourly_next24 && weather.hourly_next24.length > 0 && (
            <Card variant="default">
              <Text style={styles.sectionTitle}>{t('hourlyForecast', '24-Hour Rain Probability Timeline')}</Text>
              <Text style={styles.sectionSubtitle}>Hourly forecast precipitation chance (%)</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: SPACING.sm }}>
                {weather.hourly_next24.map((hour, idx) => {
                  const prob = hour.precip_prob || 0;
                  const hourLabel = hour.time.split('T')[1]?.slice(0, 5) || hour.time;
                  const barColor =
                    prob >= 60 ? '#f43f5e' : prob >= 30 ? '#fbbf24' : '#34d399';
                  return (
                    <View key={idx} style={styles.hourlyBarContainer}>
                      <Text style={styles.hourText}>{hourLabel}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { height: `${Math.max(10, prob)}%`, backgroundColor: barColor },
                          ]}
                        />
                      </View>
                      <Text style={styles.probText}>{prob}%</Text>
                      <Text style={styles.hourTemp}>{hour.temperature ?? '--'}°</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </Card>
          )}

          {/* 7-Day Outlook */}
          {weather && weather.daily_forecast && (
            <Card variant="default">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm }}>
                <Calendar size={16} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>{t('sevenDayForecast', '7-Day Agricultural Forecast')}</Text>
              </View>

              {weather.daily_forecast.map((day, idx) => (
                <View key={idx} style={styles.dailyRow}>
                  <View style={{ width: 85 }}>
                    <Text style={styles.dailyDay}>
                      {idx === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={styles.dailyCond} numberOfLines={1}>{day.condition}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.dailyTempMax}>{day.temp_max ?? '--'}°</Text>
                    <Text style={styles.dailyTempMin}>/ {day.temp_min ?? '--'}°</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={[
                        styles.dailyRainProb,
                        day.precipitation_probability_max >= 50 && { color: COLORS.danger },
                      ]}
                    >
                      {day.precipitation_probability_max}% rain
                    </Text>
                    <Text style={styles.dailyRainSum}>{day.precipitation_sum_mm.toFixed(1)} mm</Text>
                  </View>
                </View>
              ))}
            </Card>
          )}

          <Text style={styles.disclaimerText}>
            Disclaimer: Open-Meteo weather forecasts are computational models and do not guarantee field-level rain. Verify soil conditions before chemical applications.
          </Text>
        </>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  locHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: SPACING.sm,
  },
  locText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  locButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeLocBtn: {
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  changeLocText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  refreshBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dropdownTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  locOption: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locOptionActive: {
    backgroundColor: COLORS.primaryBg,
  },
  locOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  locOptionTextActive: {
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  locOptionSub: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  advisoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  advisoryBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  testPushPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  testPushText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  advisoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 18,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  metricTile: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tileLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  tileValue: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  tileSub: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  unreadBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  markAllReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyAlerts: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  emptyAlertsText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  emptyAlertsSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  alertCard: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  alertDanger: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
  },
  alertWarning: {
    backgroundColor: COLORS.warningBg,
    borderColor: COLORS.warningBorder,
  },
  alertInfo: {
    backgroundColor: COLORS.infoBg,
    borderColor: COLORS.infoBorder,
  },
  alertTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTypeTag: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.textSecondary,
  },
  alertTimeText: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  alertMessage: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  alertMessageMr: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginTop: 2,
    fontStyle: 'italic',
  },
  dismissBtn: {
    alignSelf: 'flex-end',
    marginTop: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dismissBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  hourlyBarContainer: {
    width: 48,
    alignItems: 'center',
    marginRight: 6,
  },
  hourText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  barTrack: {
    width: '100%',
    height: 60,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 2,
  },
  barFill: {
    width: '100%',
    borderRadius: 3,
  },
  probText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 3,
  },
  hourTemp: {
    fontSize: 8,
    color: COLORS.textMuted,
  },
  dailyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  dailyDay: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dailyCond: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  dailyTempMax: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  dailyTempMin: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  dailyRainProb: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  dailyRainSum: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  disclaimerText: {
    fontSize: 9,
    color: COLORS.textMuted,
    lineHeight: 13,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
});
