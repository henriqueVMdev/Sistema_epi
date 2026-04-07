<template>
  <section class="header">
    <h1>logo que tenho em casa</h1>
    <p>peça uma demonstração</p>
    <button>Login</button>
  </section>

  <Section class="home">
    
    <h2>PROTEJA.</h2>
    <h2>RASTREIE.</h2>
    <h2>CONTROLE.</h2>
    
    <p>
      Reduza os custos da sua empresa aumentando o controle e eficiência
      operacional na gestão de EPIs com as diversas ultilidades do software
      OmniSeg e sinta uma mudança que você sente no bolso.
    </p>
  </Section>

  <section class="apresentacao">
    <h1>Software completo e intuitivo</h1>
    <p>A evolução digital que sua gestão precisa</p>
    <div class="video_container">
      <button>Começar agora</button>
      <div>video ira aqui</div>
    </div>
  </section>

  <section class="funcionalidades">
    <div class="header funcionalidades">
    <h2>FUNCIONALIDADES</h2>
    <h1>Tudo o que você precisa para gestão de EPIs</h1>
    <p>Centralize o controle de estoque, entregas e conformidade em uma interface intuitiva e poderosa.</p>
    </div>

  <div class = cards_section>
    <card class = "cards_func">
      <icon> calma </icon>
      <h1>Rastreamento de estoque</h1>
      <span>
        Controle total do inventário em tempo real. Saiba exatamente quantos
        EPIs estão em uso, em estoque e quando reabastecer.
      </span>
    </card>

    <card class = "cards_func">
      <icon> calma </icon>
      <h1>Alertas Automáticos</h1>
      <span>
        Receba notificações antes do vencimento do CA (Certificado de Aprovação)
        ou da vida útil do equipamento entregue ao colaborador.
      </span>
    </card>

    <card class = "cards_func">
      <icon> calma </icon>
      <h1>Assinatura Digital</h1>
      <span>
        Elimine o papel. Registre a entrega de EPIs com assinatura biométrica ou
        digital, garantindo validade jurídica e organização.
      </span>
    </card>
    </div>

  </section>

  <section class="entrega">

    <img src = "../assets/prancheta.svg" alt="entrega" />
    
    <div class = "textos_entrega"> 
    <h1>Entrega e retirada registrados pelo app</h1>
    <p>
      Nossa tecnologia exclusiva utiliza reconhecimento facial para validar a
      identidade do colaborador no momento da retirada do equipamento, gerando
      uma ficha de EPI digital à prova de fraudes.
    </p>
    

    <div class="check_section">
      <p>Confirmação instantânea</p>
      <p>Localização da entrega</p>
      <p>Atualização de estoque automática</p>
    </div>
    <span>saiba mais sobre a tecnologia</span>
    </div> 
  </section>

  <section class="saiba_mais">
    <p>vantagens</p>
    <h1> Por que escolher OmniSeg?</h1>
    <h2>Organização total</h2>
    <h2>Segurança absoluta</h2>
    <h2>Gastos controlados</h2>
    <span>Transformamos o controle de equipamentos em algo simples e intuitivo. Reforce a segurança da sua equipe com EPIs monitorados e elimine surpresas no orçamento com total previsibilidade de gastos.</span>
    
    <card class="card_SM">
    <h1>Segurança absoluta</h1>
    <span>avisos automáticos de data de devolução e validade do EPI. Notificações lembrando da necessidade da coleta e devolução.</span>    
    </card>

     <card class="card_SM">
    <h1>Dados automáticos</h1>
    <span>Dados semanais de média de descarte, uso, preço com fornecedor, custo em tempo real.</span>    
    </card>

     <card class="card_SM">
    <h1>Vigilância em tempo real</h1>
    <span>Monitora quais epis estão sendo usados por quem e qual setor, quem fez a retirada, quando devem devolver.</span>    
    </card>
    
    <card class="card_SM">
    <h1>Economia e previsibilidade</h1>
    <span>Planilha gerada semanalmente com quais epis devem ser comprados e o custo, mais o custo cadastrado mais barato para os EPIs necessários.</span>    
    </card>

  </section>

  <section class="empresas">
    <h1>Empresas que confiam no nosso projeto</h1>
    <p>venha fazer parte você também</p>
    <img src="../assets/Logo_senai.svg" alt="Senai" />
    </section>
  
  <section class="Chamada">
    <h1>Pronto para modernizar sua gestão?</h1>
    <p>Junte-se ao software que transformou a segurança no trabalho com tecnologia e automação. Teste grátis por 14 dias.</p>
    <button>Fale conosco</button>
    <input type="email" placeholder="Seu e-mail corporativo " />
  </section>

  <section class="footer">
   <img src="../assets/Logo_Omniseg.svg" alt="Logo" />
   <span>Plataforma Focada em gestão de EPIs e
