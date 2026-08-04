import { ref, onUnmounted } from 'vue';

/**
 * Toast de sucesso/erro da página. Use com <Toast :mensagem="mensagem" />.
 * Guarda o timer: sem isso, o timeout de uma mensagem antiga apagava a nova
 * no meio do caminho quando duas ações aconteciam em sequência.
 */
export function useMensagem() {
  const mensagem = ref(null);
  let timer = null;

  const mostrarMensagem = (tipo, texto, ms = 4000) => {
    clearTimeout(timer);
    mensagem.value = { tipo, texto };
    timer = setTimeout(() => { mensagem.value = null; }, ms);
  };

  onUnmounted(() => clearTimeout(timer));

  return { mensagem, mostrarMensagem };
}
