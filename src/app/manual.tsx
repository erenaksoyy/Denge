import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, Header, Screen, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { goHome } from '@/lib/dialogs';
import { haptic } from '@/lib/haptics';
import { uid } from '@/lib/meal';
import { useStore } from '@/store/store';
import { showToast, useUi } from '@/store/ui';
import { colors, radius, space } from '@/theme';

const toNumber = (text: string) => {
  const n = Number(text.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export default function ManualEntry() {
  const { replace } = useLocalSearchParams<{ replace?: string }>();
  const { t } = useT();
  const addMeal = useStore((s) => s.addMeal);
  const updateMeal = useStore((s) => s.updateMeal);
  const selectedDay = useUi((s) => s.selectedDay);

  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [grams, setGrams] = useState('');

  const valid = name.trim().length > 0 && toNumber(calories) > 0;

  const save = () => {
    const ingredient = {
      id: uid(),
      name: name.trim(),
      grams: toNumber(grams) || null,
      calories: Math.round(toNumber(calories)),
      protein: toNumber(protein),
      carbs: toNumber(carbs),
      fat: toNumber(fat),
    };
    if (replace) {
      updateMeal(replace, {
        status: 'done',
        error: undefined,
        name: ingredient.name,
        ingredients: [ingredient],
        healthScore: null,
        servings: 1,
      });
    } else {
      addMeal({
        id: uid(),
        day: selectedDay,
        createdAt: new Date().toISOString(),
        source: 'manual',
        status: 'done',
        name: ingredient.name,
        servings: 1,
        imageUri: null,
        healthScore: null,
        ingredients: [ingredient],
      });
    }
    haptic.success();
    showToast(t('saved.added', { name: ingredient.name }));
    goHome();
  };

  const field = (label: string, value: string, onChange: (v: string) => void, numeric = true, placeholder?: string) => (
    <View style={{ gap: 6 }}>
      <Txt variant="caption" color={colors.textSecondary}>
        {label}
      </Txt>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        placeholder={placeholder ?? (numeric ? '0' : '')}
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        accessibilityLabel={label}
        maxLength={numeric ? 7 : 80}
      />
    </View>
  );

  return (
    <Screen
      topInset={false}
      header={<Header close title={t('manual.title')} />}
      footer={<Button title={t('common.save')} disabled={!valid} onPress={save} />}>
      <View style={{ gap: space.lg }}>
        {field(t('manual.name'), name, setName, false, t('manual.namePlaceholder'))}
        {field(t('manual.calories'), calories, setCalories)}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>{field(t('manual.protein'), protein, setProtein)}</View>
          <View style={{ flex: 1 }}>{field(t('manual.carbs'), carbs, setCarbs)}</View>
          <View style={{ flex: 1 }}>{field(t('manual.fat'), fat, setFat)}</View>
        </View>
        {field(t('manual.grams'), grams, setGrams)}
        {!valid ? (
          <Txt variant="caption" color={colors.textTertiary}>
            {t('manual.required')}
          </Txt>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    height: 50,
    fontSize: 16,
    color: colors.text,
  },
});
