import { useEffect, useState } from 'react';
import {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppText, type AppTextProps } from './AppText';

type Props = {
  value: number;
  suffix?: string;
  duration?: number;
} & Omit<AppTextProps, 'children'>;

export function AnimatedNumber({ value, suffix = '', duration = 600, ...textProps }: Props) {
  const [display, setDisplay] = useState(value);
  const sv = useSharedValue(0);

  useEffect(() => {
    sv.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration, sv]);

  useAnimatedReaction(
    () => Math.round(sv.value),
    (cur, prev) => {
      if (cur !== prev) runOnJS(setDisplay)(cur);
    },
    [sv],
  );

  return (
    <AppText {...textProps}>
      {display}{suffix}
    </AppText>
  );
}
