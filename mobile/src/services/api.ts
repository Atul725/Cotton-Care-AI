import { Platform } from 'react-native';
import {
  HealthStatus,
  FarmerProfile,
  ModelInfo,
  YieldPredictionInput,
  YieldPredictionResult,
  DiseaseDetectionResult,
  RecommendationResult,
  AssistantResponse,
  HistoryData,
  WeatherData,
  WeatherAlert,
  NotificationPrefs,
  LocationOption
} from '../types';

// Default development base URLs
// Android Emulator uses 10.0.2.2 to access host PC's localhost
// Physical phone uses the computer's LAN IP (e.g., http://192.168.1.X:8000/api)
const DEFAULT_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api',
  ios: 'http://localhost:8000/api',
  default: 'http://127.0.0.1:8000/api',
});

export const normalizeApiUrl = (rawUrl: string): string => {
  let url = (rawUrl || '').trim();
  if (!url) return DEFAULT_URL;
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }
  url = url.replace(/\/+$/, '');
  if (!/\/api$/i.test(url)) {
    url = `${url}/api`;
  }
  return url;
};

let currentApiBase = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL);

export const getApiBaseUrl = (): string => currentApiBase;
export const setApiBaseUrl = (newUrl: string): string => {
  currentApiBase = normalizeApiUrl(newUrl);
  return currentApiBase;
};

const REQUEST_TIMEOUT_MS = 15000;

