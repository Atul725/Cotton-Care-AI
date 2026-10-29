import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Send, Bot, User, Globe, AlertCircle } from 'lucide-react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Header } from '../components/Header';
import { mobileApi } from '../services/api';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { SupportedLanguage } from '../i18n/translations';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  provider?: string;
  error?: boolean;
}

export const AssistantChatScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { language, setLanguage, t } = useLanguage();

  const getLanguageName = (lang: SupportedLanguage): 'Marathi' | 'English' | 'Hindi' => {
    if (lang === 'mr') return 'Marathi';
    if (lang === 'hi') return 'Hindi';
    return 'English';
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: t('chatWelcome', 'Namaste! I am your CottonCare AI assistant. Ask me anything about cotton pests, fertilizer doses, irrigation schedules, or current rain forecasts.'),
      provider: 'CottonCare Advisory',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Update initial message if language changes and only welcome message is present
  useEffect(() => {
    if (messages.length === 1 && messages[0].sender === 'assistant') {
      setMessages([
        {
          id: '1',
          sender: 'assistant',
          text: t('chatWelcome', 'Namaste! I am your CottonCare AI assistant. Ask me anything about cotton pests, fertilizer doses, irrigation schedules, or current rain forecasts.'),
          provider: 'CottonCare Advisory',
        },
      ]);
    }
  }, [language]);

  const followups: Record<SupportedLanguage, string[]> = {
    mr: [
      'फुलोरा अवस्थेत कोणते खत द्यावे?',
      'गुलाबी बोंड अळीचे नियंत्रण कसे करावे?',
      'फवारणीसाठी आजचे हवामान कसे आहे?',
    ],
    hi: [
      'फूल आने के समय कौन सा खाद डालें?',
      'गुलाबी सुंडी से कैसे बचें?',
      'कपास में सिंचाई का सही समय क्या है?',
    ],
    en: [
      'Best fertilizer dose during flowering?',
      'How to control Pink Bollworm?',
      'Ideal soil moisture for cotton?',
    ],
  };

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const activeLanguageName = getLanguageName(language);
      const res = await mobileApi.chatWithAssistant(q, activeLanguageName);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.answer,
        provider: res.provider,
        error: Boolean(res.error),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: err.message || 'Unable to connect to AI assistant. Please check your backend connection.',
        provider: 'Network Error',
        error: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const languageOptions: { label: string; code: SupportedLanguage }[] = [
    { label: 'मरा', code: 'mr' },
    { label: 'हिं', code: 'hi' },
    { label: 'EN', code: 'en' },
  ];

  return (
    <ScreenWrapper scrollable={false}>
      <Header
        title={t('chatTitle', 'CottonCare Assistant')}
        subtitle={t('chatSubtitle', 'Grounded Agronomic AI Companion')}
        onBack={() => navigation.goBack()}
        rightElement={
          <View style={styles.langSelector}>
            {languageOptions.map((opt) => (
              <TouchableOpacity
                key={opt.code}
                onPress={() => setLanguage(opt.code)}
                style={[styles.langBtn, language === opt.code && styles.langBtnActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.langBtnText, language === opt.code && styles.langBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        }
      />

      {/* Messages Scroll View */}
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => (
          <View
            key={m.id}
            style={[
              styles.bubbleRow,
              m.sender === 'user' ? styles.bubbleRowUser : styles.bubbleRowBot,
            ]}
          >
            {m.sender === 'assistant' && (
              <View style={[styles.avatar, m.error && styles.avatarError]}>
                <Bot size={16} color={m.error ? COLORS.danger : COLORS.primary} />
              </View>
            )}
            <View
              style={[
                styles.bubble,
                m.sender === 'user' ? styles.bubbleUser : styles.bubbleBot,
                m.error && styles.bubbleError,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  m.sender === 'user' ? styles.bubbleTextUser : styles.bubbleTextBot,
                ]}
              >
                {m.text}
              </Text>
              {m.provider && (
                <Text style={styles.providerTag}>{m.provider}</Text>
              )}
            </View>
            {m.sender === 'user' && (
              <View style={[styles.avatar, styles.avatarUser]}>
                <User size={16} color="#ffffff" />
              </View>
            )}
          </View>
        ))}

        {loading && (
          <View style={styles.loadingBubble}>
            <Text style={styles.loadingText}>Thinking in {getLanguageName(language)}...</Text>
          </View>
        )}
      </ScrollView>

      {/* Suggested Followups */}
      <View style={styles.followupsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {(followups[language] || followups.en).map((prompt, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => handleSend(prompt)}
              style={styles.followupChip}
            >
              <Text style={styles.followupText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={10}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder={t('chatPlaceholder', 'Ask a cotton farming question...')}
            placeholderTextColor={COLORS.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={300}
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!input.trim() || loading}
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          >
            <Send size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  langSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    padding: 2,
    gap: 2,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  langBtnActive: {
    backgroundColor: COLORS.primary,
  },
  langBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  langBtnTextActive: {
    color: '#ffffff',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowBot: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  avatarUser: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  avatarError: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
  },
  bubbleBot: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleError: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  bubbleTextBot: {
    color: COLORS.textPrimary,
  },
  bubbleTextUser: {
    color: '#ffffff',
    fontWeight: '500',
  },
  providerTag: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  loadingBubble: {
    padding: SPACING.sm,
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
  },
  loadingText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  followupsRow: {
    paddingVertical: 6,
  },
  followupChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  followupText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  textInput: {
    flex: 1,
    maxHeight: 80,
    fontSize: 13,
    color: COLORS.textPrimary,
    paddingVertical: 4,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
