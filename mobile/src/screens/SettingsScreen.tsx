import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Settings as SettingsIcon, Server, User, Globe, CheckCircle2, AlertCircle, RefreshCw, Bell, Check } from 'lucide-react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { mobileApi, getApiBaseUrl, setApiBaseUrl } from '../services/api';
import { FarmerProfile } from '../types';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { SupportedLanguage } from '../i18n/translations';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { language, setLanguage, t } = useLanguage();
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [profile, setProfile] = useState<FarmerProfile>({
    identifier: 'demo_farmer',
    name: 'शेतकरी मित्र',
    location: 'छत्रपती संभाजीनगर',
    contact_number: '+91 98765 00000',
    land_acres: 3.0,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [pingLoading, setPingLoading] = useState(false);

  const languageOptions: { label: string; code: SupportedLanguage }[] = [
    { label: 'मराठी', code: 'mr' },
    { label: 'English', code: 'en' },
    { label: 'हिंदी', code: 'hi' },
  ];

  useEffect(() => {
    mobileApi.getFarmerProfile('demo_farmer')
      .then((p) => setProfile(p))
      .catch(() => {});
  }, []);

  const handleSaveApiUrl = () => {
    const normalized = setApiBaseUrl(apiUrl);
    setApiUrl(normalized);
    Alert.alert('API URL Updated', `Backend API URL configured to:\n${normalized}`);
  };

  const handleTestConnection = async () => {
    setPingLoading(true);
    setPingStatus(null);
    try {
      const normalized = setApiBaseUrl(apiUrl);
      setApiUrl(normalized);
      const startTime = Date.now();
      const health = await mobileApi.getHealth();
      const latency = Date.now() - startTime;
      setPingStatus(`Connected! (${latency}ms)\nVersion: ${health.version} • Model: ${health.model_loaded ? 'Loaded' : 'Not Found'}\nEndpoint: ${normalized}/health`);
    } catch (err: any) {
      setPingStatus(`Connection Failed:\n${err.message}`);
    } finally {
      setPingLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const updated = await mobileApi.updateFarmerProfile(profile, 'demo_farmer');
      setProfile(updated);
      Alert.alert(t('success', 'Success'), t('profileSavedSuccess', 'Farmer profile updated successfully in the local database.'));
    } catch (err: any) {
      Alert.alert(t('error', 'Error'), err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header
        title={t('settingsScreenTitle', 'Settings & Profile')}
        subtitle={t('settingsScreenSubtitle', 'Network Config, Language & Farmer Details')}
        onBack={() => navigation.goBack()}
      />

      {/* Language Selection Card */}
      <Card variant="default">
        <View style={styles.cardHeaderWithIcon}>
          <Globe size={18} color={COLORS.primary} />
          <Text style={styles.cardHeaderTitle}>{t('languageCardTitle', 'App Language / भाषा निवडा')}</Text>
        </View>
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

      {/* Backend Connection Card */}
      <Card variant="default">
        <View style={styles.cardHeaderWithIcon}>
          <Server size={18} color={COLORS.primary} />
          <Text style={styles.cardHeaderTitle}>{t('backendCardTitle', 'FastAPI Backend Connection')}</Text>
        </View>
        <Text style={styles.hintText}>
          Android Emulator: http://10.0.2.2:8000/api{'\n'}
          Physical Phone: http://[PC_WIFI_IP]:8000/api
        </Text>

        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="http://10.0.2.2:8000/api"
        />

        <View style={styles.buttonRow}>
          <Button
            title={t('saveUrl', 'Save URL')}
            onPress={handleSaveApiUrl}
            variant="secondary"
            size="sm"
            style={{ flex: 1 }}
          />
          <Button
            title={t('testConnection', 'Test Connection')}
            onPress={handleTestConnection}
            loading={pingLoading}
            variant="primary"
            size="sm"
            style={{ flex: 1 }}
          />
        </View>

        {pingStatus && (
          <View style={[styles.pingBox, pingStatus.startsWith('Connected') ? styles.pingSuccess : styles.pingError]}>
            <Text style={styles.pingText}>{pingStatus}</Text>
          </View>
        )}
      </Card>

      {/* Farmer Profile Editor */}
      <Card variant="default">
        <View style={styles.cardHeaderWithIcon}>
          <User size={18} color={COLORS.primary} />
          <Text style={styles.cardHeaderTitle}>{t('farmerProfileTitle', 'Farmer Profile Details')}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('farmerName', 'Farmer Name')}</Text>
          <TextInput
            style={styles.input}
            value={profile.name}
            onChangeText={(v) => setProfile((prev) => ({ ...prev, name: v }))}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('farmerLocation', 'Location / District')}</Text>
          <TextInput
            style={styles.input}
            value={profile.location}
            onChangeText={(v) => setProfile((prev) => ({ ...prev, location: v }))}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('registeredAcres', 'Registered Plot Size (Acres)')}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(profile.land_acres)}
            onChangeText={(v) => setProfile((prev) => ({ ...prev, land_acres: parseFloat(v) || 1 }))}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('contactNumber', 'Contact Helpline Number')}</Text>
          <TextInput
            style={styles.input}
            value={profile.contact_number || ''}
            onChangeText={(v) => setProfile((prev) => ({ ...prev, contact_number: v }))}
          />
        </View>

        <Button
          title={t('saveProfile', 'Save Farmer Profile')}
          onPress={handleSaveProfile}
          loading={savingProfile}
          size="md"
          style={{ marginTop: SPACING.xs }}
        />
      </Card>

      {/* Push Notifications Configuration Card */}
      <Card variant="default">
        <View style={styles.cardHeaderWithIcon}>
          <Bell size={18} color={COLORS.primary} />
          <Text style={styles.cardHeaderTitle}>{t('pushAlertSettings', 'Weather Push Notification Settings')}</Text>
        </View>
        <Text style={styles.hintText}>
          Receive advance alerts when rain, high winds, or heat stress are forecast near your farm.
        </Text>

        <View style={styles.buttonRow}>
          <Button
            title="Register Device"
            onPress={async () => {
              try {
                const token = `ExponentPushToken[cottoncare_demo_${Date.now().toString(36)}]`;
                await mobileApi.registerPushToken(token, 'demo_farmer', 'android_device_main', 'android');
                Alert.alert('Registered', 'Your device is registered to receive scheduled rain and weather alerts.');
              } catch (err: any) {
                Alert.alert('Registration Error', err.message);
              }
            }}
            variant="secondary"
            size="sm"
            style={{ flex: 1 }}
          />
          <Button
            title={t('sendTestNotification', 'Send Test Alert')}
            onPress={async () => {
              try {
                const res = await mobileApi.testPushNotification('demo_farmer');
                Alert.alert('Dispatched', `Test alert dispatched. Devices notified: ${res.devices_notified ?? 0}`);
              } catch (err: any) {
                Alert.alert('Error', err.message);
              }
            }}
            variant="primary"
            size="sm"
            style={{ flex: 1 }}
          />
        </View>
      </Card>

      {/* Academic Credits */}
      <Card variant="highlight">
        <Text style={styles.academicTitle}>CottonCare AI Platform</Text>
        <Text style={styles.academicSub}>B.Tech AI & Data Science Project</Text>
        <Text style={styles.academicText}>
          Department of Computer Science & Engineering{'\n'}
          Maharashtra Institute of Technology (MIT), Chhatrapati Sambhajinagar
        </Text>
      </Card>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  cardHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.xs,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  languageRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: 4,
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
  hintText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    lineHeight: 16,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  pingBox: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  pingSuccess: {
    backgroundColor: COLORS.primaryBg,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  pingError: {
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
  },
  pingText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  field: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  academicTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  academicSub: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  academicText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
});
