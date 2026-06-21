import { Circle, G, Line, Polyline, Svg, Text as SvgText } from 'react-native-svg';

import { useThemeColors } from '@/hooks/useThemeColors';

type DataPoint = {
  label: string;
  value: number;
};

type Props = {
  data: DataPoint[];
  width: number;
  height?: number;
  targetValue?: number | null;
  unit?: string;
};

const PADDING_LEFT = 36;
const PADDING_RIGHT = 12;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 24;

export function WeightLineChart({ data, width, height = 160, targetValue, unit = '' }: Props) {
  const c = useThemeColors();

  if (data.length === 0) return null;

  const values = data.map((d) => d.value);
  const allValues = targetValue != null ? [...values, targetValue] : values;
  const minVal = Math.floor(Math.min(...allValues) - 1);
  const maxVal = Math.ceil(Math.max(...allValues) + 1);
  const range = maxVal - minVal || 1;

  const chartW = width - PADDING_LEFT - PADDING_RIGHT;
  const chartH = height - PADDING_TOP - PADDING_BOTTOM;

  function xPos(i: number) {
    if (data.length === 1) return PADDING_LEFT + chartW / 2;
    return PADDING_LEFT + (i / (data.length - 1)) * chartW;
  }

  function yPos(val: number) {
    return PADDING_TOP + (1 - (val - minVal) / range) * chartH;
  }

  const points = data.map((d, i) => `${xPos(i)},${yPos(d.value)}`).join(' ');

  const gridLines = 4;
  const gridValues = Array.from({ length: gridLines }, (_, i) =>
    minVal + (range / (gridLines - 1)) * i,
  );

  return (
    <Svg width={width} height={height}>
      {gridValues.map((val) => (
        <G key={val}>
          <Line
            x1={PADDING_LEFT}
            y1={yPos(val)}
            x2={width - PADDING_RIGHT}
            y2={yPos(val)}
            stroke={c.borderNeutral}
            strokeWidth={0.5}
          />
          <SvgText
            x={PADDING_LEFT - 6}
            y={yPos(val) + 3}
            textAnchor="end"
            fontSize={9}
            fill={c.inkDisabled}
          >
            {Math.round(val)}
          </SvgText>
        </G>
      ))}

      {targetValue != null && (
        <Line
          x1={PADDING_LEFT}
          y1={yPos(targetValue)}
          x2={width - PADDING_RIGHT}
          y2={yPos(targetValue)}
          stroke={c.accent}
          strokeWidth={1}
          strokeDasharray="4,4"
          opacity={0.6}
        />
      )}

      <Polyline
        points={points}
        fill="none"
        stroke={c.primary}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {data.map((d, i) => (
        <Circle
          key={i}
          cx={xPos(i)}
          cy={yPos(d.value)}
          r={3}
          fill={c.primary}
        />
      ))}

      {data.map((d, i) => {
        const showLabel = data.length <= 7 || i === 0 || i === data.length - 1;
        if (!showLabel) return null;
        return (
          <SvgText
            key={`label-${i}`}
            x={xPos(i)}
            y={height - 4}
            textAnchor="middle"
            fontSize={9}
            fill={c.inkTertiary}
          >
            {d.label}
          </SvgText>
        );
      })}
    </Svg>
  );
}
