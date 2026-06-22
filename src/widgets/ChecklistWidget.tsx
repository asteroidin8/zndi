import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetData } from './widgetDataBridge';
import { colors } from '@/constants/colors';

interface Props {
  data: WidgetData;
  theme: 'light' | 'dark';
}

function ProgressBar({ filled, total, color, bg }: { filled: number; total: number; color: `#${string}`; bg: `#${string}` }) {
  const ratio = total > 0 ? Math.max(Math.round((filled / total) * 100), 2) : 0;
  const rem = Math.max(100 - ratio, 0);
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
      {ratio > 0 && (
        <FlexWidget style={{ flex: ratio, height: 4, backgroundColor: color, borderRadius: 2 }} />
      )}
      {rem > 0 && <FlexWidget style={{ flex: rem, height: 4 }} />}
    </FlexWidget>
  );
}

function rateText(completed: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((completed / total) * 100)}%`;
}

export function ChecklistWidget({ data, theme }: Props) {
  const c = colors[theme];

  const routineItems = data.checklist.filter((i) => i.type === 'routine');
  const todoItems = data.checklist.filter((i) => i.type === 'todo');

  return (
    <FlexWidget
      style={{
        flexDirection: 'column',
        backgroundColor: c.surface,
        borderRadius: 20,
        padding: 16,
        width: 'match_parent',
        height: 'match_parent',
        flexGap: 10,
      }}
      clickAction="OPEN_APP"
    >
      {/* Two columns */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          flex: 1,
          width: 'match_parent',
          flexGap: 14,
        }}
      >
        {/* Left: Routines */}
        <FlexWidget
          style={{
            flexDirection: 'column',
            flex: 1,
            flexGap: 8,
          }}
        >
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
              style={{ fontSize: 12, fontWeight: '700', color: c.ink }}
            />
            <TextWidget
              text={`${data.routineCompleted}/${data.routineTotal}`}
              style={{ fontSize: 11, fontWeight: '600', color: c.inkTertiary }}
            />
          </FlexWidget>

          <FlexWidget style={{ flexDirection: 'column', flexGap: 3, width: 'match_parent' }}>
            <ProgressBar
              filled={data.routineCompleted}
              total={data.routineTotal}
              color={c.primary}
              bg={c.surfaceMuted}
            />
            <TextWidget
              text={rateText(data.routineCompleted, data.routineTotal)}
              style={{ fontSize: 10, fontWeight: '600', color: c.primary }}
            />
          </FlexWidget>

          <FlexWidget style={{ flexDirection: 'column', flexGap: 6, flex: 1 }}>
            {routineItems.length > 0 ? (
              routineItems.map((item) => (
                <FlexWidget
                  key={item.id}
                  style={{ flexDirection: 'row', alignItems: 'center', flexGap: 6 }}
                  clickAction="TOGGLE_ROUTINE"
                  clickActionData={{ id: item.id }}
                >
                  <FlexWidget
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      backgroundColor: c.surface,
                      borderWidth: 1,
                      borderColor: c.inkDisabled,
                    }}
                  />
                  <TextWidget
                    text={item.title}
                    maxLines={1}
                    truncate="END"
                    style={{ fontSize: 12, color: c.ink }}
                  />
                </FlexWidget>
              ))
            ) : (
              <TextWidget
                text="모두 완료!"
                style={{ fontSize: 11, color: c.primary, fontWeight: '500' }}
              />
            )}
          </FlexWidget>
        </FlexWidget>

        {/* Divider */}
        <FlexWidget
          style={{
            width: 1,
            height: 'match_parent',
            backgroundColor: c.surfaceMuted,
          }}
        />

        {/* Right: Todos */}
        <FlexWidget
          style={{
            flexDirection: 'column',
            flex: 1,
            flexGap: 8,
          }}
        >
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
              style={{ fontSize: 12, fontWeight: '700', color: c.ink }}
            />
            <TextWidget
              text={`${data.todoCompleted}/${data.todoTotal}`}
              style={{ fontSize: 11, fontWeight: '600', color: c.inkTertiary }}
            />
          </FlexWidget>

          <FlexWidget style={{ flexDirection: 'column', flexGap: 3, width: 'match_parent' }}>
            <ProgressBar
              filled={data.todoCompleted}
              total={data.todoTotal}
              color={c.accent}
              bg={c.surfaceMuted}
            />
            <TextWidget
              text={rateText(data.todoCompleted, data.todoTotal)}
              style={{ fontSize: 10, fontWeight: '600', color: c.accent }}
            />
          </FlexWidget>

          <FlexWidget style={{ flexDirection: 'column', flexGap: 6, flex: 1 }}>
            {todoItems.length > 0 ? (
              todoItems.map((item) => (
                <FlexWidget
                  key={item.id}
                  style={{ flexDirection: 'row', alignItems: 'center', flexGap: 6 }}
                  clickAction="TOGGLE_TODO"
                  clickActionData={{ id: item.id }}
                >
                  <FlexWidget
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      backgroundColor: c.surface,
                      borderWidth: 1,
                      borderColor: c.inkDisabled,
                    }}
                  />
                  <TextWidget
                    text={item.title}
                    maxLines={1}
                    truncate="END"
                    style={{ fontSize: 12, color: c.ink }}
                  />
                </FlexWidget>
              ))
            ) : (
              <TextWidget
                text="모두 완료!"
                style={{ fontSize: 11, color: c.accent, fontWeight: '500' }}
              />
            )}
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>

      {/* Bottom: Streak */}
      {data.streak > 0 && (
        <FlexWidget
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            width: 'match_parent',
          }}
        >
          <TextWidget
            text={`🔥 ${data.streak}일 연속`}
            style={{ fontSize: 11, fontWeight: '600', color: c.ink }}
          />
        </FlexWidget>
      )}
    </FlexWidget>
  );
}
