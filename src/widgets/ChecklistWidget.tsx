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
        height: 6,
        borderRadius: 3,
        backgroundColor: bg,
        width: 'match_parent',
        overflow: 'hidden',
      }}
    >
      <FlexWidget style={{ flex: ratio, height: 6, backgroundColor: color, borderRadius: 3 }} />
      {rem > 0 && <FlexWidget style={{ flex: rem, height: 6 }} />}
    </FlexWidget>
  );
}

export function ChecklistWidget({ data, theme }: Props) {
  const c = colors[theme];
  const rate = data.todayTotal > 0
    ? Math.round((data.todayCompleted / data.todayTotal) * 100)
    : 0;

  const overallFilled = Math.max(rate, 2);
  const overallRem = 100 - overallFilled;

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
      {/* Left: Overall rate */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: 90,
          flexGap: 6,
        }}
      >
        <TextWidget
          text="zndi"
          style={{ fontSize: 10, fontWeight: '700', color: c.primary, letterSpacing: 1 }}
        />
        <TextWidget
          text={`${rate}%`}
          style={{ fontSize: 36, fontWeight: '700', color: c.primary }}
        />
        {data.streak > 0 && (
          <TextWidget
            text={`🔥 ${data.streak}일`}
            style={{ fontSize: 11, fontWeight: '600', color: c.ink }}
          />
        )}
      </FlexWidget>

      {/* Right: Breakdown */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'center',
          flexGap: 12,
        }}
      >
        {/* Overall progress bar */}
        <FlexWidget style={{ flexDirection: 'column', flexGap: 4 }}>
          <FlexWidget
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: 'match_parent',
            }}
          >
            <TextWidget
              text="전체"
              style={{ fontSize: 11, fontWeight: '600', color: c.inkTertiary }}
            />
            <TextWidget
              text={`${data.todayCompleted}/${data.todayTotal}`}
              style={{ fontSize: 11, fontWeight: '700', color: c.ink }}
            />
          </FlexWidget>
          <FlexWidget
            style={{
              flexDirection: 'row',
              height: 6,
              borderRadius: 3,
              backgroundColor: c.surfaceMuted,
              width: 'match_parent',
              overflow: 'hidden',
            }}
          >
            <FlexWidget style={{ flex: overallFilled, height: 6, backgroundColor: c.primary, borderRadius: 3 }} />
            {overallRem > 0 && <FlexWidget style={{ flex: overallRem, height: 6 }} />}
          </FlexWidget>
        </FlexWidget>

        {/* Routine */}
        <FlexWidget style={{ flexDirection: 'column', flexGap: 4 }}>
          <FlexWidget
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: 'match_parent',
            }}
          >
            <TextWidget
              text="루틴"
              style={{ fontSize: 11, fontWeight: '500', color: c.inkTertiary }}
            />
            <TextWidget
              text={`${data.routineCompleted}/${data.routineTotal}`}
              style={{ fontSize: 11, fontWeight: '600', color: c.inkSecondary }}
            />
          </FlexWidget>
          <ProgressBar
            filled={data.routineCompleted}
            total={data.routineTotal}
            color={c.primary}
            bg={c.surfaceMuted}
          />
        </FlexWidget>

        {/* Todo */}
        <FlexWidget style={{ flexDirection: 'column', flexGap: 4 }}>
          <FlexWidget
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: 'match_parent',
            }}
          >
            <TextWidget
              text="할일"
              style={{ fontSize: 11, fontWeight: '500', color: c.inkTertiary }}
            />
            <TextWidget
              text={`${data.todoCompleted}/${data.todoTotal}`}
              style={{ fontSize: 11, fontWeight: '600', color: c.inkSecondary }}
            />
          </FlexWidget>
          <ProgressBar
            filled={data.todoCompleted}
            total={data.todoTotal}
            color={c.accent}
            bg={c.surfaceMuted}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
