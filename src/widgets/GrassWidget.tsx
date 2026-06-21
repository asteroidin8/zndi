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
    ? `${data.todayCompleted}/${data.todayTotal}`
    : '-';

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
        flexGap: 10,
      }}
      clickAction="OPEN_APP"
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

      <FlexWidget style={{ flexDirection: 'row', flexGap: 4 }}>
        {data.weeklyGrass.map((filled, i) => (
          <FlexWidget
            key={`g${i}`}
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              backgroundColor: filled ? c.primary : c.surfaceMuted,
            }}
          />
        ))}
      </FlexWidget>

      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: 'match_parent',
        }}
      >
        {data.streak > 0 ? (
          <TextWidget
            text={`🔥 ${data.streak}일`}
            style={{ fontSize: 12, fontWeight: '600', color: c.ink }}
          />
        ) : (
          <TextWidget
            text=""
            style={{ fontSize: 12, color: c.ink }}
          />
        )}
        <TextWidget
          text={rate}
          style={{ fontSize: 12, fontWeight: '700', color: c.inkTertiary }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
