import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { View } from 'react-native';

import { colors } from '@/theme';

type PlatformName = Exclude<SymbolViewProps['name'], string>;

const ICONS = {
  add: { ios: 'plus', android: 'add', web: 'add' },
  camera: { ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' },
  gallery: { ios: 'photo.on.rectangle', android: 'photo_library', web: 'photo_library' },
  barcode: { ios: 'barcode.viewfinder', android: 'barcode_scanner', web: 'barcode_scanner' },
  label: { ios: 'doc.text.viewfinder', android: 'document_scanner', web: 'document_scanner' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  bookmark: { ios: 'bookmark', android: 'bookmark_border', web: 'bookmark_border' },
  bookmarkFill: { ios: 'bookmark.fill', android: 'bookmark', web: 'bookmark' },
  run: { ios: 'figure.run', android: 'directions_run', web: 'directions_run' },
  walk: { ios: 'figure.walk', android: 'directions_walk', web: 'directions_walk' },
  cycle: { ios: 'bicycle', android: 'directions_bike', web: 'directions_bike' },
  swim: { ios: 'figure.pool.swim', android: 'pool', web: 'pool' },
  weights: { ios: 'dumbbell.fill', android: 'fitness_center', web: 'fitness_center' },
  hiit: { ios: 'figure.highintensity.intervaltraining', android: 'sports_gymnastics', web: 'sports_gymnastics' },
  scale: { ios: 'scalemass.fill', android: 'monitor_weight', web: 'monitor_weight' },
  water: { ios: 'drop.fill', android: 'water_drop', web: 'water_drop' },
  recipe: { ios: 'book.fill', android: 'menu_book', web: 'menu_book' },
  manual: { ios: 'square.and.pencil', android: 'edit_note', web: 'edit_note' },
  pencil: { ios: 'pencil', android: 'edit', web: 'edit' },
  flame: { ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' },
  protein: { ios: 'bolt.fill', android: 'bolt', web: 'bolt' },
  carbs: { ios: 'leaf.fill', android: 'eco', web: 'eco' },
  fat: { ios: 'drop.halffull', android: 'opacity', web: 'opacity' },
  timer: { ios: 'timer', android: 'timer', web: 'timer' },
  fasting: { ios: 'hourglass', android: 'hourglass_top', web: 'hourglass_top' },
  chart: { ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' },
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  person: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  minus: { ios: 'minus', android: 'remove', web: 'remove' },
  send: { ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' },
  wand: { ios: 'wand.and.stars', android: 'auto_fix_high', web: 'auto_fix_high' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  heart: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  calendar: { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  globe: { ios: 'globe', android: 'language', web: 'language' },
  flag: { ios: 'flag.fill', android: 'flag', web: 'flag' },
  stop: { ios: 'stop.fill', android: 'stop', web: 'stop' },
  play: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' },
  food: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  chat: { ios: 'text.bubble', android: 'chat', web: 'chat' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
} satisfies Record<string, PlatformName>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 22, color = colors.text }: { name: IconName; size?: number; color?: string }) {
  return (
    <SymbolView
      name={ICONS[name]}
      size={size}
      tintColor={color}
      resizeMode="scaleAspectFit"
      fallback={<View style={{ width: size, height: size }} />}
    />
  );
}
