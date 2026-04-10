<template>
  <div class="container">
    <H1>cadastro</H1>
    <p>Insira suas credenciais</p>
    <!--@submit.prevent impede de carregar a pagina -->
    <div class = "campo"></div>
      <form @submit.prevent = "fazerLogin">
      <label> email</label>
      <input
      id = "email"
      v-model= "email"
      type= "email"
      placeholder= "Digite seu email"
      />

  
        <label> senha </label>
        <button type="submit">cadastrar</button>
    </form>
  </div>
</template>

<script>

export default {
  name: "CadastroUser",
};
</script>
