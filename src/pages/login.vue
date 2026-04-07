<template>
  <div class="container">
    <H1>Login</H1>
    <p>Entre com suas credenciais</p>
    <!--@submit.prevent impede de carregar a pagina -->
    <form @submit.prevent = "fazerLogin">
      <div class = "campo">
        <label> email</label>
        <!--v-model= liga o campo variavel com o email-->
        <input type="email" v-model= "email" required /> </div>
        <label> senha </label>
        <input type="password" v-model="senha" required />
        <!--V-if Exibe mensagem de erro, se houver -->
        <p v-if="erro" {{ erro }}></p>
        <button type="submit">Entrar</button>
    </form>
  </div>

</template>

<script>
export default {
  name: "Login"
};
</script>
