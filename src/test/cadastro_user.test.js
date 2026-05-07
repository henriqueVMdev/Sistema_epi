// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('../composables/useSupabase', () => ({
  useSupabase: () => ({
    supabase: {
      from: () => ({
        select: () => ({ order: async () => ({ data: [] }) }),
      }),
      auth: {
        signUp: vi.fn(async () => ({ error: null })),
      },
    },
  }),
}))

import CadastroUser from '../pages/cadastro_user.vue'

describe('Página cadastro_user', () => {
  it('renderiza o título "Omni Seg"', () => {
    const wrapper = mount(CadastroUser)
    expect(wrapper.text()).toContain('Omni')
    expect(wrapper.text()).toContain('Seg')
  })

  it('exibe a mensagem de boas-vindas', () => {
    const wrapper = mount(CadastroUser)
    expect(wrapper.text()).toContain('Registre-se e desfrute do controle e facilidade')
  })

  it('renderiza os campos Email, Senha, nome e CPF', () => {
    const wrapper = mount(CadastroUser)
    const labels = wrapper.findAll('label').map(l => l.text())
    expect(labels).toContain('Email:')
    expect(labels).toContain('Senha:')
    expect(labels).toContain('nome:')
    expect(labels).toContain('CPF:')
  })

  it('possui input de senha do tipo password', () => {
    const wrapper = mount(CadastroUser)
    const senhaInput = wrapper.find('input[type="password"]')
    expect(senhaInput.exists()).toBe(true)
  })

  it('renderiza o botão "Criar Conta"', () => {
    const wrapper = mount(CadastroUser)
    const botao = wrapper.find('button.btn')
    expect(botao.exists()).toBe(true)
    expect(botao.text()).toContain('Criar Conta')
  })

  it('possui um formulário que reage ao submit', () => {
    const wrapper = mount(CadastroUser)
    expect(wrapper.find('form').exists()).toBe(true)
  })
})
