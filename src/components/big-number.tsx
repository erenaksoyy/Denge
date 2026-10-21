import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { useT } from '@/i18n';
import { colors, space } from '@/theme';

import { IconButton, Txt } from './ui';

const parse = (text: string) => Number(text.replace(',', '.').replace(/[^\d.]/g, ''));

/** A large editable number with − / + buttons. */
export function BigNumber({
  value,
  onChange,
  step = 1,
  min,
  max,
  unit,
  decimals = 0,
  locale,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min: number;
  max: number;
  unit?: string;
  decimals?: number;
  locale: string;
  label: string;
}) {
  const { t } = useT();
  const format = (v: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: decimals, useGrouping: false }).format(v);
  // While typing we show the raw text; otherwise the formatted value.
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);

  const clamp = (v: number) => {
    const f = 10 ** decimals;
    return Math.min(max, Math.max(min, Math.round(v * f) / f));
  };

  const commit = () => {
    setEditing(false);
    const n = parse(text);
    if (Number.isFinite(n) && text.trim() !== '') onChange(clamp(n));
  };

  return (
    <View style={styles.row}>
      <IconButton icon="minus" label={`${label}: ${t('common.decrease')}`} size={48} onPress={() => onChange(clamp(value - step))} disabled={value <= min} />
      <View style={styles.center}>
        <TextInput
          accessibilityLabel={label}
          value={editing ? text : format(value)}
          onChangeText={setText}
          onFocus={() => {
            setText(format(value));
            setEditing(true);
          }}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType="decimal-pad"
          returnKeyType="done"
          selectTextOnFocus
          style={styles.input}
          maxLength={6}
        />
        {unit ? (
          <Txt variant="headline" color={colors.textSecondary}>
            {unit}
          </Txt>
        ) : null}
      </View>
      <IconButton icon="add" label={`${label}: ${t('common.increase')}`} size={48} onPress={() => onChange(clamp(value + step))} disabled={value >= max} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  center: { flex: 1, alignItems: 'center' },
  input: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -1.5,
    color: colors.text,
    textAlign: 'center',
    minWidth: 120,
    paddingVertical: 0,
  },
});
