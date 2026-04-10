<template>
  <div class="caixa">
    <form @submit.prevent="login">
      <label>Email:</label>
      <input v-model = "email">

      <label>Senha:</label>
      <input v-model = "senha" type="password">

      <p v-if = "error"> {{ error }} </p>

    <button class = "btn">
      Entrar
    </button>
  </form>
  </div>
</template>

<script setup>

import { ref } from 'vue';
import { useSupabase } from '../composables/useSupabase';
const email = ref('');
const senha = ref('');
const { supabase } = useSupabase();

async function login() {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    senha: senha.value
  })
  if (error) console.error (error.message)
  }
</script>
