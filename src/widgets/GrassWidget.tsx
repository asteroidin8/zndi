import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetData } from './widgetDataBridge';
import { colors } from '@/constants/colors';

interface Props {
  data: WidgetData;
  theme: 'light' | 'dark';
}

export function GrassWidget({ data, theme }: Props) {
  const c = colors[theme];
  const rate = data.todayTotal > 0
    ? Math.round((data.todayCompleted / data.todayTotal) * 100)
    : 0;

  const filled = Math.max(rate, 2);
  const remaining = 100 - filled;

  return (
    <FlexWidget
      style={{
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: c.surface,
        borderRadius: 20,
        padding: 16,
        width: 'match_parent',
        height: 'match_parent',
        flexGap: 8,
      }}
      clickAction="OPEN_APP"
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
          text="zndi"
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: c.primary,
            letterSpacing: 1,
          }}
        />
        {data.streak > 0 && (
          <TextWidget
            text={`🔥${data.streak}`}
            style={{ fontSize: 11, fontWeight: '600', color: c.ink }}
          />
        )}
      </FlexWidget>

      <TextWidget
        text={`${rate}%`}
        style={{ fontSize: 32, fontWeight: '700', color: c.primary }}
      />

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
        <FlexWidget
          style={{
            flex: filled,
            height: 6,
            backgroundColor: c.primary,
            borderRadius: 3,
          }}
        />
        {remaining > 0 && (
          <FlexWidget style={{ flex: remaining, height: 6 }} />
        )}
      </FlexWidget>

      <TextWidget
        text={`${data.todayCompleted}/${data.todayTotal} 완료`}
        style={{ fontSize: 11, fontWeight: '500', color: c.inkTertiary }}
      />
    </FlexWidget>
  );
}
