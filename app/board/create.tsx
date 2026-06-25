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
import { appAlert } from '@/stores/useAlertStore';
import { useBoardStore } from '@/stores/useBoardStore';
import { useProStore } from '@/stores/useProStore';
import { FREE_LIMITS, PRO_LIMITS } from '@/hooks/useProGating';
import { useUserStore } from '@/stores/useUserStore';
import { createBoard } from '@/services/board/boardService';
import { getDisplayName } from '@/utils/avatarColor';

export default function BoardCreateScreen() {
  const c = useThemeColors();
  const { user } = useAuth();
  const nickname = useUserStore((s) => s.profile.nickname);
  const boards = useBoardStore((s) => s.boards);
  const isPro = useProStore((s) => s.isPro);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    const displayName = getDisplayName(nickname, user?.id);
    if (!user?.id || !name.trim()) return;
    const maxBoards = isPro ? PRO_LIMITS.boards : FREE_LIMITS.boards;
    const ownedBoards = boards.filter((b) => b.ownerId === user.id);
    if (ownedBoards.length >= maxBoards) {
      appAlert('보드 제한', `보드를 ${maxBoards}개까지 만들 수 있어요.${!isPro ? '\n설정 > 멤버십에서 업그레이드할 수 있어요.' : ''}`);
      return;
    }
    setLoading(true);
    const { board, error } = await createBoard(user.id, name.trim(), displayName);
    setLoading(false);

    if (error) {
      appAlert('오류', error);
      return;
    }

    if (board) {
      router.replace(`/board/${board.id}`);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }} edges={['top']}>
      <PageHeader title="보드 만들기" onBack={() => router.back()} />

      {!user ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screen }}>
          <AppText variant="body" tone="tertiary">로그인이 필요해요.</AppText>
        </View>
      ) : (
        <View style={{ padding: spacing.screen, gap: spacing.section }}>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="caption" tone="tertiary">보드 이름</AppText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="예: 다이어트 챌린지"
              placeholderTextColor={c.inkDisabled}
              autoFocus
              style={{
                fontSize: 16,
                color: c.ink,
                borderBottomWidth: 1,
                borderBottomColor: c.border,
                paddingVertical: spacing.sm,
              }}
            />
          </View>

          <SheetPrimaryButton
            label={loading ? '생성 중...' : '만들기'}
            onPress={handleCreate}
            disabled={!name.trim() || loading}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
