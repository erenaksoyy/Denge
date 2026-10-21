import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Rect, Stop, Circle } from 'react-native-svg';

import { colors, space } from '@/theme';

import { Txt } from './ui';

export function BarChart({
  data,
  goal,
  height = 150,
  color = colors.primary,
  overColor = colors.danger,
}: {
  data: { label: string; value: number; highlight?: boolean }[];
  goal?: number;
  height?: number;
  color?: string;
  overColor?: string;
}) {
  const [width, setWidth] = useState(0);
  const max = Math.max(goal ?? 0, ...data.map((d) => d.value), 1) * 1.15;
  const slot = width / Math.max(1, data.length);
  const barWidth = Math.min(26, slot * 0.55);
  const y = (v: number) => height - (v / max) * height;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {goal ? (
            <Line
              x1={0}
              x2={width}
              y1={y(goal)}
              y2={y(goal)}
              stroke={colors.textTertiary}
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          ) : null}
          {data.map((d, i) => {
            const h = Math.max(d.value > 0 ? 4 : 0, height - y(d.value));
            const over = goal ? d.value > goal : false;
            return (
              <Rect
                key={i}
                x={i * slot + (slot - barWidth) / 2}
                y={height - h}
                width={barWidth}
                height={h}
                rx={Math.min(8, barWidth / 2)}
                fill={over ? overColor : color}
                opacity={d.highlight === false ? 0.35 : 1}
              />
            );
          })}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
      <View style={styles.labels}>
        {data.map((d, i) => (
          <Txt key={i} variant="micro" color={d.highlight ? colors.text : colors.textTertiary} style={styles.label}>
            {d.label}
          </Txt>
        ))}
      </View>
    </View>
  );
}

export function LineChart({
  points,
  height = 160,
  color = colors.brand,
  target,
  formatValue = (v) => String(Math.round(v)),
  formatX,
  showScale = true,
}: {
  points: { x: number; y: number }[];
  height?: number;
  color?: string;
  target?: number;
  formatValue?: (v: number) => string;
  formatX?: (x: number) => string;
  showScale?: boolean;
}) {
  const [width, setWidth] = useState(0);
  const ys = points.map((p) => p.y).concat(target !== undefined ? [target] : []);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = Math.max(0.5, (maxY - minY) * 0.15);
  const lo = minY - pad;
  const hi = maxY + pad;
  const minX = points[0]?.x ?? 0;
  const maxX = points[points.length - 1]?.x ?? 1;
  const left = 4;
  const right = 8;
  const sx = (x: number) => left + ((x - minX) / Math.max(1, maxX - minX)) * (width - left - right);
  const sy = (v: number) => 8 + (1 - (v - lo) / Math.max(0.001, hi - lo)) * (height - 16);

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
  const area = points.length
    ? `${line} L${sx(maxX).toFixed(1)},${height} L${sx(minX).toFixed(1)},${height} Z`
    : '';

  return (
    <View>
      {showScale ? (
        <View style={styles.yLabels}>
          <Txt variant="micro" color={colors.textTertiary}>
            {formatValue(hi)}
          </Txt>
          <Txt variant="micro" color={colors.textTertiary}>
            {formatValue(lo)}
          </Txt>
        </View>
      ) : null}
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && points.length > 1 ? (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color} stopOpacity={0.25} />
                <Stop offset="1" stopColor={color} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {target !== undefined ? (
              <Line
                x1={0}
                x2={width}
                y1={sy(target)}
                y2={sy(target)}
                stroke={colors.textTertiary}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            ) : null}
            <Path d={area} fill="url(#area)" />
            <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            {points.length <= 31
              ? points.map((p, i) => <Circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={3} fill={color} />)
              : null}
          </Svg>
        ) : (
          <View style={{ height }} />
        )}
      </View>
      {formatX && points.length > 1 ? (
        <View style={styles.xLabels}>
          <Txt variant="micro" color={colors.textTertiary}>
            {formatX(minX)}
          </Txt>
          <Txt variant="micro" color={colors.textTertiary}>
            {formatX(maxX)}
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: 'row', marginTop: space.sm },
  label: { flex: 1, textAlign: 'center' },
  yLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  xLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
});
