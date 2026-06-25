import { useCallback, useRef } from 'react';
import { Linking, Platform, Share, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { appAlert } from '@/stores/useAlertStore';
import { feedbackShare } from '@/utils/microFeedback';

async function captureGrass(gridRef: React.RefObject<View | null>): Promise<string | null> {
  if (!gridRef.current) return null;
  try {
    return await captureRef(gridRef, { format: 'png', quality: 1, result: 'tmpfile' });
  } catch {
    return null;
  }
}

export function useShareGrass() {
  const gridRef = useRef<View>(null);

  const share = useCallback(async (_year: number, _month: number) => {
    const uri = await captureGrass(gridRef);
    if (!uri) {
      appAlert('공유 실패', '이미지를 생성하는 중 문제가 발생했어요.');
      return;
    }

    if (await Sharing.isAvailableAsync()) {
      feedbackShare();
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'zndi 잔디 공유',
      });
    } else {
      appAlert('공유 불가', '이 기기에서는 공유 기능을 사용할 수 없어요.');
    }
  }, []);

  const shareInstagram = useCallback(async () => {
    const uri = await captureGrass(gridRef);
    if (!uri) {
      appAlert('공유 실패', '이미지를 생성하는 중 문제가 발생했어요.');
      return;
    }

    const igUrl = Platform.select({
      ios: `instagram-stories://share?backgroundImage=${encodeURIComponent(uri)}`,
      android: `instagram-stories://share`,
    });

    feedbackShare();
    if (igUrl && (await Linking.canOpenURL(igUrl))) {
      await Linking.openURL(igUrl);
    } else {
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Instagram에 공유' });
    }
  }, []);

  const shareKakao = useCallback(async () => {
    const uri = await captureGrass(gridRef);
    if (!uri) {
      appAlert('공유 실패', '이미지를 생성하는 중 문제가 발생했어요.');
      return;
    }

    if (await Sharing.isAvailableAsync()) {
      feedbackShare();
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '카카오톡으로 공유' });
    }
  }, []);

  return { gridRef, share, shareInstagram, shareKakao };
}
