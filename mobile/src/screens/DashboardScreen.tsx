import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {
  TrendingUp,
  ScanLine,
  MessageSquare,
  Droplets,
  Thermometer,
  Wind,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  History,
  MapPin,
} from 'lucide-react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Card } from '../components/Card';
import { mobileApi } from '../services/api';
import { FarmerProfile, HealthStatus, ModelInfo, HistoryData } from '../types';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [weather, setWeather] = useState<{
    temp: number;
    wind: number;
    isOptimal: boolean;
  }>({
    temp: 28.5,
    wind: 12.0,
    isOptimal: true,
  });

  const loadData = async () => {
    setError(null);
    try {
      const [hRes, pRes, mRes, histRes] = await Promise.allSettled([
        mobileApi.getHealth(),
        mobileApi.getFarmerProfile('demo_farmer'),
        mobileApi.getModelInfo(),
        mobileApi.getHistory('demo_farmer', 'all'),
      ]);

      if (hRes.status === 'fulfilled') setHealth(hRes.value);
      if (pRes.status === 'fulfilled') setProfile(pRes.value);
      if (mRes.status === 'fulfilled') setModelInfo(mRes.value);
      if (histRes.status === 'fulfilled') setHistory(histRes.value);

      if (hRes.status === 'rejected' && pRes.status === 'rejected') {
        setError('Backend server is unreachable. Check your Wi-Fi network and backend status in Settings.');
      }

      // Fetch live weather from CottonCare backend service
      mobileApi.getWeatherForecast({
        user_identifier: 'demo_farmer',
        latitude: pRes.status === 'fulfilled' ? pRes.value.latitude : undefined,
        longitude: pRes.status === 'fulfilled' ? pRes.value.longitude : undefined,
      })
        .then((wData) => {
          if (wData?.current) {
            const tVal = wData.current.temperature ?? 28.5;
            const w = wData.current.windspeed ?? 12.0;
            setWeather({
              temp: tVal,
              wind: w,
              isOptimal: tVal >= 20 && tVal <= 34 && w < 18,
            });
          }
        })
        .catch(() => {});
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const latestYield = history?.yield_predictions?.[0];
  const latestScan = history?.disease_scans?.[0];

  return (
    <ScreenWrapper>
      {/* Top Profile / Location Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greetingText}>{t('dashboardTitle', 'CottonCare')}</Text>
          <Text style={styles.farmerName}>{profile?.name || t('farmerFriend', 'Farmer Friend')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.locationPill}
        >
          <MapPin size={12} color={COLORS.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {profile?.location?.split(' ')[0] || 'Sambhajinagar'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Backend connection warning if any */}
      {error && (
        <View style={styles.errorAlert}>
          <AlertCircle size={16} color={COLORS.danger} style={{ marginRight: 6 }} />
          <Text style={styles.errorAlertText}>{error}</Text>
        </View>
      )}

      {/* Weather & Agronomic Insight Card */}
      <Card variant="default">
        <View style={styles.weatherRow}>
          <View style={styles.weatherItem}>
            <Thermometer size={18} color={COLORS.warning} />
            <View>
              <Text style={styles.metricVal}>{weather.temp}°C</Text>
              <Text style={styles.metricLabel}>{t('temperatureC', 'Temperature')}</Text>
            </View>
          </View>
          <View style={styles.weatherDivider} />
          <View style={styles.weatherItem}>
            <Wind size={18} color={COLORS.info} />
            <View>
              <Text style={styles.metricVal}>{weather.wind} km/h</Text>
              <Text style={styles.metricLabel}>Wind Speed</Text>
            </View>
          </View>
          <View style={styles.weatherDivider} />
          <View style={styles.weatherItem}>
            <Droplets size={18} color={COLORS.primary} />
            <View>
              <Text style={styles.metricVal}>{profile?.land_acres || 2.0} {t('acres', 'Ac')}</Text>
              <Text style={styles.metricLabel}>{t('fieldArea', 'Plot Area')}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Weather')}
          style={{
            marginTop: SPACING.sm,
            paddingTop: SPACING.xs,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.primary }}>
            🌧️ {t('weatherModule', 'Weather & Rain Alerts')}
          </Text>
          <ArrowRight size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </Card>

      {/* Primary Actions Grid */}
      <Text style={styles.sectionTitle}>{t('quickActions', 'Smart Farming Tools')}</Text>
      <View style={styles.toolsGrid}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Yield')}
          style={[styles.toolCard, { borderColor: COLORS.primaryBorder }]}
          activeOpacity={0.8}
        >
          <View style={[styles.toolIconCircle, { backgroundColor: COLORS.primaryBg }]}>
            <TrendingUp size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.toolTitle}>{t('predictYield', 'Yield Forecast')}</Text>
          <Text style={styles.toolDesc}>{t('yieldDesc', 'Machine learning harvest forecast per acre')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Disease')}
          style={[styles.toolCard, { borderColor: COLORS.dangerBorder }]}
          activeOpacity={0.8}
        >
          <View style={[styles.toolIconCircle, { backgroundColor: COLORS.dangerBg }]}>
            <ScanLine size={22} color={COLORS.danger} />
          </View>
          <Text style={styles.toolTitle}>{t('diagnoseCrop', 'Crop Disease Scan')}</Text>
          <Text style={styles.toolDesc}>{t('cropDesc', 'Instant visual leaf diagnosis & biological cure')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Assistant')}
          style={[styles.toolCard, { borderColor: COLORS.infoBorder }]}
          activeOpacity={0.8}
        >
          <View style={[styles.toolIconCircle, { backgroundColor: COLORS.infoBg }]}>
            <MessageSquare size={22} color={COLORS.info} />
          </View>
          <Text style={styles.toolTitle}>{t('voiceAssistant', 'AI Krishi Mitra')}</Text>
          <Text style={styles.toolDesc}>{t('assistantDesc', 'Marathi, Hindi & English farming voice bot')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Recommendations')}
          style={[styles.toolCard, { borderColor: COLORS.warningBorder }]}
          activeOpacity={0.8}
        >
          <View style={[styles.toolIconCircle, { backgroundColor: COLORS.warningBg }]}>
            <Droplets size={22} color={COLORS.warning} />
          </View>
          <Text style={styles.toolTitle}>{t('farmingSchedules', 'Schedules & Nutrition')}</Text>
          <Text style={styles.toolDesc}>{t('schedulesDesc', 'Stage-wise irrigation & fertilizer guide')}</Text>
        </TouchableOpacity>
      </View>

      {/* Model Benchmark Info */}
      {modelInfo && (
        <Card variant="highlight">
          <View style={styles.modelHeaderRow}>
            <Text style={styles.modelBadge}>VERIFIED ML BENCHMARK</Text>
            <Text style={styles.modelR2}>R² = {modelInfo.metrics.r2_score}</Text>
          </View>
          <Text style={styles.modelName}>{modelInfo.model_name}</Text>
          <Text style={styles.modelDetails}>
            Trained on {modelInfo.trained_on_rows.toLocaleString()} observations • MAE: {modelInfo.metrics.mae} kg/acre • RMSE: {modelInfo.metrics.rmse} kg/acre
          </Text>
        </Card>
      )}

      {/* Recent Activity Section */}
      <View style={styles.activityHeader}>
        <Text style={styles.sectionTitle}>{t('recentActivity', 'Recent Farm Analytics')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <Text style={styles.viewAllText}>{t('viewDetails', 'View Details')} →</Text>
        </TouchableOpacity>
      </View>

      {latestYield ? (
        <Card variant="default">
          <View style={styles.recentRow}>
            <View style={styles.recentIconBox}>
              <TrendingUp size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recentTitle}>{t('lastYieldPrediction', 'Latest Yield Prediction')}: #{latestYield.id}</Text>
              <Text style={styles.recentSubtitle}>
                {latestYield.predicted_yield_per_acre} kg/{t('acres', 'acre')} ({latestYield.total_predicted_yield_quintals} quintals)
              </Text>
            </View>
            <Text style={styles.recentDate}>{latestYield.created_at}</Text>
          </View>
        </Card>
      ) : null}

      {latestScan ? (
        <Card variant="default">
          <View style={styles.recentRow}>
            <View style={[styles.recentIconBox, { backgroundColor: COLORS.dangerBg }]}>
              <ScanLine size={18} color={COLORS.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recentTitle}>{latestScan.condition_detected}</Text>
              <Text style={styles.recentSubtitle}>{t('severity', 'Severity')}: {latestScan.severity_level}</Text>
            </View>
            <Text style={styles.recentDate}>{latestScan.created_at}</Text>
          </View>
        </Card>
      ) : null}

      {!latestYield && !latestScan && !loading && (
        <Card variant="outlined">
          <Text style={styles.emptyText}>{t('noPredictionsYet', 'No predictions recorded yet.')}</Text>
        </Card>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  greetingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  farmerName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  errorAlertText: {
    fontSize: 12,
    color: COLORS.danger,
    flex: 1,
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginVertical: SPACING.xs,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  toolCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    gap: 4,
  },
  toolIconCircle: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  toolTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  toolDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  modelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modelBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  modelR2: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  modelName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modelDetails: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  recentIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  recentSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  recentDate: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
});
