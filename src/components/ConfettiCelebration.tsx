import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const SCREEN = Dimensions.get('window');
const PARTICLE_COUNT = 40;
const COLORS = [
  '#22C55E', '#4ADE80', '#FFD700', '#FF6B6B',
  '#60A5FA', '#A78BFA', '#F472B6', '#34D399',
];

type Particle = {
  x: number;
  delay: number;
  color: string;
  size: number;
  drift: number;
  rotation: number;
};

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * SCREEN.width,
    delay: Math.random() * 400,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 6,
    drift: (Math.random() - 0.5) * 120,
    rotation: Math.random() * 360,
  }));
}

function ConfettiParticle({ particle }: { particle: Particle }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      particle.delay,
      withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }),
    );
  }, [particle.delay, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      position: 'absolute',
      left: particle.x + particle.drift * p,
      top: -20 + (SCREEN.height * 0.8) * p,
      width: particle.size,
      height: particle.size * (0.6 + Math.random() * 0.4),
      borderRadius: particle.size > 9 ? 2 : particle.size / 2,
      backgroundColor: particle.color,
      opacity: p < 0.8 ? 1 : 1 - (p - 0.8) / 0.2,
      transform: [
        { rotate: `${particle.rotation + 720 * p}deg` },
        { scale: p < 0.1 ? p / 0.1 : 1 },
      ],
    };
  });

  return <Animated.View style={style} />;
}

type Props = {
  visible: boolean;
  onFinish: () => void;
};

export function ConfettiCelebration({ visible, onFinish }: Props) {
  const opacity = useSharedValue(1);
  const particles = useMemo(() => (visible ? createParticles() : []), [visible]);

  useEffect(() => {
    if (!visible) return;
    opacity.value = 1;
    opacity.value = withDelay(
      1200,
      withTiming(0, { duration: 600 }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
  }, [visible, opacity, onFinish]);

  if (!visible) return null;

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, containerStyle]} pointerEvents="none">
      {particles.map((p, i) => (
        <ConfettiParticle key={i} particle={p} />
      ))}
    </Animated.View>
  );
}
