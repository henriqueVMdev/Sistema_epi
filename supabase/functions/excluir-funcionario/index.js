// Edge Function: excluir-funcionario
// Recebe { id } e apaga tanto o registro em "funcionarios" quanto o usuario em auth.users.
// Valida que quem chama tem role 'admin'.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // preflight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return json({ error: 'id obrigatório' }, 400);
    }

    // cliente "admin" com service_role (poder total — só roda no servidor)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    // cliente com o JWT de quem chamou — pra validar que é admin
    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: errUser } = await userClient.auth.getUser();
    if (errUser || !user) {
      return json({ error: 'não autenticado' }, 401);
    }

    // confere que o solicitante é admin
    const { data: perfil } = await admin
      .from('funcionarios')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!perfil || perfil.role !== 'admin') {
      return json({ error: 'apenas admin pode excluir' }, 403);
    }

    if (user.id === id) {
      return json({ error: 'você não pode excluir a si mesmo' }, 400);
    }

    // 1) apaga da tabela funcionarios
    const { error: errF } = await admin.from('funcionarios').delete().eq('id', id);
    if (errF) return json({ error: 'erro ao excluir funcionario: ' + errF.message }, 500);

    // 2) apaga do auth.users
    const { error: errAuth } = await admin.auth.admin.deleteUser(id);
    if (errAuth) return json({ error: 'erro ao excluir login: ' + errAuth.message }, 500);

    return json({ ok: true });
  } catch (e) {
    return json({ error: 'erro inesperado: ' + (e && e.message ? e.message : String(e)) }, 500);
  }
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
