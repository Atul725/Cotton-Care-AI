import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { History as HistoryIcon, TrendingUp, ScanLine, Filter, Calendar } from 'lucide-react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { mobileApi } from '../services/api';
import { HistoryData } from '../types';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';

export const HistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'yield' | 'disease'>('all');
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await mobileApi.getHistory('demo_farmer', filter);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const yieldList = data?.yield_predictions || [];
  const diseaseList = data?.disease_scans || [];

  return (
    <ScreenWrapper>
      <Header
        title={t('recentActivity', 'Inference Archive')}
        subtitle="Saved Farmer Observations"
        onBack={() => navigation.goBack()}
      />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'yield', 'disease'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilter(tab)}
            style={[styles.filterChip, filter === tab && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, filter === tab && styles.filterChipTextActive]}>
              {tab === 'all' ? 'All Activity' : tab === 'yield' ? t('tabYield', 'Yield Logs') : t('tabDisease', 'Disease Scans')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading observation history...</Text>
        </View>
      ) : (
        <>
          {/* Yield Predictions */}
          {(filter === 'all' || filter === 'yield') && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Yield Predictions ({yieldList.length})
              </Text>

              {yieldList.length === 0 ? (
                <Card variant="outlined">
                  <Text style={styles.emptyText}>No yield predictions logged yet.</Text>
                </Card>
              ) : (
                yieldList.map((y) => (
                  <Card key={y.id} variant="default">
                    <View style={styles.logHeader}>
                      <View style={styles.logTag}>
                        <TrendingUp size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.logTagText}>Log #{y.id}</Text>
                      </View>
                      <Text style={styles.logDate}>{y.created_at}</Text>
                    </View>

                    <View style={styles.yieldNumbersRow}>
                      <View>
                        <Text style={styles.metricVal}>{y.predicted_yield_per_acre} kg/ac</Text>
                        <Text style={styles.metricLabel}>Per-Acre Yield</Text>
                      </View>
                      <View>
                        <Text style={[styles.metricVal, { color: COLORS.primaryDark }]}>
                          {y.total_predicted_yield_quintals} Qtl
                        </Text>
                        <Text style={styles.metricLabel}>Total Harvest ({y.acres} Ac)</Text>
                      </View>
                    </View>

                    <Text style={styles.paramSummary}>
                      Cycle: {y.growth_cycle}d • Temp: {y.temperature}°C • Precip: {y.precipitation}mm
                    </Text>
                  </Card>
                ))
              )}
            </View>
          )}

          {/* Disease Scans */}
          {(filter === 'all' || filter === 'disease') && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Disease Scans ({diseaseList.length})
              </Text>

              {diseaseList.length === 0 ? (
                <Card variant="outlined">
                  <Text style={styles.emptyText}>No crop disease scans recorded yet.</Text>
                </Card>
              ) : (
                diseaseList.map((s) => (
                  <Card key={s.id} variant="default">
                    <View style={styles.logHeader}>
                      <View style={[styles.logTag, { backgroundColor: COLORS.dangerBg }]}>
                        <ScanLine size={14} color={COLORS.danger} style={{ marginRight: 4 }} />
                        <Text style={[styles.logTagText, { color: COLORS.danger }]}>Scan #{s.id}</Text>
                      </View>
                      <Text style={styles.logDate}>{s.created_at}</Text>
                    </View>

                    <Text style={styles.conditionTitle}>{s.condition_detected}</Text>
                    <Text style={styles.severityTag}>Severity: {s.severity_level} • Conf: {(s.confidence_score * 100).toFixed(0)}%</Text>

                    <Text style={styles.reportSnippet} numberOfLines={2}>
                      {s.diagnostic_report}
                    </Text>
                  </Card>
                ))
              )}
            </View>
          )}
        </>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  filterChip: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  loader: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  logTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  logTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  logDate: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  yieldNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.xs,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  paramSummary: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  conditionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  severityTag: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '700',
    marginTop: 2,
  },
  reportSnippet: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
});
