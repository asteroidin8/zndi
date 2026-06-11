import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { AppText } from '@/components/AppText';
import { Divider } from '@/components/Divider';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  type DailyFastingSummary,
  formatHHMM,
  formatMinutes,
  groupFastingByDay,
} from '@/utils/statsHelper';

// 현재는 mock 데이터, DB 연동 후 실제 데이터로 교체 예정
const MOCK_RECORDS = [
  {
    id: '1',
    startedAt: Date.now() - 20 * 3_600_000,
    endedAt: Date.now() - 4 * 3_600_000,
    goalHours: 16,
    result: 'completed' as const,
  },
  {
    id: '2',
    startedAt: Date.now() - 3 * 24 * 3_600_000,
    endedAt: Date.now() - 3 * 24 * 3_600_000 + 14 * 3_600_000,
    goalHours: 16,
    result: 'abandoned' as const,
  },
];

function MonthGrid({ summaries, onSelect }: { summaries: DailyFastingSummary[]; onSelect: (s: DailyFastingSummary) => void }) {
  const c = useThemeColors();
  const dateMap = new Map(summaries.map((s) => [s.date, s]));

  // 이번 달 날짜 목록
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1);
    return d.toISOString().slice(0, 10);
  });

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {days.map((date) => {
        const summary = dateMap.get(date);
        const isToday = date === new Date().toISOString().slice(0, 10);
        const hasFasting = !!summary;

        return (
          <Pressable
            key={date}
            onPress={() => summary && onSelect(summary)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: isToday ? c.ink : hasFasting ? c.borderStrong : c.border,
              backgroundColor: hasFasting ? c.surfaceSubtle : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText
              variant="caption"
              tone={isToday ? 'primary' : hasFasting ? 'secondary' : 'disabled'}
              style={isToday ? { fontWeight: '700' } : {}}
            >
              {new Date(date).getDate()}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function DayDetailModal({ summary, onClose }: { summary: DailyFastingSummary; onClose: () => void }) {
  const c = useThemeColors();

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
        onPress={onClose}
      />
      <View
        style={{
          backgroundColor: c.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingHorizontal: 20,
          paddingBottom: 34,
          maxHeight: '60%',
        }}
      >
        {/* 핸들 */}
        <View
          style={{
            width: 36,
            height: 4,
            backgroundColor: c.surfaceMuted,
            borderRadius: 2,
            alignSelf: 'center',
            marginTop: 10,
            marginBottom: 16,
          }}
        />

        <AppText variant="title" style={{ marginBottom: 4 }}>
          {summary.date}
        </AppText>
        <AppText variant="caption" tone="tertiary" style={{ marginBottom: 20 }}>
          총 {formatMinutes(summary.totalMinutes)} · {summary.count}회
        </AppText>

        <ScrollView showsVerticalScrollIndicator={false}>
          {summary.records.map((r, i) => (
            <View key={r.id}>
              <View style={{ paddingVertical: 12, gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText variant="body">
                    {formatMinutes(Math.floor((r.endedAt - r.startedAt) / 60_000))}
                  </AppText>
                  <AppText
                    variant="caption"
                    tone={r.result === 'completed' ? 'secondary' : 'tertiary'}
                  >
                    {r.result === 'completed' ? '완료' : '중도 포기'}
                  </AppText>
                </View>
                <AppText variant="caption" tone="tertiary">
                  {formatHHMM(r.startedAt)} → {formatHHMM(r.endedAt)}
                </AppText>
              </View>
              {i < summary.records.length - 1 && <Divider />}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function StatsScreen() {
  const c = useThemeColors();
  const summaries = groupFastingByDay(MOCK_RECORDS);
  const [selected, setSelected] = useState<DailyFastingSummary | null>(null);

  const totalFasts = MOCK_RECORDS.length;
  const completedFasts = MOCK_RECORDS.filter((r) => r.result === 'completed').length;
  const avgMinutes =
    totalFasts > 0
      ? Math.floor(
          MOCK_RECORDS.reduce((acc, r) => acc + (r.endedAt - r.startedAt) / 60_000, 0) /
            totalFasts,
        )
      : 0;

  const now = new Date();
  const monthLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.surface }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="title">통계</AppText>

        {/* 요약 카드 */}
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
          }}
        >
          {[
            { label: '총 단식', value: `${totalFasts}회` },
            { label: '목표 달성', value: `${completedFasts}회` },
            { label: '평균 시간', value: formatMinutes(avgMinutes) },
          ].map((item) => (
            <View
              key={item.label}
              style={{
                flex: 1,
                backgroundColor: c.surfaceSubtle,
                borderRadius: 12,
                padding: 14,
                gap: 4,
              }}
            >
              <AppText variant="caption" tone="tertiary">
                {item.label}
              </AppText>
              <AppText variant="title">{item.value}</AppText>
            </View>
          ))}
        </View>

        <Divider />

        {/* 월간 캘린더 그리드 */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AppText variant="body">{monthLabel}</AppText>
            <AppIcon name="ChevronRight" size={16} color={c.inkTertiary} />
          </View>
          <MonthGrid summaries={summaries} onSelect={setSelected} />
          <AppText variant="caption" tone="disabled">
            단식 기록이 있는 날을 탭해 상세 보기
          </AppText>
        </View>
      </ScrollView>

      {selected && (
        <DayDetailModal summary={selected} onClose={() => setSelected(null)} />
      )}
    </SafeAreaView>
  );
}
