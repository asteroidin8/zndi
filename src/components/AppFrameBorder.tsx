import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

const FRAME = { top: 4, bottom: 4, side: 2 } as const;

type Props = {
  color: string;
  children: ReactNode;
};

/** 장식용 테두리 — overlay로 그려 flex 레이아웃/inset 변화에 영향받지 않음 */
export function AppFrameBorder({ color, children }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.content}>{children}</View>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.top, { backgroundColor: color }]} />
        <View style={[styles.bottom, { backgroundColor: color }]} />
        <View style={[styles.left, { backgroundColor: color }]} />
        <View style={[styles.right, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, height: FRAME.top },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: FRAME.bottom },
  left: { position: 'absolute', top: 0, bottom: 0, left: 0, width: FRAME.side },
  right: { position: 'absolute', top: 0, bottom: 0, right: 0, width: FRAME.side },
});
