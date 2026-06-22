import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetData } from './widgetDataBridge';
import { colors } from '@/constants/colors';

interface Props {
  data: WidgetData;
  theme: 'light' | 'dark';
}

function ProgressBar({ filled, total, color, bg }: { filled: number; total: number; color: `#${string}`; bg: `#${string}` }) {
  const ratio = total > 0 ? Math.max(Math.round((filled / total) * 100), 2) : 2;
  const rem = 100 - ratio;
  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        height: 4,
        borderRadius: 2,
        backgroundColor: bg,
        width: 'match_parent',
        overflow: 'hidden',
      }}
    >
      <FlexWidget style={{ flex: ratio, height: 4, backgroundColor: color, borderRadius: 2 }} />
      {rem > 0 && <FlexWidget style={{ flex: rem, height: 4 }} />}
    </FlexWidget>
  );
}

export function ChecklistWidget({ data, theme }: Props) {
  const c = colors[theme];
  const items = data.checklist.slice(0, 5);

  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        backgroundColor: c.surface,
        borderRadius: 20,
        padding: 16,
        width: 'match_parent',
        height: 'match_parent',
        flexGap: 16,
      }}
      clickAction="OPEN_APP"
    >
      {/* Left: Stats */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          justifyContent: 'center',
          width: 100,
          flexGap: 12,
        }}
      >
        <FlexWidget style={{ flexDirection: 'column', flexGap: 4 }}>
          <FlexWidget
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: 'match_parent',
            }}
          >
            <TextWidget
              text="루틴"
              style={{ fontSize: 11, fontWeight: '600', color: c.inkTertiary }}
            />
            <TextWidget
              text={`${data.routineCompleted}/${data.routineTotal}`}
              style={{ fontSize: 11, fontWeight: '700', color: c.ink }}
            />
          </FlexWidget>
          <ProgressBar
            filled={data.routineCompleted}
            total={data.routineTotal}
            color={c.primary}
            bg={c.surfaceMuted}
          />
        </FlexWidget>

        <FlexWidget style={{ flexDirection: 'column', flexGap: 4 }}>
          <FlexWidget
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: 'match_parent',
            }}
          >
            <TextWidget
              text="할일"
              style={{ fontSize: 11, fontWeight: '600', color: c.inkTertiary }}
            />
            <TextWidget
              text={`${data.todoCompleted}/${data.todoTotal}`}
              style={{ fontSize: 11, fontWeight: '700', color: c.ink }}
            />
          </FlexWidget>
          <ProgressBar
            filled={data.todoCompleted}
            total={data.todoTotal}
            color={c.accent}
            bg={c.surfaceMuted}
          />
        </FlexWidget>

        {data.streak > 0 && (
          <TextWidget
            text={`🔥 ${data.streak}일 연속`}
            style={{ fontSize: 11, fontWeight: '600', color: c.ink }}
          />
        )}
      </FlexWidget>

      {/* Divider */}
      <FlexWidget
        style={{
          width: 1,
          height: 'match_parent',
          backgroundColor: c.surfaceMuted,
        }}
      />

      {/* Right: Checklist */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'center',
          flexGap: 7,
        }}
      >
        {items.length > 0 ? (
          items.map((item) => (
            <FlexWidget
              key={item.id}
              style={{ flexDirection: 'row', alignItems: 'center', flexGap: 6 }}
              clickAction={item.done ? undefined : `TOGGLE_${item.type.toUpperCase()}`}
              clickActionData={{ id: item.id }}
            >
              <FlexWidget
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  backgroundColor: item.done ? c.primary : c.surface,
                  borderWidth: item.done ? 0 : 1,
                  borderColor: item.done ? c.primary : c.inkDisabled,
                }}
              />
              <TextWidget
                text={item.title}
                maxLines={1}
                truncate="END"
                style={{
                  fontSize: 12,
                  color: item.done ? c.inkTertiary : c.ink,
                  fontWeight: '400',
                }}
              />
            </FlexWidget>
          ))
        ) : (
          <TextWidget
            text="오늘 할 일 없음 ✨"
            style={{ fontSize: 12, color: c.inkDisabled }}
          />
        )}
      </FlexWidget>
    </FlexWidget>
  );
}
