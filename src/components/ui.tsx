import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { haptic } from '@/lib/haptics';
import { colors, radius, shadow, space, type as typeScale } from '@/theme';

import { Icon, type IconName } from './icon';

// ---- Text ----

type Variant = keyof typeof typeScale;

export function Txt({
  variant = 'body',
  color = colors.text,
  center,
  style,
  ...props
}: TextProps & { variant?: Variant; color?: string; center?: boolean }) {
  return (
    <Text
      {...props}
      style={[typeScale[variant] as TextStyle, { color }, center && { textAlign: 'center' }, style]}
    />
  );
}

// ---- Surfaces ----

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <Txt variant="headline">{children}</Txt>
      {action}
    </View>
  );
}

// ---- Buttons ----

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'brand';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  small,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const palette = BUTTONS[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        haptic.tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: palette.bg },
        inactive && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={small ? 16 : 18} color={palette.fg} /> : null}
          <Txt variant={small ? 'callout' : 'headline'} color={palette.fg}>
            {title}
          </Txt>
        </>
      )}
    </Pressable>
  );
}

const BUTTONS: Record<ButtonVariant, { bg: string; fg: string }> = {
  primary: { bg: colors.primary, fg: colors.onPrimary },
  brand: { bg: colors.brand, fg: colors.onPrimary },
  secondary: { bg: colors.card, fg: colors.text },
  ghost: { bg: 'transparent', fg: colors.text },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
};

export function IconButton({
  icon,
  onPress,
  label,
  size = 40,
  background = colors.card,
  color = colors.text,
  iconSize,
  disabled,
}: {
  icon: IconName;
  onPress?: () => void;
  label: string;
  size?: number;
  background?: string;
  color?: string;
  iconSize?: number;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      disabled={disabled}
      onPress={() => {
        haptic.tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, backgroundColor: background },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <Icon name={icon} size={iconSize ?? size * 0.45} color={color} />
    </Pressable>
  );
}

// ---- Selection controls ----

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={() => {
        haptic.tap();
        onPress?.();
      }}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}>
      {icon ? <Icon name={icon} size={15} color={selected ? colors.onPrimary : colors.text} /> : null}
      <Txt variant="callout" color={selected ? colors.onPrimary : colors.text}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.segmented, style]} accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              haptic.tap();
              onChange(o.value);
            }}
            style={[styles.segment, selected && styles.segmentSelected]}>
            <Txt variant="callout" color={selected ? colors.text : colors.textSecondary} numberOfLines={1}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A large selectable card used for single/multiple choice questions. */
export function OptionCard({
  title,
  subtitle,
  selected,
  onPress,
  leading,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  leading?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      accessibilityState={{ selected }}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}>
      {leading}
      <View style={{ flex: 1 }}>
        <Txt variant="headline" color={selected ? colors.onPrimary : colors.text}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="caption" color={selected ? 'rgba(255,255,255,0.75)' : colors.textSecondary}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {selected ? <Icon name="check" size={18} color={colors.onPrimary} /> : null}
    </Pressable>
  );
}

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  format = (v) => String(v),
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  format?: (value: number) => string;
  label?: string;
}) {
  const { t } = useT();
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 1000) / 1000));
  const named = (action: string) => (label ? `${label}: ${action}` : action);
  return (
    <View style={styles.stepper} accessibilityLabel={label}>
      <IconButton
        icon="minus"
        label={named(t('common.decrease'))}
        size={36}
        background={colors.cardMuted}
        disabled={value <= min}
        onPress={() => onChange(clamp(value - step))}
      />
      <Txt variant="headline" style={styles.stepperValue}>
        {format(value)}
      </Txt>
      <IconButton
        icon="add"
        label={named(t('common.increase'))}
        size={36}
        background={colors.cardMuted}
        disabled={value >= max}
        onPress={() => onChange(clamp(value + step))}
      />
    </View>
  );
}

export function ProgressBar({
  value,
  color = colors.primary,
  track = colors.cardMuted,
  height = 8,
}: {
  value: number;
  color?: string;
  track?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height, borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

// ---- Layout ----

export function Header({
  title,
  onBack,
  close,
  right,
}: {
  title?: string;
  onBack?: () => void;
  close?: boolean;
  right?: ReactNode;
}) {
  const { t } = useT();
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <View style={styles.header}>
      <IconButton icon={close ? 'close' : 'chevronLeft'} label={close ? t('common.close') : t('common.back')} onPress={goBack} />
      <Txt variant="headline" numberOfLines={1} style={styles.headerTitle}>
        {title ?? ''}
      </Txt>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

export function Screen({
  children,
  header,
  footer,
  scroll = true,
  padded = true,
  topInset = true,
  contentStyle,
}: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  /** Modal sheets on iOS already start below the status bar. */
  topInset?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[padded && styles.padded, { paddingBottom: footer ? space.lg : insets.bottom + 32 }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padded && styles.padded, contentStyle]}>{children}</View>
  );
  return (
    <View style={[styles.screen, { paddingTop: topInset ? insets.top : space.sm }]}>
      {header}
      {body}
      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>{footer}</View> : null}
    </View>
  );
}

export function EmptyState({ icon, title, text }: { icon: IconName; title: string; text?: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={26} color={colors.textSecondary} />
      </View>
      <Txt variant="headline" center>
        {title}
      </Txt>
      {text ? (
        <Txt variant="callout" color={colors.textSecondary} center>
          {text}
        </Txt>
      ) : null}
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  value,
  icon,
  onPress,
  right,
  destructive,
}: {
  title: string;
  subtitle?: string;
  value?: string;
  icon?: IconName;
  onPress?: PressableProps['onPress'];
  right?: ReactNode;
  destructive?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
      accessibilityValue={value ? { text: value } : undefined}
      accessibilityHint={subtitle}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && onPress && styles.pressed]}>
      {icon ? (
        <View style={styles.rowIcon}>
          <Icon name={icon} size={18} color={destructive ? colors.danger : colors.text} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Txt variant="callout" color={destructive ? colors.danger : colors.text}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="caption" color={colors.textSecondary}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {value ? (
        <Txt variant="callout" color={colors.textSecondary} numberOfLines={1} style={{ maxWidth: '50%' }}>
          {value}
        </Txt>
      ) : null}
      {right}
      {onPress && !right ? <Icon name="chevronRight" size={14} color={colors.textTertiary} /> : null}
    </Pressable>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  padded: { paddingHorizontal: space.lg },
  footer: { paddingHorizontal: space.lg, paddingTop: space.sm, backgroundColor: colors.bg, gap: space.sm },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, ...shadow },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xl,
    marginBottom: space.md,
  },
  button: {
    height: 54,
    borderRadius: radius.pill,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  buttonSmall: { height: 40, paddingHorizontal: space.lg },
  iconButton: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    padding: 3,
  },
  segment: { flex: 1, height: 34, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { backgroundColor: colors.card, ...shadow },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 64,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
  },
  optionSelected: { backgroundColor: colors.primary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepperValue: { minWidth: 72, textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    gap: space.md,
  },
  headerTitle: { flex: 1, textAlign: 'center' },
  headerRight: { minWidth: 40, flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl, paddingHorizontal: space.xl },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 14 },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.cardMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
