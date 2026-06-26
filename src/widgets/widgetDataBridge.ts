import AsyncStorage from '@react-native-async-storage/async-storage';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { Platform } from 'react-native';

import { WIDGET_GROUP, WIDGET_KEY } from '@/constants/app';

export interface WidgetData {
  streak: number;
  todayCompleted: number;
  todayTotal: number;
  routineCompleted: number;
  routineTotal: number;
  todoCompleted: number;
  todoTotal: number;
  checklist: ChecklistItem[];
  fasting: FastingWidgetData;
}

export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
  type: 'routine' | 'todo';
}

export interface FastingWidgetData {
  status: 'idle' | 'fasting';
  goalHours: number;
  startedAt: number | null;
  elapsedMs: number;
  progressPercent: number;
}

export async function writeWidgetData(data: WidgetData): Promise<void> {
  const json = JSON.stringify(data);

  if (Platform.OS === 'android') {
    try {
      await SharedGroupPreferences.setItem(WIDGET_KEY, json, WIDGET_GROUP);
    } catch {
      await AsyncStorage.setItem(WIDGET_KEY, json);
    }
  }
}

export async function readWidgetData(): Promise<WidgetData | null> {
  try {
    let json: string | null = null;
    if (Platform.OS === 'android') {
      json = await SharedGroupPreferences.getItem(WIDGET_KEY, WIDGET_GROUP).catch(() => null);
    }
    if (!json) {
      json = await AsyncStorage.getItem(WIDGET_KEY);
    }
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}
