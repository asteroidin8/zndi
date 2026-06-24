import { useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** inset이 0→실값으로 바뀔 때 상단 padding 깜박임 방지 */
export function useStableTopInset(): number {
  const insets = useSafeAreaInsets();
  const ref = useRef(insets.top);
  if (insets.top > ref.current) {
    ref.current = insets.top;
  }
  return ref.current;
}
