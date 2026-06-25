import { Pressable, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { radius, spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

type BoardRoutine = { id: string; name: string };

export function RoutinesTab({
  routines,
  isAdmin,
  hasVerified,
  onOpenCreate,
  onDeleteRoutine,
  onVerify,
}: {
  routines: BoardRoutine[];
  isAdmin: boolean;
  hasVerified: (routineId: string) => boolean;
  onOpenCreate: () => void;
  onDeleteRoutine: (routineId: string, name: string) => void;
  onVerify: (routineId: string) => void;
}) {
  const c = useThemeColors();

  return (
    <View style={{ gap: spacing.md }}>
      {isAdmin && routines.length === 0 && (
        <Pressable
          onPress={onOpenCreate}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            paddingVertical: spacing.item,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: c.primary,
            borderStyle: 'dashed',
          }}
        >
          <AppIcon name="Plus" size={16} color={c.primary} />
          <AppText variant="body" style={{ color: c.primary, fontWeight: '600' }}>
            공동 루틴 추가
          </AppText>
        </Pressable>
      )}

      {routines.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 40, gap: spacing.sm }}>
          <AppIcon name="RotateCcw" size={32} color={c.inkDisabled} />
          <AppText variant="body" tone="tertiary">
            {isAdmin ? '루틴을 설정해주세요.' : '아직 공동 루틴이 없어요.'}
          </AppText>
        </View>
      ) : (
        routines.map((routine) => {
          const verified = hasVerified(routine.id);
          return (
            <Card key={routine.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.gap }}>
                <AppIcon name={verified ? 'CheckCircle' : 'RotateCcw'} size={16} color={verified ? c.accent : c.primary} />
                <AppText variant="body" style={{ flex: 1, fontWeight: '600' }}>
                  {routine.name}
                </AppText>
                {verified ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: radius.sm,
                      backgroundColor: c.surfaceMuted,
                    }}
                  >
                    <AppIcon name="Check" size={12} color={c.primary} />
                    <AppText variant="caption" style={{ color: c.primary, fontWeight: '700' }}>
                      완료
                    </AppText>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => onVerify(routine.id)}
                    hitSlop={8}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: radius.sm,
                      backgroundColor: c.primary,
                    }}
                  >
                    <AppText variant="caption" style={{ color: '#fff', fontWeight: '700' }}>
                      인증
                    </AppText>
                  </Pressable>
                )}
                {isAdmin && (
                  <Pressable
                    onPress={() => onDeleteRoutine(routine.id, routine.name)}
                    hitSlop={8}
                    style={{ padding: 4 }}
                  >
                    <AppIcon name="Trash2" size={14} color={c.danger} />
                  </Pressable>
                )}
              </View>
            </Card>
          );
        })
      )}
    </View>
  );
}
