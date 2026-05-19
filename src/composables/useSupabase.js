import { createClient } from '@supabase/supabase-js'
import { ref } from 'vue'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Desativa o navigator.locks (evita LockAcquireTimeoutError em HMR / múltiplas abas)
    lock: (_name, _acquireTimeout, fn) => fn(),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
})

const session = ref(null)
const loadingSession = ref(true)
const perfil = ref(null) // { id, nome, email, cpf, role, setor_id, setor: { id, nome } }

async function carregarPerfil(userId) {
  if (!userId) { perfil.value = null; return }
  const { data, error } = await supabase
    .from('funcionarios')
    .select('id, nome, email, cpf, role, setor_id, setor:setores(id, nome)')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.error('Erro ao carregar perfil:', error)
    perfil.value = null
    return
  }
  perfil.value = data
}

// IMPORTANTE: não usar `await` em queries dentro deste callback — trava o cliente Supabase.
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