segurança do trabalho. Tecnologia que
salva vidas.</span>

<div class = "footer_links">
<h2>Produto</h2>
<span>Funcionalidades</span>
<span>Integrações</span>
<span>Preços</span>
<span>Atualizações</span>
</div>

<div class = "footer_links">
<h2>Empresa</h2>
<span>Sobre Nós</span>
<span>Carreiras</span>
<span>Blog</span>
<span>Contato</span>
</div>

<div class = "footer_links">
<h2>Legal</h2>
<span>Privacidade</span>
<span>Termos de Uso</span>
<span>Blog</span>
</div>
    
    
    
</section>

</template>


<script>
export default {
  name: "Home",
};
</script>


<style scoped>
/* .home-img {
size: cover;
background-size: cover;
background-position: absolute, center;
background-repeat: no-repeat;
background-attachment: fixed;
} */  

.home {
position: relative;
background-image:url("../assets/Operarios.svg");
background-repeat: no-repeat;
background-size: 100%;
height: 75rem;
box-sizing: border-box;
display: flex;
flex-direction: column;
justify-content: flex-end;
padding-left: 4rem;
}

.home::after{
  z-index:0;
  content:"";
  position:absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 20rem;
  bottom:-300px;
  background: linear-gradient(to top, #1A1612 50%,#000)
   /*rgb(32, 27, 22)?*/
}


.home h2 {
position:relative;
z-index: 1;
display: flex;
flex-direction: column;
font-size: 6rem;
color: #ffffff;
margin: 0%;
bottom:-18rem;
margin-bottom: 1rem;
}

.home p {
  position:relative;
  z-index:1;
  font-size: 2rem;
  color: #ffffff;
  bottom: -17rem;
}

.apresentacao {
  position: relative;
  display: flex;
  margin-top: 18rem;
  flex-direction: column;

}
.apresentacao h1{
  position: relative;
  display: flex;
  justify-content: center;
  color: #ffffff;
  font-size:5rem ;
}
.apresentacao p {
  position: relative;
  display: flex;
  justify-content: center;
  color: #F49D25;
  font-size: 3rem;
}

.video_container {
  display: flex;
  flex-direction: column;
  align-self: center;
  width: 60%;
}

.apresentacao button {
  background-color: #F49D25;
  width: fit-content;
  padding: 0.7rem 0.7rem;
  font-size: 0.7rem;
  color: white;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

.video_container div {
  color: #ffffff;
  width: 100%;
  height: 20rem;
  background-color: #000;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  margin-bottom: 2rem;
}

.funcionalidades{
display: flex;
flex-direction: column;
align-items:center ;
margin-bottom: 1rem;
}

.funcionalidades h2{
color: #F49D25;
}

.funcionalidades h1{
color: #ffffff;
}

.funcionalidades p {
color: #9CA3AF;
}

.cards_section {
  display:flex ;
  flex-direction: row;
  gap:1.5rem;
  justify-content: center;
  margin-left: 4rem;
  margin-right: 4rem;
}

.cards_func {
  background-color: #26201A ;
  border-radius: 1rem;
  padding: 2rem;
}

.cards_func h1 {
  color:#ffffff;
  font-size: 1.2rem;
  margin-top: 0.6rem;
  margin-bottom: 0.3rem;
}

.cards_func span {
  color: #55595f;
}

.entrega {
  display:flex;
  flex-direction:row;
  align-items: stretch;
  gap:2rem;
  background-color: rgba(39, 36, 36, 0.7);
  border-radius: 1.5rem;
  height: 20rem;
  margin-left: 2rem;
  margin-right: 2rem;
}

.entrega img{
  width: 40%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  border-radius: 1rem;
  overflow: hidden;

}


.textos_entrega {
  display: flex;
  flex-direction: column;
  gap: 1rem
}

.check section{
  display: flex;
  flex-direction: column;
  gap: 0.5rem
}

.textos_entrega span {
color: #f7a533;
}

</style>