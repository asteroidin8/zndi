import * as ImagePicker from 'expo-image-picker';

import { getSupabase } from '@/lib/supabase';
import { useBoardStore } from '@/stores/useBoardStore';
import type { BoardRoutine, BoardVerificationLog } from '@/types';

function rowToRoutine(row: Record<string, unknown>): BoardRoutine {
  return {
    id: String(row.id),
    boardId: String(row.board_id),
    name: String(row.name),
    createdBy: String(row.created_by),
    createdAt: String(row.created_at),
  };
}

function rowToLog(row: Record<string, unknown>, photoUrl: string): BoardVerificationLog {
  return {
    id: String(row.id),
    boardId: String(row.board_id),
    routineId: String(row.routine_id),
    userId: String(row.user_id),
    photoPath: String(row.photo_path),
    photoUrl,
    memo: row.memo ? String(row.memo) : null,
    createdAt: String(row.created_at),
    nickname: row.nickname ? String(row.nickname) : undefined,
    routineName: row.routine_name ? String(row.routine_name) : undefined,
  };
}

export async function createBoardRoutine(
  boardId: string,
  userId: string,
  name: string,
): Promise<{ routine?: BoardRoutine; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { data, error } = await supabase
    .from('board_routines')
    .insert({ board_id: boardId, name, created_by: userId })
    .select()
    .single();
  if (error) return { error: error.message };

  const routine = rowToRoutine(data as Record<string, unknown>);
  useBoardStore.getState().addRoutine(routine);
  return { routine };
}

export async function deleteBoardRoutine(
  boardId: string,
  routineId: string,
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { error } = await supabase
    .from('board_routines')
    .delete()
    .eq('id', routineId);
  if (error) return { error: error.message };

  useBoardStore.getState().removeRoutine(boardId, routineId);
  return {};
}

export async function fetchBoardRoutines(boardId: string): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { data, error } = await supabase
    .from('board_routines')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: true });
  if (error) return { error: error.message };

  const routines = (data ?? []).map((r) => rowToRoutine(r as Record<string, unknown>));
  useBoardStore.getState().setRoutines(boardId, routines);
  return {};
}

export async function pickImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: true,
    aspect: [1, 1],
  });
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export async function takePhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7,
    allowsEditing: true,
    aspect: [1, 1],
  });
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

async function uploadPhoto(
  boardId: string,
  userId: string,
  uri: string,
): Promise<{ path?: string; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const fileName = `${userId}/${boardId}/${Date.now()}.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('board-photos')
    .upload(fileName, blob, { contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}` });
  if (error) return { error: error.message };

  return { path: fileName };
}

function getPhotoUrl(path: string): string {
  const supabase = getSupabase();
  if (!supabase) return '';
  const { data } = supabase.storage.from('board-photos').getPublicUrl(path);
  return data.publicUrl;
}

export async function submitVerification(
  boardId: string,
  routineId: string,
  userId: string,
  photoUri: string,
  memo: string | null,
): Promise<{ log?: BoardVerificationLog; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { path, error: uploadError } = await uploadPhoto(boardId, userId, photoUri);
  if (uploadError || !path) return { error: uploadError ?? '사진 업로드 실패' };

  const { data, error } = await supabase
    .from('board_verification_logs')
    .insert({
      board_id: boardId,
      routine_id: routineId,
      user_id: userId,
      photo_path: path,
      memo: memo || null,
    })
    .select()
    .single();
  if (error) return { error: error.message };

  const photoUrl = getPhotoUrl(path);
  const row = data as Record<string, unknown>;
  const log = rowToLog(row, photoUrl);

  const members = useBoardStore.getState().members[boardId] ?? [];
  const member = members.find((m) => m.userId === userId);
  if (member) log.nickname = member.nickname;

  const routines = useBoardStore.getState().routines[boardId] ?? [];
  const routine = routines.find((r) => r.id === routineId);
  if (routine) log.routineName = routine.name;

  useBoardStore.getState().addLog(log);
  return { log };
}

export async function deleteVerification(
  boardId: string,
  logId: string,
  photoPath: string,
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  await supabase.storage.from('board-photos').remove([photoPath]);

  const { error } = await supabase
    .from('board_verification_logs')
    .delete()
    .eq('id', logId);
  if (error) return { error: error.message };

  useBoardStore.getState().removeLog(boardId, logId);
  return {};
}

export async function fetchVerificationLogs(
  boardId: string,
  limit = 50,
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase 미설정' };

  const { data, error } = await supabase
    .from('board_verification_logs')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return { error: error.message };

  const members = useBoardStore.getState().members[boardId] ?? [];
  const routines = useBoardStore.getState().routines[boardId] ?? [];

  const logs = (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const photoUrl = getPhotoUrl(String(r.photo_path));
    const log = rowToLog(r, photoUrl);

    const member = members.find((m) => m.userId === log.userId);
    if (member) log.nickname = member.nickname;

    const routine = routines.find((rt) => rt.id === log.routineId);
    if (routine) log.routineName = routine.name;

    return log;
  });

  useBoardStore.getState().setLogs(boardId, logs);
  return {};
}
