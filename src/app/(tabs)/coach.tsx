import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { TabHeader } from '@/components/tab-header';
import { Chip, IconButton, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { ApiError, api, streamCoach } from '@/lib/api';
import { dayKey } from '@/lib/dates';
import { confirmDialog } from '@/lib/dialogs';
import { haptic } from '@/lib/haptics';
import { mealNutrients, uid } from '@/lib/meal';
import type { ChatMessage, CoachContext } from '@/lib/types';
import { calorieBudget, dayBurned, dayNutrients, doneMeals } from '@/store/selectors';
import { useStore } from '@/store/store';
import { colors, radius, space } from '@/theme';

const MAX_INPUT = 1000;
const HISTORY = 20;

function buildContext(): CoachContext | null {
  const s = useStore.getState();
  if (!s.profile) return null;
  const today = dayKey();
  const burned = dayBurned(s.exercises, today);
  const p = s.profile;
  return {
    profile: {
      sex: p.sex,
      age: p.age,
      heightCm: p.heightCm,
      weightKg: p.weightKg,
      targetWeightKg: p.targetWeightKg,
      goal: p.goal,
      diet: p.diet,
      activity: p.activity,
      obstacles: p.obstacles,
    },
    goals: { ...s.goals, calories: calorieBudget(s.goals, s.settings, burned) },
    today: { ...dayNutrients(s.meals, today), burned, waterMl: s.water[today] ?? 0 },
    meals: doneMeals(s.meals, today)
      .slice(-20)
      .map((m) => ({ name: m.name.slice(0, 100), calories: mealNutrients(m).calories })),
  };
}

/** Renders **bold** segments; everything else is plain text. */
function RichText({ text, color }: { text: string; color: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Txt variant="body" color={color} selectable>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <Txt key={i} variant="body" color={color} style={{ fontWeight: '700' }}>
            {part.slice(2, -2)}
          </Txt>
        ) : (
          part
        ),
      )}
    </Txt>
  );
}

