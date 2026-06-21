import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetData } from './widgetDataBridge';
import { colors } from '@/constants/colors';

interface Props {
  data: WidgetData;
  theme: 'light' | 'dark';
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function FastingWidget({ data, theme }: Props) {
  const c = colors[theme];
  const f = data.fasting;

  if (f.status !== 'fasting') {
    return (
      <FlexWidget
        style={{
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: c.surface,
          borderRadius: 20,
          padding: 16,
          width: 'match_parent',
          height: 'match_parent',
          flexGap: 6,
        }}
        clickAction="OPEN_APP"
      >
        <TextWidget
          text="단식"
          style={{ fontSize: 11, fontWeight: '600', color: c.inkTertiary }}
        />
        <TextWidget
          text={`${f.goalHours}h`}
          style={{ fontSize: 22, fontWeight: '700', color: c.ink }}
        />
        <TextWidget
          text="시작 →"
          style={{ fontSize: 12, fontWeight: '600', color: c.primary }}
        />
      </FlexWidget>
    );
  }

  const elapsed = f.startedAt ? Date.now() - f.startedAt : 0;
  const progress = Math.min(Math.round((elapsed / (f.goalHours * 3_600_000)) * 100), 100);
  const filled = Math.max(progress, 2);
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
      <TextWidget
        text={`${f.goalHours}h 단식`}
        style={{ fontSize: 11, fontWeight: '600', color: c.inkTertiary }}
      />
      <TextWidget
        text={formatElapsed(elapsed)}
        style={{ fontSize: 20, fontWeight: '700', color: c.ink }}
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
        text={`${progress}%`}
        style={{
          fontSize: 10,
          fontWeight: '600',
          color: c.primary,
          textAlign: 'right',
        }}
      />
    </FlexWidget>
  );
}
