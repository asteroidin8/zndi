// ── Shared ──
export type ItemGroup = {
  id: string;
  name: string;
  order: number;
  collapsed: boolean;
};

// ── Todo ──
export type TodoPriority = 'high' | 'mid' | 'low';
export type TodoGroup = ItemGroup;

export type Todo = {
  id: string;
  title: string;
  priority: TodoPriority;
  dueDate: string | null;
  completedAt: number | null;
  archivedDate: string | null;
  createdAt: number;
  order: number;
  pinnedToHome: boolean;
  pinOrder: number;
  groupId: string | null;
  section: string | null;
  deletedAt?: number;
};

// ── Routine ──
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type RepeatType = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RoutineGroup = ItemGroup;

export type Routine = {
  id: string;
  name: string;
  repeatType: RepeatType;
  repeatDays: Weekday[];
  monthDates: number[];
  repeatInterval: number;
  section: string | null;
  reminderTime: string | null;
  createdAt: number;
  order: number;
  groupId: string | null;
  deletedAt?: number;
};

// ── Fasting ──
export type FastingStatus = 'idle' | 'fasting';
export type FastingResult = 'completed' | 'abandoned';

export type FastingRecord = {
  id: string;
  startedAt: number;
  endedAt: number | null;
  goalHours: number;
  result: FastingResult | null;
};

// ── Weight ──
export type WeightRecord = {
  id: string;
  date: string;
  weightKg: number;
  createdAt: number;
};

// ── User ──
export type UserProfile = {
  heightCm: number | null;
  weightKg: number | null;
  targetWeightKg: number | null;
  ageYears: number | null;
  isMale: boolean | null;
  nickname: string | null;
};

// ── Board ──
export type Board = {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  maxMembers: number;
  createdAt: string;
};

export type BoardMemberRole = 'admin' | 'member';

export type BoardMember = {
  boardId: string;
  userId: string;
  nickname: string;
  joinedAt: string;
  role: BoardMemberRole;
};

export type BoardDailyProgress = {
  boardId: string;
  userId: string;
  date: string;
  routineCompleted: number;
  routineTotal: number;
  todoCompleted: number;
  todoTotal: number;
  streak: number;
};

// ── Board Routine ──
export type BoardRoutine = {
  id: string;
  boardId: string;
  name: string;
  createdBy: string;
  createdAt: string;
  deletedAt?: string;
};

export type BoardVerificationLog = {
  id: string;
  boardId: string;
  routineId: string;
  userId: string;
  photoPath: string;
  photoUrl: string;
  memo: string | null;
  createdAt: string;
  nickname?: string;
  routineName?: string;
};

// ── Board System Message ──
export type BoardSystemMessageType =
  | 'routine_created'
  | 'routine_deleted'
  | 'member_joined'
  | 'member_left'
  | 'member_kicked'
  | 'admin_changed';

export type BoardSystemMessage = {
  id: string;
  boardId: string;
  type: BoardSystemMessageType;
  actorNickname: string;
  targetNickname?: string;
  routineName?: string;
  createdAt: string;
};

// ── Follow ──
export type FollowUser = {
  userId: string;
  nickname: string;
};

export type UserDailyProgress = {
  userId: string;
  date: string;
  routineCompleted: number;
  routineTotal: number;
  todoCompleted: number;
  todoTotal: number;
  streak: number;
};

// ── Settings ──
export type ThemeMode = 'system' | 'light' | 'dark';
export type HintKey = 'swipeActions' | 'longPressEdit';

// ── Theme ──
export type { ColorScheme, ThemeColors } from '@/constants/colors';
