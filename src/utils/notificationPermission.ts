import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { appAlert } from '@/stores/useAlertStore';

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status === 'granted') return true;

  appAlert(
    '알림 권한이 필요해요',
    '설정에서 잔디 알림을 허용하면 리마인더와 단식 알림을 받을 수 있어요.',
    [
      { text: '나중에', style: 'cancel' },
      {
        text: '설정 열기',
        onPress: () => {
          if (Platform.OS === 'ios') Linking.openURL('app-settings:');
          else Linking.openSettings();
        },
      },
    ],
  );
  return false;
}
