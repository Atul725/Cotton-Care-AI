import {
  HealthStatus,
  FarmerProfile,
  DatasetSummary,
  DatasetUploadResult,
  AnalyticsSummary,
  YieldPredictionInput,
  YieldPredictionResult,
  ModelInfo,
  DiseaseDetectionResult,
  AssistantResponse,
  RecommendationResult,
  HistoryData,
  WeatherData,
  WeatherAlert,
  NotificationPrefs,
  LocationOption
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';
const TOKEN_KEY = 'cottoncare_auth_token';
const USER_KEY = 'cottoncare_auth_user';

export interface AuthUser {
  id: number;
  identifier: string;
  email?: string;
  name: string;
  location: string;
  land_acres: number;
  auth_provider: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
  message: string;
}

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredAuth = (token: string | null, user: AuthUser | null) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch (e) {
    console.warn('Could not store auth in localStorage:', e);
  }
};

export const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const authHeaders = (customHeaders: Record<string, string> = {}): Record<string, string> => {
  const token = getStoredToken();
  const headers: Record<string, string> = { ...customHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // --- Authentication ---
  async login(usernameOrEmail: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username_or_email: usernameOrEmail,
        password
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(err.detail || 'Invalid username or password.');
    }
    const data: AuthResponse = await res.json();
    setStoredAuth(data.access_token, data.user);
    return data;
  },

  async register(registerData: {
    username: string;
    password: string;
    email?: string;
    name?: string;
    location?: string;
    land_acres?: number;
    contact_number?: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed.');
    }
    const data: AuthResponse = await res.json();
    setStoredAuth(data.access_token, data.user);
    return data;
  },

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Google sign-in failed' }));
      throw new Error(err.detail || 'Google sign-in failed.');
    }
    const data: AuthResponse = await res.json();
    setStoredAuth(data.access_token, data.user);
    return data;
  },

  async getMe(): Promise<AuthUser | null> {
    const token = getStoredToken();
    if (!token) return null;
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      setStoredAuth(null, null);
      return null;
    }
    return res.json();
  },

  logout() {
    setStoredAuth(null, null);
  },

  // --- System Health ---
  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch system health');
    return res.json();
  },

  // --- Farmer Profile ---
  async getProfile(identifier: string = 'demo_farmer'): Promise<FarmerProfile> {
    const res = await fetch(`${API_BASE}/users/profile?identifier=${encodeURIComponent(identifier)}`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch farmer profile');
    return res.json();
  },

  async updateProfile(profile: Partial<FarmerProfile>, identifier: string = 'demo_farmer'): Promise<FarmerProfile> {
    const res = await fetch(`${API_BASE}/users/profile?identifier=${encodeURIComponent(identifier)}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(profile)
    });
    if (!res.ok) throw new Error('Failed to update farmer profile');
    return res.json();
  },

  // --- Datasets & Analytics ---
  async uploadDataset(file: File): Promise<DatasetUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/datasets/upload`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async listDatasets(): Promise<DatasetSummary[]> {
    const res = await fetch(`${API_BASE}/datasets`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to list datasets');
    return res.json();
  },

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const res = await fetch(`${API_BASE}/analytics/summary`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch analytics summary');
    return res.json();
  },

  // --- Yield Prediction ---
  async predictYield(input: YieldPredictionInput): Promise<YieldPredictionResult> {
    const res = await fetch(`${API_BASE}/yield/predict`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(input)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Prediction failed' }));
      throw new Error(err.detail || 'Prediction failed');
    }
    return res.json();
  },

  async getModelInfo(): Promise<ModelInfo> {
    const res = await fetch(`${API_BASE}/yield/model-info`);
    if (!res.ok) throw new Error('Failed to fetch model info');
    return res.json();
  },

  // --- Disease Detection ---
  async detectDisease(file: File, userIdentifier: string = 'demo_farmer'): Promise<DiseaseDetectionResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_identifier', userIdentifier);
    const res = await fetch(`${API_BASE}/disease/predict`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Diagnosis failed' }));
      throw new Error(err.detail || 'Diagnosis failed');
    }
    return res.json();
  },

  // --- Voice & Chat Assistant ---
  async chatWithAssistant(question: string, language: string = 'English', context?: string, signal?: AbortSignal): Promise<AssistantResponse> {
    const res = await fetch(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ question, language, context }),
      signal
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Assistant request failed' }));
      throw new Error(err.detail || 'Assistant request failed');
    }
    return res.json();
  },

  // --- Recommendations ---
  async getRecommendations(cropDays: number, landAcres: number, soilType: string, waterSource: string, recentWeather?: Record<string, any>): Promise<RecommendationResult> {
    const res = await fetch(`${API_BASE}/recommendations`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        crop_days: cropDays,
        land_acres: landAcres,
        soil_type: soilType,
        water_source: waterSource,
        recent_weather: recentWeather
      })
    });
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  },

  // --- History ---
  async getHistory(userIdentifier: string = 'demo_farmer', category: string = 'all'): Promise<HistoryData> {
    const res = await fetch(`${API_BASE}/history?user_identifier=${encodeURIComponent(userIdentifier)}&category=${encodeURIComponent(category)}`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  // --- Weather & Alerts ---
  async getWeatherLocations(): Promise<LocationOption[]> {
    const res = await fetch(`${API_BASE}/weather/locations`);
    if (!res.ok) throw new Error('Failed to fetch cotton farming locations');
    return res.json();
  },

  async getWeatherForecast(params?: {
    latitude?: number;
    longitude?: number;
    location_name?: string;
    user_identifier?: string;
  }): Promise<WeatherData> {
    const q = new URLSearchParams();
    if (params?.latitude !== undefined) q.append('latitude', String(params.latitude));
    if (params?.longitude !== undefined) q.append('longitude', String(params.longitude));
    if (params?.location_name) q.append('location_name', params.location_name);
    if (params?.user_identifier) q.append('user_identifier', params.user_identifier);

    const res = await fetch(`${API_BASE}/weather/forecast?${q.toString()}`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch weather forecast');
    return res.json();
  },

  async getWeatherAlerts(userIdentifier: string = 'demo_farmer', unreadOnly: boolean = false): Promise<WeatherAlert[]> {
    const res = await fetch(`${API_BASE}/weather/alerts?user_identifier=${encodeURIComponent(userIdentifier)}&unread_only=${unreadOnly}`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch weather alerts');
    return res.json();
  },

  async markAlertRead(alertId: number): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE}/weather/alerts/${alertId}/read`, {
      method: 'POST',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to mark alert as read');
    return res.json();
  },

  async markAllAlertsRead(userIdentifier: string = 'demo_farmer'): Promise<{ status: string; marked_read_count: number }> {
    const res = await fetch(`${API_BASE}/weather/alerts/read-all?user_identifier=${encodeURIComponent(userIdentifier)}`, {
      method: 'POST',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to mark all alerts as read');
    return res.json();
  },

  async getNotificationPrefs(userIdentifier: string = 'demo_farmer'): Promise<NotificationPrefs> {
    const res = await fetch(`${API_BASE}/weather/preferences?user_identifier=${encodeURIComponent(userIdentifier)}`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch notification preferences');
    return res.json();
  },

  async updateNotificationPrefs(prefs: Partial<NotificationPrefs>, userIdentifier: string = 'demo_farmer'): Promise<NotificationPrefs> {
    const res = await fetch(`${API_BASE}/weather/preferences?user_identifier=${encodeURIComponent(userIdentifier)}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(prefs)
    });
    if (!res.ok) throw new Error('Failed to update notification preferences');
    return res.json();
  },

  async registerPushToken(token: string, userIdentifier: string = 'demo_farmer', deviceId?: string, platform: string = 'web'): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/register-token`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        user_identifier: userIdentifier,
        expo_push_token: token,
        device_id: deviceId,
        platform
      })
    });
    if (!res.ok) throw new Error('Failed to register push token');
    return res.json();
  },

  async testPushNotification(userIdentifier: string = 'demo_farmer', title?: string, body?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/test-push`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        user_identifier: userIdentifier,
        title: title || 'CottonCare Test Alert',
        body: body || 'Real-time agricultural test notification from CottonCare AI.'
      })
    });
    if (!res.ok) throw new Error('Failed to send test push notification');
    return res.json();
  }
};
