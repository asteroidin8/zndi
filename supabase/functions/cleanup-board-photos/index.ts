import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: deletedBoards, error } = await supabase
    .from('boards')
    .select('id')
    .not('deleted_at', 'is', null);

  if (error || !deletedBoards?.length) {
    return Response.json({ cleaned: 0 });
  }

  let totalCleaned = 0;

  for (const board of deletedBoards) {
    const { data: logs } = await supabase
      .from('board_verification_logs')
      .select('photo_path')
      .eq('board_id', board.id);

    if (!logs?.length) continue;

    const paths = logs.map((l) => l.photo_path).filter(Boolean);
    if (paths.length === 0) continue;

    const { error: removeError } = await supabase.storage
      .from('board-photos')
      .remove(paths);

    if (!removeError) {
      totalCleaned += paths.length;
    }
  }

  return Response.json({ cleaned: totalCleaned });
});
