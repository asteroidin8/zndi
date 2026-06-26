import { useState } from 'react';
import { LayoutAnimation, Pressable, View } from 'react-native';

import { AppIcon } from './AppIcon';
import { AppText } from './AppText';
import { Card } from './Card';
import { DrumPicker, type DrumItem } from './DrumPicker';
import { FastingCardCollapsed } from './fasting/FastingCardCollapsed';
import { FastingGoalPicker } from './fasting/FastingGoalPicker';
import { FastingTimer } from './fasting/FastingTimer';
import { SheetModal, SheetPrimaryButton } from './SheetModal';
import { size } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';
import { appAlert } from '@/stores/useAlertStore';
import { useFastingStore } from '@/stores/useFastingStore';
import { feedbackSuccess } from '@/utils/microFeedback';
import { useSettingsStore } from '@/stores/useSettingsStore';

const HOUR_ITEMS_24: DrumItem[] = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}시`,
}));

const HOUR_ITEMS_12: DrumItem[] = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: `${i === 0 ? 12 : i}시`,
}));

const AM_PM_ITEMS: DrumItem[] = [
  { value: 0, label: '오전' },
  { value: 1, label: '오후' },
];

const MINUTE_ITEMS: DrumItem[] = Array.from({ length: 12 }, (_, i) => ({
  value: i * 5,
  label: `${String(i * 5).padStart(2, '0')}분`,
}));

function buildDayItems(year: number, month: number): DrumItem[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => ({ value: i + 1, label: `${i + 1}일` }));
}

function buildMonthItems(): DrumItem[] {
  return Array.from({ length: 12 }, (_, i) => ({ value: i, label: `${i + 1}월` }));
}

export function FastingCard() {
  const c = useThemeColors();
  const timeFormat = useSettingsStore((s) => s.timeFormat ?? '24h');
  const is12h = timeFormat === '12h';
  const status = useFastingStore((s) => s.status);
  const startedAt = useFastingStore((s) => s.startedAt);
  const goalHours = useFastingStore((s) => s.goalHours);
  const records = useFastingStore((s) => s.records);
  const { setGoalHours, startFasting, stopFasting, updateStartTime } = useFastingStore.getState();
  const [expanded, setExpanded] = useState(false);
  const [editStartVisible, setEditStartVisible] = useState(false);
  const [editFields, setEditFields] = useState({ month: 0, day: 1, hour: 0, minute: 0 });

  const goalMs = goalHours * 3_600_000;
  const isOverGoal = status === 'fasting' && startedAt ? Date.now() - startedAt >= goalMs : false;

  function toggleExpanded() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }

  function handleStart() {
    startFasting();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(true);
  }

  function handleComplete() {
    feedbackSuccess();
    stopFasting('completed');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(false);
  }

  function handleAbandon() {
    stopFasting('abandoned');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(false);
  }

  function openEditStart() {
    if (!startedAt) return;
    const d = new Date(startedAt);
    setEditFields({
      month: d.getMonth(),
      day: d.getDate(),
      hour: d.getHours(),
      minute: Math.round(d.getMinutes() / 5) * 5,
    });
    setEditStartVisible(true);
  }

  function handleEditStartConfirm() {
    const year = new Date().getFullYear();
    const newTs = new Date(year, editFields.month, editFields.day, editFields.hour, editFields.minute).getTime();
    if (newTs > Date.now()) {
      appAlert('시간 오류', '미래 시간으로 설정할 수 없어요.');
      return;
    }
    updateStartTime(newTs);
    setEditStartVisible(false);
  }

  const lastRecord = records.length > 0 ? records[records.length - 1] : null;

  if (!expanded) {
    return (
      <FastingCardCollapsed
        status={status}
        goalHours={goalHours}
        startedAt={startedAt}
        lastRecord={lastRecord}
        onPress={toggleExpanded}
      />
    );
  }

  return (
    <>
      <Card>
        <Pressable
          onPress={toggleExpanded}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          accessibilityRole="button"
          accessibilityLabel={expanded ? '단식 접기' : '단식 펼치기'}
        >
          <AppText variant="caption" tone="secondary">
            {status === 'idle'
              ? '단식'
              : isOverGoal
                ? '부스터 모드'
                : `${goalHours}h 단식`}
          </AppText>
          <AppIcon name="ChevronUp" size={size.iconMd} color={c.inkTertiary} />
        </Pressable>

        {status === 'fasting' && startedAt && (
          <FastingTimer
            startedAt={startedAt}
            goalHours={goalHours}
            onComplete={handleComplete}
            onAbandon={handleAbandon}
            onEditStartTime={openEditStart}
          />
        )}

        {status === 'idle' && (
          <FastingGoalPicker
            goalHours={goalHours}
            onGoalChange={setGoalHours}
            onStart={handleStart}
          />
        )}
      </Card>

      <SheetModal
        visible={editStartVisible}
        onClose={() => setEditStartVisible(false)}
        title="시작 시간 수정"
        footer={<SheetPrimaryButton label="확인" onPress={handleEditStartConfirm} />}
        scrollable={false}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 2 }}>
          <DrumPicker
            items={buildMonthItems()}
            selected={editFields.month}
            onSelect={(v) => setEditFields((p) => ({ ...p, month: v }))}
            width={64}
          />
          <DrumPicker
            items={buildDayItems(new Date().getFullYear(), editFields.month)}
            selected={editFields.day}
            onSelect={(v) => setEditFields((p) => ({ ...p, day: v }))}
            width={56}
          />
          {is12h ? (
            <>
              <DrumPicker
                items={AM_PM_ITEMS}
                selected={Math.floor(editFields.hour / 12)}
                onSelect={(v) => setEditFields((p) => ({ ...p, hour: v * 12 + (p.hour % 12) }))}
                width={56}
              />
              <DrumPicker
                items={HOUR_ITEMS_12}
                selected={editFields.hour % 12}
                onSelect={(v) => setEditFields((p) => ({ ...p, hour: Math.floor(p.hour / 12) * 12 + v }))}
                width={56}
              />
            </>
          ) : (
            <DrumPicker
              items={HOUR_ITEMS_24}
              selected={editFields.hour}
              onSelect={(v) => setEditFields((p) => ({ ...p, hour: v }))}
              width={56}
            />
          )}
          <DrumPicker
            items={MINUTE_ITEMS}
            selected={editFields.minute}
            onSelect={(v) => setEditFields((p) => ({ ...p, minute: v }))}
            width={56}
          />
        </View>
      </SheetModal>
    </>
  );
}
