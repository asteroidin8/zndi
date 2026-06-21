import { useCallback, useRef } from 'react';
import { Alert, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

export function useShareGrass() {
  const gridRef = useRef<View>(null);

  const share = useCallback(async (year: number, month: number) => {
    if (!gridRef.current) return;

    try {
      const uri = await captureRef(gridRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'zndi 잔디 공유',
        });
      } else {
        Alert.alert('공유 불가', '이 기기에서는 공유 기능을 사용할 수 없어요.');
      }
    } catch {
      Alert.alert('공유 실패', '이미지를 생성하는 중 문제가 발생했어요.');
    }
  }, []);

  return { gridRef, share };
}
