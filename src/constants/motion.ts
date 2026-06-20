export const motion = {
  spring: {
    gentle: { damping: 18, stiffness: 120 },
    bouncy: { damping: 12, stiffness: 150 },
    stiff: { damping: 20, stiffness: 200 },
  },
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  stagger: {
    list: 40,
    maxDelay: 200,
  },
} as const;
