import { getSupabase } from '@/lib/supabase';

export async function sendBoardPush(
  boardId: string,
  title: string,
  body: string,
  excludeUserId?: string,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.functions
    .invoke('send-board-push', {
      body: { boardId, title, body, excludeUserId },
    })
    .catch(() => {});
}
