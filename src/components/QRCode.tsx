import { useMemo } from 'react';
import Svg, { Rect } from 'react-native-svg';
import { toQR } from 'toqr';

type Props = {
  value: string;
  size: number;
  color?: string;
  bgColor?: string;
};

export function QRCode({ value, size, color = '#000', bgColor = '#fff' }: Props) {
  const { modules, gridSize } = useMemo(() => {
    const data = toQR(value);
    const gs = Math.sqrt(data.length);
    return { modules: data, gridSize: gs };
  }, [value]);

  const cellSize = size / gridSize;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={0} y={0} width={size} height={size} fill={bgColor} />
      {Array.from(modules).map((val, i) => {
        if (!val) return null;
        const x = (i % gridSize) * cellSize;
        const y = Math.floor(i / gridSize) * cellSize;
        return (
          <Rect
            key={i}
            x={x}
            y={y}
            width={cellSize}
            height={cellSize}
            fill={color}
          />
        );
      })}
    </Svg>
  );
}
