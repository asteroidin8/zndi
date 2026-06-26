import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppText } from '@/components/AppText';
import { PageHeader } from '@/components/settings/MyScreenUI';
import { SheetPrimaryButton } from '@/components/SheetModal';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/contexts/AuthProvider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { toast } from '@/stores/useToastStore';
import { feedbackSuccess } from '@/utils/microFeedback';
import { useUserStore } from '@/stores/useUserStore';
import { joinBoard, fetchMyBoards, insertSystemMessage } from '@/services/board/boardService';
import { getDisplayName } from '@/utils/avatarColor';

export default function BoardJoinScreen() {
  const c = useThemeColors();
  const { user } = useAuth();
  const nickname = useUserStore((s) => s.profile.nickname);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    const displayName = getDisplayName(nickname, user?.id);
    if (!user?.id || !code.trim()) return;
    setLoading(true);
    const { board, error } = await joinBoard(user.id, code.trim(), displayName);
    setLoading(false);

    if (error) {
      toast(error, 'error');
      return;
    }

    if (board) {
      feedbackSuccess();
      void insertSystemMessage(board.id, 'member_joined', displayName);
      await fetchMyBoards(user.id);
      router.replace(`/board/${board.id}`);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <PageHeader title="보드 참가" onBack={() => router.back()} />

      {!user ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screen }}>
          <AppText variant="body" tone="tertiary">로그인이 필요해요.</AppText>
        </View>
      ) : (
        <View style={{ padding: spacing.screen, gap: spacing.section }}>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="caption" tone="tertiary">초대 코드</AppText>
            <TextInput
              value={code}
              onChangeText={(text) => setCode(text.toUpperCase())}
              placeholder="6자리 코드 입력"
              placeholderTextColor={c.inkDisabled}
              autoFocus
              autoCapitalize="characters"
              maxLength={6}
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: c.ink,
                borderBottomWidth: 1,
                borderBottomColor: c.border,
                paddingVertical: spacing.sm,
                textAlign: 'center',
                letterSpacing: 6,
              }}
            />
          </View>

          <SheetPrimaryButton
            label={loading ? '참가 중...' : '참가하기'}
            onPress={handleJoin}
            disabled={code.trim().length < 6 || loading}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