async function requestWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. Target: ${url}. Ensure the backend is running.`);
    }
    const nativeMsg = err?.message || 'Network request failed';
    throw new Error(
      `Cannot connect to backend (${nativeMsg}). Target: ${url}. Verify: 1) Phone & PC are on the same Wi-Fi; 2) Windows Firewall allows port 8000; 3) IP address is correct.`
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export const mobileApi = {
  // System Health
  async getHealth(): Promise<HealthStatus> {
    const res = await requestWithTimeout(`${currentApiBase}/health`);
    if (!res.ok) throw new Error(`Health check failed (HTTP ${res.status})`);
    return res.json();
  },

  // Farmer Profile
  async getFarmerProfile(identifier: string = 'demo_farmer'): Promise<FarmerProfile> {
    const res = await requestWithTimeout(`${currentApiBase}/users/profile?identifier=${encodeURIComponent(identifier)}`);
    if (!res.ok) throw new Error('Failed to retrieve farmer profile');
    return res.json();
  },

  async updateFarmerProfile(profile: Partial<FarmerProfile>, identifier: string = 'demo_farmer'): Promise<FarmerProfile> {
    const res = await requestWithTimeout(`${currentApiBase}/users/profile?identifier=${encodeURIComponent(identifier)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error('Failed to update farmer profile');
    return res.json();
  },

  // Yield Model Info
  async getModelInfo(): Promise<ModelInfo> {
    const res = await requestWithTimeout(`${currentApiBase}/yield/model-info`);
    if (!res.ok) throw new Error('Failed to load yield model info');
    return res.json();
  },

  // Yield Prediction
  async predictYield(input: YieldPredictionInput): Promise<YieldPredictionResult> {
    const res = await requestWithTimeout(`${currentApiBase}/yield/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Prediction failed' }));
      throw new Error(err.detail || 'Failed to predict cotton yield');
    }
    return res.json();
  },

  // Agronomic Recommendations
  async getRecommendations(
    cropDays: number,
    landAcres: number,
    soilType: string = 'काळी माती (Black Soil)',
    waterSource: string = 'विहीर / बोरवेल (Irrigated)'
  ): Promise<RecommendationResult> {
    const res = await requestWithTimeout(`${currentApiBase}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crop_days: cropDays,
        land_acres: landAcres,
        soil_type: soilType,
        water_source: waterSource,
      }),
    });
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  },

  // Disease Detection (Multi-part image upload)
  async detectDisease(
    fileUri: string,
    fileName: string = 'leaf.jpg',
    mimeType: string = 'image/jpeg',
    userIdentifier: string = 'demo_farmer'
  ): Promise<DiseaseDetectionResult> {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);
    formData.append('user_identifier', userIdentifier);

    const res = await requestWithTimeout(`${currentApiBase}/disease/predict`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Diagnosis failed' }));
      throw new Error(err.detail || 'Crop disease inspection failed');
    }
    return res.json();
  },

  // AI Assistant Chat
  async chatWithAssistant(
    question: string,
    language: string = 'English',
    context?: string
  ): Promise<AssistantResponse> {
    const res = await requestWithTimeout(`${currentApiBase}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, language, context }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Assistant chat error' }));
      throw new Error(err.detail || 'Assistant request failed');
    }
    return res.json();
  },

  // Prediction & Scan History
  async getHistory(userIdentifier: string = 'demo_farmer', category: string = 'all'): Promise<HistoryData> {
    const res = await requestWithTimeout(
      `${currentApiBase}/history?user_identifier=${encodeURIComponent(userIdentifier)}&category=${encodeURIComponent(category)}`
    );
    if (!res.ok) throw new Error('Failed to fetch history logs');
    return res.json();
  },

  // Weather & Rain Alerts
  async getWeatherLocations(): Promise<LocationOption[]> {
    const res = await requestWithTimeout(`${currentApiBase}/weather/locations`);
    if (!res.ok) throw new Error('Failed to load cotton farming locations');
    return res.json();
  },

  async getWeatherForecast(params?: {
    latitude?: number;
    longitude?: number;
    location_name?: string;
    user_identifier?: string;
  }): Promise<WeatherData> {
    const q: string[] = [];
    if (params?.latitude !== undefined) q.push(`latitude=${params.latitude}`);
    if (params?.longitude !== undefined) q.push(`longitude=${params.longitude}`);
    if (params?.location_name) q.push(`location_name=${encodeURIComponent(params.location_name)}`);
    if (params?.user_identifier) q.push(`user_identifier=${encodeURIComponent(params.user_identifier)}`);

    const queryStr = q.length > 0 ? `?${q.join('&')}` : '';
    const res = await requestWithTimeout(`${currentApiBase}/weather/forecast${queryStr}`);
    if (!res.ok) throw new Error('Failed to fetch weather forecast');
    return res.json();
  },

  async getWeatherAlerts(userIdentifier: string = 'demo_farmer', unreadOnly: boolean = false): Promise<WeatherAlert[]> {
    const res = await requestWithTimeout(
      `${currentApiBase}/weather/alerts?user_identifier=${encodeURIComponent(userIdentifier)}&unread_only=${unreadOnly}`
    );
    if (!res.ok) throw new Error('Failed to load weather alerts');
    return res.json();
  },

  async markAlertRead(alertId: number): Promise<{ status: string }> {
    const res = await requestWithTimeout(`${currentApiBase}/weather/alerts/${alertId}/read`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to mark alert as read');
    return res.json();
  },

  async markAllAlertsRead(userIdentifier: string = 'demo_farmer'): Promise<{ status: string; marked_read_count: number }> {
    const res = await requestWithTimeout(`${currentApiBase}/weather/alerts/read-all?user_identifier=${encodeURIComponent(userIdentifier)}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to mark all alerts as read');
    return res.json();
  },

  async getNotificationPrefs(userIdentifier: string = 'demo_farmer'): Promise<NotificationPrefs> {
    const res = await requestWithTimeout(`${currentApiBase}/weather/preferences?user_identifier=${encodeURIComponent(userIdentifier)}`);
    if (!res.ok) throw new Error('Failed to load notification preferences');
    return res.json();
  },

  async updateNotificationPrefs(prefs: Partial<NotificationPrefs>, userIdentifier: string = 'demo_farmer'): Promise<NotificationPrefs> {
    const res = await requestWithTimeout(`${currentApiBase}/weather/preferences?user_identifier=${encodeURIComponent(userIdentifier)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs)
    });
    if (!res.ok) throw new Error('Failed to update notification preferences');
    return res.json();
  },

  async registerPushToken(token: string, userIdentifier: string = 'demo_farmer', deviceId?: string, platform: string = 'android'): Promise<any> {
    const res = await requestWithTimeout(`${currentApiBase}/notifications/register-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_identifier: userIdentifier,
        expo_push_token: token,
        device_id: deviceId,
        platform
      })
    });
    if (!res.ok) throw new Error('Failed to register device token');
    return res.json();
  },

  async testPushNotification(userIdentifier: string = 'demo_farmer', title?: string, body?: string): Promise<any> {
    const res = await requestWithTimeout(`${currentApiBase}/notifications/test-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_identifier: userIdentifier,
        title: title || 'CottonCare Test Alert',
        body: body || 'Real-time test notification sent from CottonCare mobile.'
      })
    });
    if (!res.ok) throw new Error('Failed to send test push notification');
    return res.json();
  }
};
