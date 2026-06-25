import { Pressable, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { GrassCell } from '@/components/board/GrassCell';
import { getGrassColor, type GrassCellShape } from '@/constants/grassTheme';
import { spacing } from '@/constants/spacing';
import { WEEKDAY_SHORT } from '@/constants/statsLabels';
import { useThemeColors } from '@/hooks/useThemeColors';

type MemberStat = {
  member: { userId: string; nickname: string; role: string };
  rate: number;
  streak: number;
  weekGrass: number[];
};

export function MembersTab({
  inviteCode,
  isAdmin,
  weekDates,
  memberStats,
  grassColor,
  grassCellShape,
  currentUserId,
  onRefreshCode,
  onDelegateAdmin,
  onKickMember,
}: {
  inviteCode: string;
  isAdmin: boolean;
  weekDates: string[];
  memberStats: MemberStat[];
  grassColor: string;
  grassCellShape: GrassCellShape;
  currentUserId: string | undefined;
  onRefreshCode: () => void;
  onDelegateAdmin: (userId: string, nickname: string) => void;
  onKickMember: (userId: string, nickname: string) => void;
}) {
  const c = useThemeColors();
  const grassHex = getGrassColor(grassColor as Parameters<typeof getGrassColor>[0]);

  return (
    <>
      <Card style={{ alignItems: 'center', gap: spacing.xs }}>
        <AppText variant="caption" tone="tertiary">초대 코드</AppText>
        <AppText variant="title" style={{ fontSize: 24, fontWeight: '700', letterSpacing: 4 }}>
          {inviteCode}
        </AppText>
        {isAdmin && (
          <Pressable onPress={onRefreshCode} hitSlop={8} style={{ padding: 4 }}>
            <AppText variant="caption" style={{ color: c.primary }}>코드 갱신</AppText>
          </Pressable>
        )}
      </Card>

      <View style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'flex-end', paddingRight: 4 }}>
          {weekDates.map((date) => {
            const d = new Date(`${date}T00:00:00`);
            return (
              <View key={date} style={{ width: 28, alignItems: 'center' }}>
                <AppText variant="caption" tone="disabled" style={{ fontSize: 9 }}>
                  {WEEKDAY_SHORT[d.getDay()]}
                </AppText>
              </View>
            );
          })}
        </View>

        {memberStats.map(({ member, rate, streak, weekGrass }) => (
          <View
            key={member.userId}
            style={{
              paddingVertical: spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: c.borderNeutral,
              gap: spacing.xs,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ flex: 1, minWidth: 60 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <AppText variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>
                    {member.nickname}
                  </AppText>
                  {member.role === 'admin' && (
                    <AppIcon name="Crown" size={12} color={c.accent} />
                  )}
                </View>
                <AppText variant="caption" tone="tertiary">
                  {rate}% · 🔥{streak}
                </AppText>
              </View>

              <View style={{ flexDirection: 'row', gap: 6 }}>
                {weekGrass.map((level, i) => (
                  <GrassCell
                    key={i}
                    level={level}
                    size={28}
                    grassHex={grassHex}
                    shape={grassCellShape}
                  />
                ))}
              </View>
            </View>
            {isAdmin && member.userId !== currentUserId && member.role !== 'admin' && (
              <View style={{ flexDirection: 'row', gap: spacing.sm, paddingLeft: 4 }}>
                <Pressable
                  onPress={() => onDelegateAdmin(member.userId, member.nickname)}
                  hitSlop={4}
                  style={{ padding: 2 }}
                >
                  <AppText variant="caption" style={{ color: c.primary, fontSize: 11 }}>관리자 위임</AppText>
                </Pressable>
                <Pressable
                  onPress={() => onKickMember(member.userId, member.nickname)}
                  hitSlop={4}
                  style={{ padding: 2 }}
                >
                  <AppText variant="caption" style={{ color: c.danger, fontSize: 11 }}>추방</AppText>
                </Pressable>
              </View>
            )}
          </View>
        ))}
      </View>
    </>
  );
}
