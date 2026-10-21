import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, IconButton, Txt } from '@/components/ui';
import { useT } from '@/i18n';
import { api } from '@/lib/api';
import { goHome, notify } from '@/lib/dialogs';
import { haptic } from '@/lib/haptics';
import { PermissionDeniedError, pickPhoto } from '@/lib/images';
import { startPhotoAnalysis } from '@/store/analysis';
import { useUi } from '@/store/ui';
import { colors, radius, space } from '@/theme';

type Phase = { kind: 'scanning' } | { kind: 'looking'; code: string } | { kind: 'notFound'; code: string };

export default function BarcodeScreen() {
  const { t, lang } = useT();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>({ kind: 'scanning' });
  const [typed, setTyped] = useState('');
  const handling = useRef(false);
  const setPendingFood = useUi((s) => s.setPendingFood);
  const selectedDay = useUi((s) => s.selectedDay);

  const lookup = async (code: string) => {
    if (handling.current) return;
    handling.current = true;
    haptic.light();
    setPhase({ kind: 'looking', code });
    try {
      const { item } = await api.barcode(code, lang);
      if (item) {
        setPendingFood({ food: item, source: 'barcode' });
        router.replace('/food-entry');
        return;
      }
      setPhase({ kind: 'notFound', code });
    } catch {
      notify(t('errors.network'));
      setPhase({ kind: 'scanning' });
      handling.current = false;
    }
  };

  const onScanned = (result: BarcodeScanningResult) => {
    const code = result.data.replace(/\D/g, '');
    if (code.length >= 8) void lookup(code);
  };

  const scanAgain = () => {
    handling.current = false;
    setPhase({ kind: 'scanning' });
  };

  const scanLabel = async () => {
    try {
      const image = await pickPhoto('camera');
      if (!image) return;
      startPhotoAnalysis(image, 'label', selectedDay);
      goHome();
    } catch (error) {
      notify(error instanceof PermissionDeniedError ? t('errors.cameraDenied') : t('errors.unknown'));
    }
  };

  const granted = permission?.granted ?? false;

  return (
    <View style={styles.screen}>
      {granted && phase.kind === 'scanning' ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
          onBarcodeScanned={onScanned}
        />
      ) : null}

      <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
        <IconButton icon="close" label={t('common.close')} onPress={() => router.back()} />
        <Txt variant="headline" color={colors.onPrimary}>
          {t('barcode.title')}
        </Txt>
        <View style={{ width: 40 }} />
      </View>

      {granted && phase.kind === 'scanning' ? (
        <View style={styles.frameWrap} pointerEvents="none">
          <View style={styles.frame} />
          <Txt variant="callout" color={colors.onPrimary} center>
            {t('barcode.hint')}
          </Txt>
        </View>
      ) : null}

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.lg }]}>
        {!granted ? (
          <Card style={{ gap: space.md }}>
            <Txt variant="headline">{t('barcode.permissionTitle')}</Txt>
            <Txt variant="callout" color={colors.textSecondary}>
              {t('barcode.permissionText')}
            </Txt>
            <Button title={t('barcode.grant')} onPress={() => void requestPermission()} />
          </Card>
        ) : null}

        {phase.kind === 'looking' ? (
          <Card style={styles.row}>
            <ActivityIndicator color={colors.text} />
            <Txt variant="callout">{t('barcode.lookingUp')}</Txt>
          </Card>
        ) : null}

        {phase.kind === 'notFound' ? (
          <Card style={{ gap: space.md }}>
            <Txt variant="headline">{t('barcode.notFoundTitle')}</Txt>
            <Txt variant="callout" color={colors.textSecondary}>
              {t('barcode.notFoundText', { code: phase.code })}
            </Txt>
            <Button title={t('barcode.scanLabel')} icon="label" onPress={scanLabel} />
            <Button title={t('barcode.manual')} variant="secondary" icon="manual" onPress={() => router.replace('/manual')} />
            <Button title={t('barcode.scanAgain')} variant="ghost" onPress={scanAgain} />
          </Card>
        ) : null}

        {phase.kind === 'scanning' ? (
          <Card style={{ gap: space.sm }}>
            {Platform.OS === 'web' ? (
              <Txt variant="caption" color={colors.textSecondary}>
                {t('barcode.webNote')}
              </Txt>
            ) : null}
            <View style={styles.row}>
              <TextInput
                value={typed}
                onChangeText={(v) => setTyped(v.replace(/\D/g, ''))}
                placeholder="8690000000000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                maxLength={14}
                style={styles.input}
                accessibilityLabel={t('barcode.title')}
              />
              <Button title={t('common.search')} small disabled={typed.length < 8} onPress={() => void lookup(typed)} />
            </View>
          </Card>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
  },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  frame: {
    width: '78%',
    aspectRatio: 1.7,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  input: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.cardMuted,
    paddingHorizontal: space.md,
    fontSize: 16,
    color: colors.text,
  },
});
