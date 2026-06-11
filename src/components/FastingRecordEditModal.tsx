import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { AppText } from './AppText';
import { Divider } from './Divider';
import { type FastingRecord, type FastingResult } from '@/stores/useFastingStore';
import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  visible: boolean;
  record: FastingRecord | null;
  onSave: (updates: Pick<FastingRecord, 'result'>) => void;
  onDelete: () => void;
  onClose: () => void;
};

function formatDatetime(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  const ampm = d.getHours() < 12 ? '오전' : '오후';
  return `${d.getMonth() + 1}/${d.getDate()} ${ampm} ${d.getHours() % 12 || 12}:${pad(d.getMinutes())}`;
}

function formatDuration(startedAt: number, endedAt: number | null) {
  if (!endedAt) return '-';
  const mins = Math.floor((endedAt - startedAt) / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

const RESULT_OPTIONS: { value: FastingResult; label: string }[] = [
  { value: 'completed', label: '완료' },
  { value: 'abandoned', label: '중도 포기' },
];

export function FastingRecordEditModal({ visible, record, onSave, onDelete, onClose }: Props) {
  const c = useThemeColors();
  const [result, setResult] = useState<FastingResult>('completed');

  useEffect(() => {
    if (record?.result) setResult(record.result);
  }, [record]);

  if (!record) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
          maxHeight: '65%',
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
            marginBottom: 20,
          }}
        />

        <AppText variant="body" style={{ fontWeight: '700', marginBottom: 16 }}>
          단식 기록 편집
        </AppText>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 기록 요약 */}
          <View
            style={{
              backgroundColor: c.surfaceSubtle,
              borderRadius: 12,
              padding: 14,
              gap: 8,
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="caption" tone="tertiary">
                시작
              </AppText>
              <AppText variant="caption">{formatDatetime(record.startedAt)}</AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="caption" tone="tertiary">
                종료
              </AppText>
              <AppText variant="caption">
                {record.endedAt ? formatDatetime(record.endedAt) : '-'}
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="caption" tone="tertiary">
                총 시간
              </AppText>
              <AppText variant="caption">
                {formatDuration(record.startedAt, record.endedAt)}
              </AppText>
            </View>
          </View>

          {/* 결과 변경 */}
          <AppText variant="caption" tone="tertiary" style={{ marginBottom: 10 }}>
            결과
          </AppText>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {RESULT_OPTIONS.map((opt) => {
              const selected = result === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setResult(opt.value)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: selected ? c.ink : c.border,
                    backgroundColor: selected ? c.surfaceSubtle : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <AppText
                    variant="caption"
                    tone={selected ? 'primary' : 'tertiary'}
                    style={selected ? { fontWeight: '700' } : {}}
                  >
                    {opt.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {/* 저장 */}
          <Pressable
            onPress={() => onSave({ result })}
            style={{
              backgroundColor: c.ink,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <AppText variant="body" style={{ color: c.surface, fontWeight: '700' }}>
              저장
            </AppText>
          </Pressable>

          <Divider />

          {/* 삭제 */}
          <Pressable
            onPress={onDelete}
            style={{ paddingVertical: 14, alignItems: 'center' }}
          >
            <AppText variant="body" style={{ color: '#EF4444' }}>
              기록 삭제
            </AppText>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}
