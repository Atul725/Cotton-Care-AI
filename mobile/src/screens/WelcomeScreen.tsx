import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sprout, TrendingUp, ScanLine, MessageSquare, ArrowRight, Check } from 'lucide-react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { SupportedLanguage } from '../i18n/translations';

interface WelcomeScreenProps {
  navigation: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const { language, setLanguage, t } = useLanguage();

  const languageOptions: { label: string; code: SupportedLanguage }[] = [
    { label: 'मराठी', code: 'mr' },
    { label: 'English', code: 'en' },
    { label: 'हिंदी', code: 'hi' },
  ];

  return (
    <ScreenWrapper>
      {/* Brand Hero */}
      <View style={styles.heroSection}>
        <View style={styles.iconContainer}>
          <Sprout size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.brandTitle}>{t('welcomeTitle', 'CottonCare AI')}</Text>
        <Text style={styles.brandSubtitle}>
          {t('welcomeSubtitle', 'Increasing Yield of Cotton Plant Using AI')}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>MIT Chhatrapati Sambhajinagar</Text>
        </View>
      </View>

      {/* Language Selector */}
      <Card variant="default">
        <Text style={styles.cardHeader}>{t('selectLanguage', 'भाषा निवडा / Select Language')}</Text>
        <View style={styles.languageRow}>
          {languageOptions.map((opt) => {
            const isSelected = language === opt.code;
            return (
              <TouchableOpacity
                key={opt.code}
                onPress={() => setLanguage(opt.code)}
                style={[styles.langChip, isSelected && styles.langChipSelected]}
                activeOpacity={0.7}
              >
                {isSelected ? <Check size={14} color="#ffffff" style={styles.chipCheck} /> : null}
                <Text style={[styles.langChipText, isSelected && styles.langChipTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* Purpose & Benefits */}
      <Card variant="highlight">
        <Text style={styles.purposeTitle}>
          {t('purposeTitle', 'Smart Agriculture for Cotton Farmers')}
        </Text>
        <Text style={styles.purposeDescription}>
          {t('purposeDesc', 'Data-driven regression models, multimodal disease diagnosis, and agronomic advisories tailored to Indian cotton farms.')}
        </Text>
      </Card>

      {/* Feature Highlights Grid */}
      <View style={styles.featuresGrid}>
        <View style={styles.featureItem}>
          <TrendingUp size={22} color={COLORS.primary} />
          <Text style={styles.featureText}>{t('featureYield', 'ML Yield Forecast')}</Text>
        </View>
        <View style={styles.featureItem}>
          <ScanLine size={22} color={COLORS.danger} />
          <Text style={styles.featureText}>{t('featureDisease', 'Crop Leaf Diagnosis')}</Text>
        </View>
        <View style={styles.featureItem}>
          <MessageSquare size={22} color={COLORS.info} />
          <Text style={styles.featureText}>{t('featureChat', 'Multilingual AI')}</Text>
        </View>
      </View>

      {/* Action CTA */}
      <View style={styles.ctaContainer}>
        <Button
          title={t('getStarted', 'Get Started')}
          onPress={() => navigation.navigate('MainTabs')}
          size="lg"
          icon={<ArrowRight size={18} color="#ffffff" />}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  heroSection: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    marginBottom: SPACING.sm,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  badge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
  },
  badgeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  languageRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  langChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  langChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipCheck: {
    marginRight: 4,
  },
  langChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  langChipTextSelected: {
    color: '#ffffff',
  },
  purposeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 6,
  },
  purposeDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  featureItem: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  ctaContainer: {
    marginTop: SPACING.md,
  },
});
