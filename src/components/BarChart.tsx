import { G, Rect, Svg, Text as SvgText } from 'react-native-svg';

import { useThemeColors } from '@/hooks/useThemeColors';

export type BarChartItem = {
  label: string;
  value: number;
};

type Props = {
  data: BarChartItem[];
  width: number;
  height?: number;
  /** 값의 단위 (표시용) */
  unit?: string;
  /** 최대값 (없으면 data 최대값 사용) */
  maxValue?: number;
};

const BAR_RADIUS = 4;
const LABEL_HEIGHT = 18;
const VALUE_HEIGHT = 14;

export function BarChart({ data, width, height = 140, unit = '', maxValue }: Props) {
  const c = useThemeColors();
  const chartH = height - LABEL_HEIGHT - VALUE_HEIGHT;
  const gap = 6;
  const barCount = data.length;
  const barW = (width - gap * (barCount - 1)) / barCount;
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <Svg width={width} height={height}>
      {data.map((item, i) => {
        const barH = max === 0 ? 0 : Math.max((item.value / max) * chartH, item.value > 0 ? BAR_RADIUS * 2 : 0);
        const x = i * (barW + gap);
        const y = chartH - barH;

        return (
          <G key={item.label}>
            {/* 배경 바 */}
            <Rect
              x={x}
              y={0}
              width={barW}
              height={chartH}
              rx={BAR_RADIUS}
              fill={c.surfaceMuted}
            />
            {/* 값 바 */}
            {barH > 0 && (
              <Rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={BAR_RADIUS}
                fill={c.ink}
              />
            )}
            {/* 값 라벨 (상단) */}
            {item.value > 0 && (
              <SvgText
                x={x + barW / 2}
                y={y - 3}
                textAnchor="middle"
                fontSize={9}
                fill={c.inkSecondary}
              >
                {item.value}{unit}
              </SvgText>
            )}
            {/* 축 라벨 (하단) */}
            <SvgText
              x={x + barW / 2}
              y={height - 2}
              textAnchor="middle"
              fontSize={10}
              fill={c.inkTertiary}
            >
              {item.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
