import AsyncStorage from '@react-native-async-storage/async-storage';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { Platform } from 'react-native';

const WIDGET_GROUP = 'group.com.asteroidin8.zndi';
const WIDGET_KEY = 'zndi_widget_data';

export interface WidgetData {
  weeklyGrass: boolean[];
  streak: number;
  todayCompleted: number;
  todayTotal: number;
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
