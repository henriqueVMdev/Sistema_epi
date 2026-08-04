<script setup>
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { useSupabase } from '../composables/useSupabase';
const email = ref('');
const senha = ref('');
const { supabase } = useSupabase();
const error = ref('');
const router = useRouter();

const entrando = ref(false);

async function login() {
  if (entrando.value) return;
  error.value = '';
  if (!email.value.trim() || !senha.value) {
    error.value = 'Informe email e senha.';
    return;
  }
  entrando.value = true;
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: senha.value
  })
  entrando.value = false;

  if (authError) {
    error.value = authError.message;
  } else {
    // estoque é acessível a todos os perfis; o guard redireciona quem tem mais acesso
    router.push('/estoque');
  }
}
</script>

<template>
<div class="container">
  <div class="caixa">
    <form @submit.prevent="login">
      <h1>
        <span class="white">Omni</span><span class="amarelo">Seg</span>
      </h1>

      <p class="mensagem">Entre para gerenciar seu estoque de segurança</p>

      <div class="campo">
        <label for="login-email">Email</label>
        <input id="login-email" v-model="email" type="email" autocomplete="email" autofocus />
      </div>

      <div class="campo">
        <label for="login-senha">Senha</label>
        <input id="login-senha" v-model="senha" type="password" autocomplete="current-password" />
      </div>

      <p class="error" role="alert" v-if="error">{{ error }}</p>

      <button class="btn" type="submit" :disabled="entrando">
        {{ entrando ? 'Entrando…' : 'Entrar na Plataforma' }}
      </button>

      <p class="divisor">Novo na empresa?</p>

      <RouterLink class="link" to="/cadastro_user">Criar uma conta</RouterLink>
    </form>
  </div>
</div>
</template>

<style scoped>
.container {
  background-image: url(../assets/background.webp);
  /* `100%` dimensionava só a largura: em tela alta e estreita sobrava
     fundo vazio embaixo da imagem. */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.caixa {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  position: relative;
  padding: 1.5rem 1rem;
}
.caixa::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 32rem;
  height: 32rem;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, color-mix(in srgb, var(--marca) 70%, transparent) 0%, color-mix(in srgb, var(--marca) 28%, transparent) 40%, transparent 70%);
  filter: blur(60px);
  z-index: 0;
  pointer-events: none;
}
form {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 25rem;
  background-color: var(--superficie);
  border: 1px solid var(--borda);
  display: flex;
  flex-direction: column;
  border-radius: var(--raio);
  padding: 2rem;
}

h1 {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.amarelo { color: var(--marca); }
.white { color: var(--texto-forte); }

.mensagem {
  text-align: center;
  color: var(--texto-suave);
  font-size: 0.95rem;
  margin-top: 0.4rem;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 1.3rem;
}

label {
  color: var(--texto);
  font-size: 0.88rem;
  font-weight: 600;
}

/* mesmo tratamento de input do resto do app: token de superfície, raio e
   borda que reage ao foco */
input {
  min-height: 2.9rem;
  color: var(--texto-forte);
  background-color: var(--superficie-fundo);
  border: 1px solid var(--borda);
  border-radius: var(--raio-sm);
  padding: 0.7rem 0.85rem;
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}
input:focus { border-color: var(--marca); }

.error {
  color: var(--perigo);
  font-size: 0.88rem;
  margin-top: 0.9rem;
}

button.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  background-color: var(--marca);
  color: var(--marca-texto);
  border: none;
  padding: 0.7rem 1.2rem;
  border-radius: var(--raio-sm);
  cursor: pointer;
  margin-top: 1.6rem;
  font-size: 1rem;
  font-weight: 700;
  font-family: inherit;
  transition: background 0.2s;
}
button.btn:hover:not(:disabled) { background-color: var(--marca-escura); }
button.btn:disabled { opacity: 0.6; cursor: not-allowed; }

.divisor {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: var(--texto-suave);
  margin-top: 1.6rem;
  font-size: 0.9rem;
}
.divisor::before,
.divisor::after {
  content: "";
  flex: 1;
  height: 1px;
  background-color: var(--borda-forte);
}

.link {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.9rem;
  text-decoration: none;
  color: var(--marca);
  border: 1px solid color-mix(in srgb, var(--marca) 40%, transparent);
  border-radius: var(--raio-sm);
  margin-top: 0.9rem;
  font-size: 0.95rem;
  font-weight: 700;
  transition: background 0.15s;
}
.link:hover { background: color-mix(in srgb, var(--marca) 12%, transparent); }

</style>