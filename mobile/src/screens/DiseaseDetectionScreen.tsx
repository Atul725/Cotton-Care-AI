import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ScanLine, Camera, Image as ImageIcon, CheckCircle, ShieldAlert, AlertCircle, Info, AlertTriangle } from 'lucide-react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { mobileApi } from '../services/api';
import { DiseaseDetectionResult } from '../types';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';

export const DiseaseDetectionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async (useCamera: boolean) => {
    setError(null);
    try {
      let permissionResult;
      if (useCamera) {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!permissionResult.granted) {
        Alert.alert(
          t('error', 'Permission Required'),
          useCamera
            ? 'Camera access is required to take photos of cotton leaves.'
            : 'Photo library access is required to select crop images.'
        );
        return;
      }

      const pickerResult = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        setSelectedImage(pickerResult.assets[0].uri);
        setResult(null);
      }
    } catch (err: any) {
      setError('Failed to open image picker: ' + (err.message || 'Unknown error'));
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select or capture a leaf photo first.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await mobileApi.detectDisease(selectedImage, 'crop_sample.jpg', 'image/jpeg');
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Crop disease analysis failed. Please verify backend service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header
        title={t('diseaseTitle', 'Disease Diagnosis')}
        subtitle={t('diseaseSubtitle', 'Cotton Leaf & Canopy Pathology')}
        onBack={() => navigation.goBack()}
      />

      {/* Engine Status Notice */}
      <Card variant="default">
        <View style={styles.engineNoticeRow}>
          <Info size={16} color={COLORS.info} style={{ marginRight: 6 }} />
          <Text style={styles.engineNoticeText}>
            {t('offlineEngineNotice', 'Cloud Diagnostic Engine: Multimodal Gemini Vision. Offline mode active when connection is unavailable.')}
          </Text>
        </View>
      </Card>

      {/* Image Picker Card */}
      <Card variant="default">
        {selectedImage ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <View style={styles.pickerButtonRow}>
              <Button
                title={t('retakePhoto', 'Retake / Change Photo')}
                onPress={() => pickImage(false)}
                variant="secondary"
                size="sm"
                icon={<ImageIcon size={14} color={COLORS.textPrimary} />}
              />
            </View>
          </View>
        ) : (
          <View style={styles.uploadPlaceholder}>
            <ScanLine size={40} color={COLORS.danger} />
            <Text style={styles.placeholderTitle}>{t('uploadLeafPhoto', 'Upload Affected Cotton Leaf Photo')}</Text>
            <Text style={styles.placeholderDesc}>{t('uploadDesc', 'Capture spots, curling, or discoloration in bright daylight.')}</Text>
            <View style={styles.pickerButtons}>
              <Button
                title={t('camera', 'Camera')}
                onPress={() => pickImage(true)}
                variant="secondary"
                size="md"
                icon={<Camera size={16} color={COLORS.textPrimary} />}
              />
              <Button
                title={t('gallery', 'Gallery')}
                onPress={() => pickImage(false)}
                variant="secondary"
                size="md"
                icon={<ImageIcon size={16} color={COLORS.textPrimary} />}
              />
            </View>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color={COLORS.danger} style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {selectedImage && (
          <Button
            title={t('runAnalysis', 'Run AI Disease Analysis')}
            onPress={handleAnalyze}
            loading={loading}
            icon={<ScanLine size={18} color="#ffffff" />}
            style={{ marginTop: SPACING.md }}
          />
        )}
      </Card>

      {/* Diagnosis Results */}
      {result && (
        result.is_valid_cotton_leaf === false ? (
          /* Invalid Leaf / Non-Cotton Image Warning Card */
          <Card variant="default" style={styles.invalidCard}>
            <View style={styles.invalidHeaderRow}>
              <AlertTriangle size={24} color={COLORS.warning} style={{ marginRight: 8 }} />
              <Text style={styles.invalidHeaderTitle}>
                {t('invalidImageTitle', 'Invalid Image - Not a Cotton Leaf')}
              </Text>
            </View>
            <Text style={styles.invalidDesc}>
              {result.validation_message || t('invalidImageHint', 'Please upload a clear photograph of a cotton leaf for disease detection.')}
            </Text>
            <View style={styles.invalidTipsBox}>
              <Text style={styles.invalidTipsHeader}>Important Tips:</Text>
              <Text style={styles.invalidTipItem}>• Upload images showing cotton leaves, bolls, or stems.</Text>
              <Text style={styles.invalidTipItem}>• Avoid uploading isolated flowers, people, documents, or unrelated objects.</Text>
              <Text style={styles.invalidTipItem}>• Ensure adequate daylight and sharp focus on symptomatic leaf spots.</Text>
            </View>
          </Card>
        ) : (
          /* Valid Cotton Leaf Disease Diagnosis */
          <Card variant="highlight">
            <View style={styles.resultHeader}>
              <Text style={styles.conditionTitle}>{result.condition_detected}</Text>
              <View style={styles.severityBadge}>
                <Text style={styles.severityText}>{t('severity', 'Severity')}: {result.severity_level}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{t('engine', 'Engine')}: {result.detection_engine}</Text>
              <Text style={styles.metaText}>{t('confidence', 'Confidence')}: {(result.confidence_score * 100).toFixed(0)}%</Text>
            </View>

            <Text style={styles.sectionHeader}>{t('diagnosticReport', 'Detailed Pathology Report')}</Text>
            <View style={styles.reportBox}>
              <Text style={styles.reportText}>{result.diagnostic_report}</Text>
            </View>

            <Text style={styles.sectionHeader}>{t('immediateSteps', 'Immediate Management Steps')}</Text>
            {result.immediate_actions.map((act, i) => (
              <View key={i} style={styles.actionItem}>
                <CheckCircle size={14} color={COLORS.primary} style={{ marginRight: 6, marginTop: 2 }} />
                <Text style={styles.actionText}>{act}</Text>
              </View>
            ))}

            <Text style={styles.sectionHeader}>{t('preventiveSteps', 'Preventive Field Practices')}</Text>
            {result.preventive_measures.map((prev, i) => (
              <View key={i} style={styles.actionItem}>
                <ShieldAlert size={14} color={COLORS.info} style={{ marginRight: 6, marginTop: 2 }} />
                <Text style={styles.actionText}>{prev}</Text>
              </View>
            ))}

            <Text style={styles.disclaimerText}>{result.disclaimer}</Text>
          </Card>
        )
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  engineNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  engineNoticeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  placeholderDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: RADIUS.md,
  },
  pickerButtonRow: {
    marginTop: SPACING.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerBg,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    marginTop: SPACING.sm,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    flex: 1,
  },
  invalidCard: {
    borderColor: COLORS.warning,
    borderWidth: 1.5,
    backgroundColor: '#fffbeb',
  },
  invalidHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  invalidHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400e',
    flex: 1,
  },
  invalidDesc: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
    marginVertical: SPACING.xs,
  },
  invalidTipsBox: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  invalidTipsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  invalidTipItem: {
    fontSize: 11,
    color: '#78350f',
    lineHeight: 16,
    marginBottom: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  conditionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    flex: 1,
  },
  severityBadge: {
    backgroundColor: COLORS.dangerBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    marginLeft: 8,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.danger,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
    marginBottom: 6,
  },
  reportBox: {
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reportText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  disclaimerText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});
