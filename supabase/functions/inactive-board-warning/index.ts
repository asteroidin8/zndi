import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { EXPO_PUSH_URL } from '../_shared/constants.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: boards, error } = await supabase.rpc('get_inactive_warning_boards');
  if (error || !boards?.length) {
    return Response.json({ warned: 0 });
  }

  let totalSent = 0;

  for (const board of boards) {
    const { data: tokens } = await supabase.rpc('get_board_push_tokens', {
      p_board_id: board.board_id,
      p_exclude_user_id: null,
    });

    if (!tokens?.length) continue;

    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      sound: 'default',
      title: '보드 비활성 경고',
      body: `"${board.board_name}" 보드가 7일 후 삭제됩니다. 인증하면 유지돼요!`,
      data: { boardId: board.board_id },
    }));

    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    totalSent += messages.length;
  }

  return Response.json({ warned: boards.length, sent: totalSent });
});
