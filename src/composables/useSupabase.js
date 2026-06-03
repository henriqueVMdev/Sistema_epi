import { createClient } from '@supabase/supabase-js'
import { ref } from 'vue'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {    lock: (_name, _acquireTimeout, fn) => fn(),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
})

2const session = ref(null)
const loadingSession = ref(true)
const perfil = ref(null)

async function carregarPerfil(userId) {
  if (!userId) { perfil.value = null; return }
  const { data, error } = await supabase
    .from('funcionarios')
    .select('id, user_id, nome, email, cpf, role, setor_id, avatar_url, setor:setores!funcionarios_setor_id_fkey(id, nome)')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.error('Erro ao carregar perfil:', error)
    perfil.value = null
    return
  }
  let setores = data?.setor ? [data.setor] : []
  if (data) {
    const { data: extras } = await supabase
      .from('funcionario_setores')
      .select('setor:setores(id, nome)')
      .eq('funcionario_id', data.id)
    for (const e of (extras || [])) {
      if (e.setor && !setores.find(s => s.id === e.setor.id)) setores.push(e.setor)
    }
  }
  perfil.value = data ? { ...data, setores } : null
}

supabase.auth.onAuthStateChange((_event, newSession) => {
  session.value = newSession
  carregarPerfil(newSession?.user?.id).finally(() => {
    loadingSession.value = false
  })
})

export function useSupabase() {
  return {
    supabase,
    session,
    loadingSession,
    perfil,
    recarregarPerfil: () => carregarPerfil(session.value?.user?.id)
  }
}
