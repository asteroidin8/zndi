import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';

type Props = {
  itemKey: string;
  index?: number;
  /** 드래그 중 레이아웃 스프링 비활성화 */
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
      entering={FadeInDown.delay(Math.min(index * 40, 200)).duration(280).springify().damping(18)}
      exiting={FadeOutUp.duration(200)}
      layout={animateLayout ? LinearTransition.springify().damping(20) : undefined}
    >
      {children}
    </Animated.View>
  );
}
