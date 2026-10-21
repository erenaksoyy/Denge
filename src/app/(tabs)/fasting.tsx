import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Ring } from '@/components/ring';
import { Sheet } from '@/components/sheet';
import { TabHeader } from '@/components/tab-header';
import { Button, Card, Chip, Divider, SectionTitle, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { addDays, clock, dayKey, hoursMinutes, monthDayShort, startOfWeek, timeHM, weekdayShort } from '@/lib/dates';
import { confirmDialog } from '@/lib/dialogs';
import { haptic } from '@/lib/haptics';
import type { FastRecord } from '@/lib/types';
import { fastGoalHours, useStore } from '@/store/store';
import { colors, radius, space } from '@/theme';

const HOUR = 3_600_000;

export default function FastingScreen() {
  const { t, locale } = useT();
  const insets = useSafeAreaInsets();
  const fasting = useStore((s) => s.fasting);
  const startFast = useStore((s) => s.startFast);
  const setFastStart = useStore((s) => s.setFastStart);
  const endFast = useStore((s) => s.endFast);
  const cancelFast = useStore((s) => s.cancelFast);
  const removeFast = useStore((s) => s.removeFast);
  const [now, setNow] = useState(() => Date.now());
  const [adjusting, setAdjusting] = useState(false);
  const [result, setResult] = useState<FastRecord | null>(null);

  const active = fasting.active;
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  const goalHours = active ? active.goalHours : fastGoalHours(fasting);
  const planLabel = t(
    fasting.planId === 'custom'
      ? 'fasting.plans.custom'
      : fasting.planId === 'circadian'
        ? 'fasting.plans.circadian'
        : (`fasting.plans.p${fasting.planId}` as 'fasting.plans.p16_8'),
  );

  const startMs = active ? new Date(active.start).getTime() : 0;
  const elapsed = active ? Math.max(0, now - startMs) : 0;
  const goalMs = goalHours * HOUR;
  const progress = active ? elapsed / goalMs : 0;
  const pct = Math.min(100, Math.round(progress * 100));

  const formatDuration = (ms: number) => {
    const { h, m } = hoursMinutes(ms);
    return `${h} ${t('common.hours')} ${m} ${t('common.min')}`;
  };

  const finish = async () => {
    const ok = await confirmDialog({
      title: t('fasting.endTitle'),
      confirmText: t('fasting.end'),
      cancelText: t('common.cancel'),
    });
    if (!ok) return;
    const record = endFast();
    if (record) {
      haptic.success();
      setResult(record);
    }
  };

  const cancel = async () => {
    const ok = await confirmDialog({
      title: t('fasting.cancelFast'),
      message: t('fasting.cancelConfirm'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (ok) cancelFast();
  };

  const remove = async (record: FastRecord) => {
    const ok = await confirmDialog({
      title: t('fasting.deleteFast'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (ok) removeFast(record.id);
  };

  const shiftStart = (minutes: number) => {
    if (!active) return;
    const next = Math.min(now, startMs + minutes * 60_000);
    setFastStart(new Date(next).toISOString());
  };

  // Completed fasts by the day they ended, for the week overview.
  const monday = startOfWeek(new Date(now));
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const key = dayKey(date);
    const fasts = fasting.history.filter((f) => dayKey(new Date(f.end)) === key);
    const hit = fasts.some((f) => new Date(f.end).getTime() - new Date(f.start).getTime() >= f.goalHours * HOUR);
    return { date, key, status: fasts.length ? (hit ? 'hit' : 'missed') : 'none' };
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <TabHeader title={t('fasting.title')} />
        <View style={styles.content}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/fasting-plans')}
            style={({ pressed }) => [styles.plan, pressed && { opacity: 0.7 }]}>
            <Icon name="fasting" size={16} color={colors.fasting} />
            <Txt variant="callout">
              {t('fasting.plan')}: {planLabel}
            </Txt>
            <Icon name="chevronDown" size={14} color={colors.textSecondary} />
          </Pressable>

          <Card style={styles.main}>
            <Ring size={250} stroke={18} progress={progress} color={colors.fasting} track={colors.fastingSoft}>
              {active ? (
                <>
                  <Txt variant="caption" color={colors.textSecondary}>
                    {t('fasting.fastingNow')}
                  </Txt>
                  <Txt variant="number" style={{ fontVariant: ['tabular-nums'] }}>
                    {clock(elapsed)}
                  </Txt>
                  <Txt variant="callout" color={colors.fasting}>
                    %{pct}
                  </Txt>
                  <Txt variant="caption" color={colors.textSecondary}>
                    {elapsed < goalMs
                      ? `${t('fasting.remaining')} ${clock(goalMs - elapsed)}`
                      : t('fasting.hoursGoal', { hours: goalHours })}
                  </Txt>
                </>
              ) : (
                <>
                  <Txt variant="caption" color={colors.textSecondary}>
                    {t('fasting.nextFast')}
                  </Txt>
                  <Txt variant="number">
                    {goalHours} {t('common.hours')}
                  </Txt>
                  <Txt variant="caption" color={colors.textSecondary}>
                    {t('fasting.hoursGoal', { hours: goalHours })}
                  </Txt>
                </>
              )}
            </Ring>

            {active ? (
              <View style={{ alignSelf: 'stretch', gap: space.sm }}>
                {elapsed >= goalMs ? (
                  <Txt variant="callout" color={colors.brand} center>
                    {t('fasting.goalReachedLive')}
                  </Txt>
                ) : null}
                <View style={styles.times}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setAdjusting(true)}
                    style={({ pressed }) => [styles.time, pressed && { opacity: 0.7 }]}>
                    <Txt variant="caption" color={colors.textSecondary}>
                      {t('fasting.startedAt', { time: '' }).trim()}
                    </Txt>
                    <View style={styles.inline}>
                      <Txt variant="headline">{timeHM(active.start, locale)}</Txt>
                      <Icon name="pencil" size={12} color={colors.textSecondary} />
                    </View>
                  </Pressable>
                  <View style={styles.time}>
                    <Txt variant="caption" color={colors.textSecondary}>
                      {t('fasting.endsAt', { time: '' }).trim()}
                    </Txt>
                    <Txt variant="headline">{timeHM(new Date(startMs + goalMs).toISOString(), locale)}</Txt>
                  </View>
                </View>
                <Button title={t('fasting.end')} icon="stop" onPress={finish} />
                <Button title={t('fasting.cancelFast')} variant="ghost" small onPress={cancel} />
              </View>
            ) : (
              <Button
                title={t('fasting.start')}
                icon="play"
                style={{ alignSelf: 'stretch', backgroundColor: colors.fasting }}
                onPress={() => {
                  haptic.success();
                  startFast();
                  setNow(Date.now());
                }}
              />
            )}
          </Card>

          <Card style={styles.week}>
            {week.map((d) => (
              <View key={d.key} style={styles.weekDay}>
                <Txt variant="micro" color={colors.textTertiary}>
                  {weekdayShort(d.date, locale).slice(0, 2)}
                </Txt>
                <View
                  style={[
                    styles.weekDot,
                    d.status === 'hit' && { backgroundColor: colors.fasting, borderColor: colors.fasting },
                    d.status === 'missed' && { borderColor: colors.fasting },
                  ]}>
                  {d.status === 'hit' ? <Icon name="check" size={12} color={colors.onPrimary} /> : null}
                </View>
              </View>
            ))}
          </Card>

          <Card onPress={() => router.push('/fasting-info')} style={styles.info}>
            <View style={styles.infoIcon}>
              <Icon name="info" size={20} color={colors.fasting} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="headline">{t('fasting.infoTitle')}</Txt>
              <Txt variant="caption" color={colors.textSecondary}>
                {t('fasting.infoSubtitle')}
              </Txt>
            </View>
            <Icon name="chevronRight" size={14} color={colors.textTertiary} />
          </Card>

          <SectionTitle>{t('fasting.history')}</SectionTitle>
          <Card style={{ paddingVertical: space.sm }}>
            {fasting.history.length === 0 ? (
              <Txt variant="callout" color={colors.textSecondary} style={{ paddingVertical: space.md }}>
                {t('fasting.noHistory')}
              </Txt>
            ) : (
              fasting.history.slice(0, 15).map((f, i) => {
                const ms = new Date(f.end).getTime() - new Date(f.start).getTime();
                const hit = ms >= f.goalHours * HOUR;
                return (
                  <View key={f.id}>
                    {i > 0 ? <Divider /> : null}
                    <Pressable
                      accessibilityRole="button"
                      onLongPress={() => void remove(f)}
                      style={({ pressed }) => [styles.historyRow, pressed && { opacity: 0.6 }]}>
                      <View style={[styles.historyIcon, { backgroundColor: hit ? colors.fastingSoft : colors.cardMuted }]}>
                        <Icon name={hit ? 'check' : 'timer'} size={16} color={hit ? colors.fasting : colors.textSecondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Txt variant="callout">{formatDuration(ms)}</Txt>
                        <Txt variant="caption" color={colors.textSecondary}>
                          {monthDayShort(new Date(f.start), locale)} {timeHM(f.start, locale)} →{' '}
                          {timeHM(f.end, locale)}
                        </Txt>
                      </View>
                      <Txt variant="caption" color={colors.textTertiary}>
                        {t('fasting.hoursGoal', { hours: f.goalHours })}
                      </Txt>
                    </Pressable>
                  </View>
                );
              })
            )}
          </Card>
        </View>
      </ScrollView>

      <Sheet visible={adjusting} onClose={() => setAdjusting(false)} title={t('fasting.adjustStart')} subtitle={t('fasting.adjustHint')}>
        {active ? (
          <>
            <Txt variant="number" center>
              {timeHM(active.start, locale)}
            </Txt>
            <View style={styles.chips}>
              {[-60, -15, 15, 60].map((m) => (
                <Chip
                  key={m}
                  label={`${m > 0 ? '+' : '−'}${Math.abs(m) >= 60 ? `${Math.abs(m) / 60} ${t('common.hours')}` : `${Math.abs(m)} ${t('common.min')}`}`}
                  onPress={() => shiftStart(m)}
                />
              ))}
            </View>
          </>
        ) : null}
        <Button title={t('common.done')} onPress={() => setAdjusting(false)} />
      </Sheet>

      <Sheet visible={result !== null} onClose={() => setResult(null)} title={t('fasting.resultTitle')}>
        {result ? (
          <Txt variant="body">
            {(() => {
              const ms = new Date(result.end).getTime() - new Date(result.start).getTime();
              const key = ms >= result.goalHours * HOUR ? 'fasting.resultHit' : 'fasting.resultMissed';
              return t(key, { duration: formatDuration(ms), hours: result.goalHours });
            })()}
          </Txt>
        ) : null}
        <Button title={t('common.done')} onPress={() => setResult(null)} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.lg, gap: space.md },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    alignSelf: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: space.lg,
    height: 40,
    borderRadius: radius.pill,
  },
  main: { alignItems: 'center', gap: space.xl, paddingVertical: space.xl },
  times: { flexDirection: 'row', gap: space.sm },
  time: { flex: 1, backgroundColor: colors.cardMuted, borderRadius: radius.md, padding: space.md, gap: 2 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', gap: 6 },
  weekDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.fastingSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  historyIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
});
