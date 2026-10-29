import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { TrendingUp, Sparkles, AlertCircle, CheckCircle, Info } from 'lucide-react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { mobileApi } from '../services/api';
import { YieldPredictionInput, YieldPredictionResult } from '../types';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';

export const YieldPredictionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<YieldPredictionInput>({
    user_identifier: 'demo_farmer',
    acres: 3.0,
    growth_cycle: 125,
    sunlight_hours: 8.0,
    precipitation: 540,
    temperature: 26.5,
    soil_moisture: 70,
    soil_ph: 6.8,
    co2_concentration: 420,
    drought_days: 20,
    flood_days: 8,
    soil_type: 'काळी माती (Black Soil)',
    water_source: 'विहीर / बोरवेल (Irrigated)',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<YieldPredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof YieldPredictionInput, value: string) => {
    const num = parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      [field]: isNaN(num) ? value : num,
    }));
  };

  const handleCalculate = async () => {
    setError(null);

    // Validation
    if (formData.acres <= 0 || formData.acres > 500) {
      setError('Please enter a valid plot acreage between 0.1 and 500.');
      return;
    }
    if (formData.growth_cycle < 60 || formData.growth_cycle > 220) {
      setError('Cotton growth cycle is typically between 60 and 220 days.');
      return;
    }
    if (formData.soil_ph < 4.0 || formData.soil_ph > 10.0) {
      setError('Soil pH must be between 4.0 and 10.0.');
      return;
    }

    setLoading(true);
    try {
      const res = await mobileApi.predictYield(formData);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to predict cotton yield. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header
        title={t('yieldTitle', 'Yield Prediction')}
        subtitle={t('yieldSubtitle', 'Random Forest Regressor (80,000 Obs)')}
        onBack={() => navigation.goBack()}
      />

      {/* Input Form Card */}
      <Card variant="default">
        <Text style={styles.formSectionTitle}>🌱 {t('plotDetailsHeader', 'Agro-Climatic Parameters')}</Text>

        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <Text style={styles.label}>{t('fieldArea', 'Farm Area (Acres)')}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(formData.acres)}
              onChangeText={(v) => handleInputChange('acres', v)}
            />
          </View>
          <View style={styles.fieldCol}>
            <Text style={styles.label}>{t('growthCycleDays', 'Growth Cycle (Days)')}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(formData.growth_cycle)}
              onChangeText={(v) => handleInputChange('growth_cycle', v)}
            />
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <Text style={styles.label}>{t('sunlightHours', 'Daily Sunlight (Hours)')}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(formData.sunlight_hours)}
              onChangeText={(v) => handleInputChange('sunlight_hours', v)}
            />
          </View>
          <View style={styles.fieldCol}>
            <Text style={styles.label}>{t('rainfallMm', 'Rainfall / Precip (mm)')}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(formData.precipitation)}
              onChangeText={(v) => handleInputChange('precipitation', v)}
            />
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <Text style={styles.label}>{t('temperatureC', 'Avg Temperature (°C)')}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(formData.temperature)}
              onChangeText={(v) => handleInputChange('temperature', v)}
            />
          </View>
          <View style={styles.fieldCol}>
            <Text style={styles.label}>{t('soilMoisturePct', 'Soil Moisture (%)')}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(formData.soil_moisture)}
              onChangeText={(v) => handleInputChange('soil_moisture', v)}
            />
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <Text style={styles.label}>{t('soilPh', 'Soil pH (4.0 - 9.5)')}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(formData.soil_ph)}
              onChangeText={(v) => handleInputChange('soil_ph', v)}
            />
          </View>
          <View style={styles.fieldCol}>
            <Text style={styles.label}>CO2 Conc (ppm)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(formData.co2_concentration)}
              onChangeText={(v) => handleInputChange('co2_concentration', v)}
            />
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <Text style={styles.label}>Drought Days (Dry spell)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(formData.drought_days)}
              onChangeText={(v) => handleInputChange('drought_days', v)}
            />
          </View>
          <View style={styles.fieldCol}>
            <Text style={styles.label}>Waterlogged Days</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(formData.flood_days)}
              onChangeText={(v) => handleInputChange('flood_days', v)}
            />
          </View>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color={COLORS.danger} style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button
          title={t('predictYieldBtn', 'Calculate Harvest Forecast')}
          onPress={handleCalculate}
          loading={loading}
          icon={<TrendingUp size={18} color="#ffffff" />}
          style={{ marginTop: SPACING.sm }}
        />
      </Card>

      {/* Result Display */}
      {result && (
        <Card variant="highlight">
          <View style={styles.resultHeader}>
            <Text style={styles.resultBadge}>{t('predictedYieldHeader', 'Harvest Prediction Result')}</Text>
            <Text style={styles.confidenceText}>{result.confidence_level}</Text>
          </View>

          <View style={styles.yieldMetricContainer}>
            <View style={styles.yieldBox}>
              <Text style={styles.yieldVal}>{result.predicted_yield_per_acre_kg}</Text>
              <Text style={styles.yieldUnit}>kg / {t('acres', 'acre')}</Text>
            </View>
            <View style={styles.yieldDivider} />
            <View style={styles.yieldBox}>
              <Text style={[styles.yieldVal, { color: COLORS.primaryDark }]}>
                {result.total_predicted_yield_quintals}
              </Text>
              <Text style={styles.yieldUnit}>Quintals ({formData.acres} Ac)</Text>
            </View>
          </View>

          <Text style={styles.subHeading}>{t('topFactors', 'Key Growth Influencing Factors')}</Text>
          <View style={styles.factorsList}>
            {result.top_influencing_factors.slice(0, 3).map((f, idx) => (
              <View key={idx} style={styles.factorItem}>
                <Text style={styles.factorName}>{f.feature.replace('_', ' ')}</Text>
                <Text style={styles.factorWeight}>{(f.importance * 100).toFixed(1)}%</Text>
              </View>
            ))}
          </View>

          <Text style={styles.subHeading}>{t('agronomicAdvisory', 'Agronomic Field Advisory')}</Text>
          <View style={styles.advisoryBox}>
            <Text style={styles.advisoryText}>{result.agronomic_advisory}</Text>
          </View>

          <View style={styles.disclaimerBox}>
            <Info size={14} color={COLORS.textMuted} style={{ marginRight: 6, marginTop: 2 }} />
            <Text style={styles.disclaimerText}>{result.disclaimer}</Text>
          </View>
        </Card>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  formSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  fieldCol: {
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
    paddingVertical: 7,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerBg,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    marginVertical: SPACING.xs,
  },
  errorText: {
    fontSize: 11,
    color: COLORS.danger,
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  resultBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  yieldMetricContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  yieldBox: {
    flex: 1,
    alignItems: 'center',
  },
  yieldDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  yieldVal: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
  },
  yieldUnit: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  subHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
    marginBottom: 4,
  },
  factorsList: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.xs,
  },
  factorItem: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  factorName: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  factorWeight: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 2,
  },
  advisoryBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  advisoryText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.xs,
  },
  disclaimerText: {
    fontSize: 10,
    color: COLORS.textMuted,
    flex: 1,
    lineHeight: 14,
  },
});
