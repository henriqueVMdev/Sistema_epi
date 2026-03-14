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

  <section class="apresentação">
    <h3>Software completo e intuitivo</h3>
    <p>A evolução digital que sua gestão precisa</p>
    <button>Começar agora</button>
    <div>video ira aqui</div>
  </section>

  <section class="funcionalidades">
    <card>
      <h4>Rastreamento de estoque</h4>
      <span>
        Controle total do inventário em tempo real. Saiba exatamente quantos
        EPIs estão em uso, em estoque e quando reabastecer.
      </span>
    </card>

    <card class = "cards_func">
      <h4>Alertas Automáticos</h4>
      <span>
        Receba notificações antes do vencimento do CA (Certificado de Aprovação)
        ou da vida útil do equipamento entregue ao colaborador.
      </span>
    </card>

    <card class = "cards_func">
      <h4>Assinatura Digital</h4>
      <span>
        Elimine o papel. Registre a entrega de EPIs com assinatura biométrica ou
        digital, garantindo validade jurídica e organização.
      </span>
    </card>
  </section>

  <section class="entrega">
    <h5>Entrega e retirada registrados pelo app</h5>
    <p>
      Nossa tecnologia exclusiva utiliza reconhecimento facial para validar a
      identidade do colaborador no momento da retirada do equipamento, gerando
      uma ficha de EPI digital à prova de fraudes.
    </p>

    <div>
      <p>Confirmação instantânea</p>
    </div>

    <div>
      <p>Localização da entrega</p>
    </div>

    <div>
      <p>Atualização de estoque automática</p>
    </div>
    <p>saiba mais sobre a tecnologia</p>
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
background-image:url("../assets/Operarios.svg");
background-repeat: no-repeat;
background-size: contain;
height: 60rem;
width: max-width;
}


.home h2 {
display: flex;
flex-direction: column;
font-size: 5rem;
color: #ffffff;
margin: 0%;
}

.home p {
  font-size: 1rem;
}
</style>