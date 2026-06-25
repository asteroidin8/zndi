import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushRequest {
  boardId: string;
  title: string;
  body: string;
  excludeUserId?: string;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { boardId, title, body, excludeUserId } = (await req.json()) as PushRequest;

  const { data: tokens, error } = await supabase.rpc('get_board_push_tokens', {
    p_board_id: boardId,
    p_exclude_user_id: excludeUserId ?? null,
  });

  if (error || !tokens?.length) {
    return Response.json({ sent: 0 });
  }

  const messages = tokens.map((t: { token: string }) => ({
    to: t.token,
    sound: 'default',
    title,
    body,
    data: { boardId },
  }));

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });

  const result = await res.json();
  return Response.json({ sent: messages.length, result });
});
