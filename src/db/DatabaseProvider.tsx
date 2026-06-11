import { useMigrations } from 'drizzle-orm/expo-sqlite';
import { type ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { db } from './client';
import { migrations } from './migrations';

type Props = {
  children: ReactNode;
};

export function DatabaseProvider({ children }: Props) {
  const { success, error } = useMigrations(db, migrations as Parameters<typeof useMigrations>[1]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <AppText variant="body" tone="tertiary">
          DB 초기화 오류: {error.message}
        </AppText>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <AppText variant="caption" tone="disabled">
          초기화 중...
        </AppText>
      </View>
    );
  }

  return <>{children}</>;
}
