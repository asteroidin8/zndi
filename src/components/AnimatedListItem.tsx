import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';

import { motion } from '@/constants/motion';

type Props = {
  itemKey: string;
  index?: number;
  animateLayout?: boolean;
  children: React.ReactNode;
};

export function AnimatedListItem({
  itemKey,
  index = 0,
  animateLayout = true,
  children,
}: Props) {
  return (
    <Animated.View
      key={itemKey}
      entering={FadeInDown.delay(Math.min(index * motion.stagger.list, motion.stagger.maxDelay)).duration(280).springify().damping(motion.spring.gentle.damping)}
      exiting={FadeOutUp.duration(200)}
      layout={animateLayout ? LinearTransition.springify().damping(motion.spring.stiff.damping) : undefined}
    >
      {children}
    </Animated.View>
  );
}
