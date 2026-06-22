import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { GrassWidget } from './GrassWidget';
import { ChecklistWidget } from './ChecklistWidget';
import { FastingWidget } from './FastingWidget';
import { readWidgetData, type WidgetData } from './widgetDataBridge';

const EMPTY_DATA: WidgetData = {
  streak: 0,
  todayCompleted: 0,
  todayTotal: 0,
  routineCompleted: 0,
  routineTotal: 0,
  todoCompleted: 0,
  todoTotal: 0,
  checklist: [],
  fasting: {
    status: 'idle',
    goalHours: 16,
    startedAt: null,
    elapsedMs: 0,
    progressPercent: 0,
  },
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction, renderWidget, clickAction, clickActionData } = props;

  if (widgetAction === 'WIDGET_DELETED') return;

  if (widgetAction === 'WIDGET_CLICK' && clickAction) {
    await handleClickAction(clickAction, clickActionData ?? {});
  }

  const data = (await readWidgetData()) ?? EMPTY_DATA;

  const widget = getWidgetComponent(widgetInfo.widgetName, data);
  if (widget) {
    renderWidget(widget);
  }
}

function getWidgetComponent(name: string, data: WidgetData) {
  switch (name) {
    case 'GrassWidget':
      return {
        light: <GrassWidget data={data} theme="light" />,
        dark: <GrassWidget data={data} theme="dark" />,
      };
    case 'ChecklistWidget':
      return {
        light: <ChecklistWidget data={data} theme="light" />,
        dark: <ChecklistWidget data={data} theme="dark" />,
      };
    case 'FastingWidget':
      return {
        light: <FastingWidget data={data} theme="light" />,
        dark: <FastingWidget data={data} theme="dark" />,
      };
    default:
      return null;
  }
}

async function handleClickAction(action: string, data: Record<string, unknown>) {
  if (action === 'TOGGLE_ROUTINE' && typeof data.id === 'string') {
    const { useRoutineCompletionStore } = await import('@/stores/useRoutineCompletionStore');
    const { localDateStr } = await import('@/utils/dateFormat');
    useRoutineCompletionStore.getState().toggleCompletion(data.id, localDateStr());
  }

  if (action === 'TOGGLE_TODO' && typeof data.id === 'string') {
    const { useTodoStore } = await import('@/stores/useTodoStore');
    useTodoStore.getState().completeTodo(data.id);
  }
}
