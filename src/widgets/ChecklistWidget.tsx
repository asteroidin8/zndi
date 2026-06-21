import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetData } from './widgetDataBridge';
import { colors } from '@/constants/colors';

interface Props {
  data: WidgetData;
  theme: 'light' | 'dark';
}

export function ChecklistWidget({ data, theme }: Props) {
  const c = colors[theme];
  const rate = data.todayTotal > 0
    ? `${data.todayCompleted}/${data.todayTotal}`
    : '-';

  const items = data.checklist.slice(0, 4);

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
      {/* Left: Grass summary */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          justifyContent: 'center',
          flex: 1,
          flexGap: 8,
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', flexGap: 3 }}>
          {data.weeklyGrass.map((filled, i) => (
            <FlexWidget
              key={`g${i}`}
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                backgroundColor: filled ? c.primary : c.surfaceMuted,
              }}
            />
          ))}
        </FlexWidget>

        <FlexWidget style={{ flexDirection: 'row', flexGap: 8 }}>
          {data.streak > 0 && (
            <TextWidget
              text={`🔥${data.streak}`}
              style={{ fontSize: 11, fontWeight: '600', color: c.ink }}
            />
          )}
          <TextWidget
            text={rate}
            style={{ fontSize: 11, fontWeight: '600', color: c.inkTertiary }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Right: Checklist */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'center',
          flexGap: 6,
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
            text="오늘 할 일 없음"
            style={{ fontSize: 12, color: c.inkDisabled }}
          />
        )}
      </FlexWidget>
    </FlexWidget>
  );
}