export default function CoachScreen() {
  const { t, lang } = useT();
  const insets = useSafeAreaInsets();
  const chat = useStore((s) => s.chat);
  const addChat = useStore((s) => s.addChat);
  const patchChat = useStore((s) => s.patchChat);
  const clearChat = useStore((s) => s.clearChat);
  const [input, setInput] = useState('');
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [aiReady, setAiReady] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    api
      .status()
      .then((s) => setAiReady(s.ai))
      .catch(() => setAiReady(null));
  }, []);

  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(id);
  }, [chat]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (text: string) => {
    const content = text.trim().slice(0, MAX_INPUT);
    const context = buildContext();
    if (!content || streamingId || !context) return;
    haptic.light();
    setInput('');

    const userMsg: ChatMessage = { id: uid(), role: 'user', text: content, createdAt: new Date().toISOString(), status: 'done' };
    const replyId = uid();
    const history = [...useStore.getState().chat, userMsg]
      .filter((m) => m.status === 'done' && m.text)
      .slice(-HISTORY)
      .map((m) => ({ role: m.role, text: m.text }));
    // Gemini expects the conversation to start with a user turn.
    while (history.length && history[0].role !== 'user') history.shift();

    addChat(userMsg);
    addChat({ id: replyId, role: 'model', text: '', createdAt: new Date().toISOString(), status: 'streaming' });
    setStreamingId(replyId);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const full = await streamCoach({ messages: history, context, lang }, (partial) => patchChat(replyId, { text: partial }), controller.signal);
      const finalText = full || useStore.getState().chat.find((m) => m.id === replyId)?.text || '';
      patchChat(replyId, finalText ? { status: 'done', text: finalText } : { status: 'error', error: 'aiFailed' });
    } catch (error) {
      const code = error instanceof ApiError ? error.code : 'unknown';
      const partial = useStore.getState().chat.find((m) => m.id === replyId)?.text ?? '';
      patchChat(replyId, { status: 'error', error: code, text: partial });
    } finally {
      setStreamingId(null);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  const clear = async () => {
    const ok = await confirmDialog({
      title: t('coach.clear'),
      message: t('coach.clearConfirm'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (ok) {
      stop();
      clearChat();
    }
  };

  const errorText = (code?: string) => {
    switch (code) {
      case 'notConfigured':
        return t('errors.notConfigured');
      case 'network':
      case 'timeout':
        return t('errors.network');
      case 'rateLimited':
        return t('errors.rateLimited');
      default:
        return t('errors.aiFailed');
    }
  };

  const suggestions = [t('coach.suggestion1'), t('coach.suggestion2'), t('coach.suggestion3'), t('coach.suggestion4')];
  const lastUser = [...chat].reverse().find((m) => m.role === 'user');

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TabHeader
        title={t('coach.title')}
        subtitle={t('coach.subtitle')}
        right={
          chat.length ? <IconButton icon="trash" label={t('coach.clear')} onPress={clear} color={colors.textSecondary} /> : null
        }
      />
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
        {aiReady === false ? (
          <View style={styles.notice}>
            <Icon name="info" size={16} color={colors.warning} />
            <Txt variant="caption" color={colors.text} style={{ flex: 1 }}>
              {t('errors.notConfigured')}
            </Txt>
          </View>
        ) : null}

        <View style={[styles.bubble, styles.modelBubble]}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Icon name="sparkles" size={14} color={colors.fasting} />
            </View>
            <Txt variant="caption" color={colors.textSecondary}>
              {t('coach.title')}
            </Txt>
          </View>
          <Txt variant="body">{t('coach.intro')}</Txt>
          <Txt variant="micro" color={colors.textTertiary}>
            {t('coach.disclaimer')}
          </Txt>
        </View>

        {chat.length === 0 ? (
          <View style={styles.suggestions}>
            {suggestions.map((s) => (
              <Chip key={s} label={s} onPress={() => void send(s)} />
            ))}
          </View>
        ) : null}

        {chat.map((m) => {
          const mine = m.role === 'user';
          return (
            <View key={m.id} style={[styles.bubble, mine ? styles.userBubble : styles.modelBubble]}>
              {m.status === 'streaming' && !m.text ? (
                <View style={styles.typing}>
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                  <Txt variant="caption" color={colors.textSecondary}>
                    {t('coach.typing')}
                  </Txt>
                </View>
              ) : (
                <RichText text={m.text} color={mine ? colors.onPrimary : colors.text} />
              )}
              {m.status === 'error' ? (
                <View style={{ gap: space.sm }}>
                  <Txt variant="caption" color={colors.danger}>
                    {errorText(m.error)}
                  </Txt>
                  {lastUser && m.id === chat[chat.length - 1]?.id ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => void send(lastUser.text)}
                      style={styles.retry}>
                      <Icon name="refresh" size={14} color={colors.text} />
                      <Txt variant="caption">{t('common.retry')}</Txt>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: space.md }]}>
        <TextInput
          value={input}
          onChangeText={(v) => setInput(v.slice(0, MAX_INPUT))}
          placeholder={t('coach.placeholder')}
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          multiline
          accessibilityLabel={t('coach.placeholder')}
        />
        {streamingId ? (
          <IconButton icon="stop" label={t('coach.stop')} onPress={stop} background={colors.primary} color={colors.onPrimary} size={44} />
        ) : (
          <IconButton
            icon="send"
            label={t('coach.send')}
            onPress={() => void send(input)}
            disabled={!input.trim()}
            background={colors.primary}
            color={colors.onPrimary}
            size={44}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  messages: { paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.sm },
  notice: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'center',
    backgroundColor: colors.carbsSoft,
    borderRadius: radius.md,
    padding: space.md,
  },
  bubble: { maxWidth: '88%', borderRadius: radius.lg, padding: space.md, gap: space.sm },
  modelBubble: { alignSelf: 'flex-start', backgroundColor: colors.card, borderTopLeftRadius: 6 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderTopRightRadius: 6 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.fastingSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  typing: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.cardMuted,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 6,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.card,
    borderRadius: 22,
    paddingHorizontal: space.lg,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    color: colors.text,
  },
});
