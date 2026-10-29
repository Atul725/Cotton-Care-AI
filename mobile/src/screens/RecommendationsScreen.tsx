import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Droplets, Layers, ShieldAlert, CheckCircle, Clock } from 'lucide-react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { mobileApi } from '../services/api';
import { RecommendationResult } from '../types';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';

export const RecommendationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();
  const [cropDays, setCropDays] = useState(45);
  const [landAcres, setLandAcres] = useState(3.0);
  const [soilType, setSoilType] = useState('काळी माती (Black Soil)');
  const [data, setData] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);

  const soilOptions = [
    'काळी माती (Black Soil)',
    'मध्यम भारी माती (Medium Deep)',
    'तांबडी / हलकी माती (Red / Light)',
  ];

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await mobileApi.getRecommendations(cropDays, landAcres, soilType);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [cropDays, landAcres, soilType]);

  const stages = [
    { label: 'Seedling (1-30d)', min: 15 },
    { label: 'Squaring (31-75d)', min: 55 },
    { label: 'Bolls (76-125d)', min: 100 },
    { label: 'Harvest (126-180d)', min: 150 },
  ];

  return (
    <ScreenWrapper>
      <Header
        title={t('recsTitle', 'Farming Schedules')}
        subtitle={t('recsSubtitle', 'Agronomic Guidance by Growth Stage')}
        onBack={() => navigation.goBack()}
      />

      {/* Stage Selector Chips */}
      <Card variant="default">
        <Text style={styles.sectionTitle}>{t('growthStageHeader', 'Current Crop Growth Stage')}: {cropDays} Days</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stageChips}>
          {stages.map((stg, i) => {
            const isNear = Math.abs(cropDays - stg.min) < 25;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => setCropDays(stg.min)}
                style={[styles.stageChip, isNear && styles.stageChipActive]}
              >
                <Text style={[styles.stageChipText, isNear && styles.stageChipTextActive]}>
                  {stg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.configRow}>
          <View style={styles.configCol}>
            <Text style={styles.label}>{t('fieldArea', 'Farm Acreage')}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(landAcres)}
              onChangeText={(v) => setLandAcres(parseFloat(v) || 1)}
            />
          </View>
          <View style={styles.configCol}>
            <Text style={styles.label}>{t('soilType', 'Soil Profile')}</Text>
            <TouchableOpacity
              onPress={() => {
                const nextIdx = (soilOptions.indexOf(soilType) + 1) % soilOptions.length;
                setSoilType(soilOptions[nextIdx]);
              }}
              style={styles.soilSelect}
            >
              <Text style={styles.soilText} numberOfLines={1}>{soilType.split(' ')[0]}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('loading', 'Updating agronomic schedules...')}</Text>
        </View>
      )}

      {data && !loading && (
        <>
          {/* Phenological Stage Banner */}
          <Card variant="highlight">
            <View style={styles.stageHeaderRow}>
              <Text style={styles.stageBadge}>CURRENT PHENOLOGY</Text>
              <Text style={styles.stageDaysText}>{cropDays} Days Sown</Text>
            </View>
            <Text style={styles.growthStageTitle}>{data.growth_stage}</Text>
            <Text style={styles.stageDesc}>{data.stage_description}</Text>
          </Card>

          {/* Fertilizer Dosages */}
          <Card variant="default">
            <View style={styles.cardHeaderWithIcon}>
              <Layers size={18} color={COLORS.primary} />
              <Text style={styles.cardHeaderTitle}>{t('fertilizerCard', 'Fertilizer & Nutrition Schedule')} ({landAcres} {t('acres', 'Acres')})</Text>
            </View>

            <View style={styles.fertilizerGrid}>
              <View style={styles.fertBox}>
                <Text style={styles.fertName}>UREA</Text>
                <Text style={styles.fertVal}>{data.fertilizer_schedule.urea_kg} kg</Text>
              </View>
              <View style={styles.fertBox}>
                <Text style={styles.fertName}>DAP</Text>
                <Text style={styles.fertVal}>{data.fertilizer_schedule.dap_kg} kg</Text>
              </View>
              <View style={styles.fertBox}>
                <Text style={styles.fertName}>POTASH</Text>
                <Text style={styles.fertVal}>{data.fertilizer_schedule.potash_mop_kg} kg</Text>
              </View>
            </View>

            <View style={styles.advisoryDetail}>
              <Text style={styles.detailLine}>
                <Text style={styles.boldText}>Micronutrients: </Text>
                {data.fertilizer_schedule.micronutrients}
              </Text>
              <Text style={styles.detailLine}>
                <Text style={styles.boldText}>Application: </Text>
                {data.fertilizer_schedule.application_method}
              </Text>
            </View>
          </Card>

          {/* Irrigation Schedule */}
          <Card variant="default">
            <View style={styles.cardHeaderWithIcon}>
              <Droplets size={18} color={COLORS.info} />
              <Text style={styles.cardHeaderTitle}>{t('irrigationCard', 'Irrigation & Water Management')}</Text>
            </View>
            <View style={styles.irrigationBox}>
              <View style={styles.irrRow}>
                <Text style={styles.irrLabel}>Frequency:</Text>
                <Text style={styles.irrVal}>{data.irrigation_schedule.frequency}</Text>
              </View>
              <View style={styles.irrRow}>
                <Text style={styles.irrLabel}>Volume:</Text>
                <Text style={styles.irrVal}>{data.irrigation_schedule.volume_level}</Text>
              </View>
              <Text style={styles.irrNote}>{data.irrigation_schedule.soil_adaptation}</Text>
            </View>
          </Card>

          {/* Pest Watch List */}
          <Card variant="default">
            <View style={styles.cardHeaderWithIcon}>
              <ShieldAlert size={18} color={COLORS.danger} />
              <Text style={styles.cardHeaderTitle}>{t('pestCard', 'Pest & Disease Watchlist')}</Text>
            </View>
            {data.pest_disease_watch.map((p, idx) => (
              <View key={idx} style={styles.pestItem}>
                <Text style={styles.pestName}>⚠️ {p.pest}</Text>
                <Text style={styles.pestAction}>{p.action}</Text>
              </View>
            ))}
          </Card>

          {/* Field Precautions */}
          <Card variant="default">
            <View style={styles.cardHeaderWithIcon}>
              <CheckCircle size={18} color={COLORS.primary} />
              <Text style={styles.cardHeaderTitle}>{t('precautionsCard', 'Agronomic Field Precautions')}</Text>
            </View>
            {data.expert_precautions.map((prec, idx) => (
              <View key={idx} style={styles.precItem}>
                <Text style={styles.precText}>✓ {prec}</Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  stageChips: {
    gap: 6,
    paddingBottom: SPACING.sm,
  },
  stageChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stageChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stageChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  stageChipTextActive: {
    color: '#ffffff',
  },
  configRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  configCol: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  soilSelect: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  soilText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  loader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: SPACING.md,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  stageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stageBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  stageDaysText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  growthStageTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  stageDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  cardHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  fertilizerGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  fertBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fertName: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  fertVal: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 2,
  },
  advisoryDetail: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  detailLine: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  irrigationBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  irrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  irrLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  irrVal: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  irrNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  pestItem: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 4,
  },
  pestName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.danger,
  },
  pestAction: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  precItem: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 4,
  },
  precText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});
