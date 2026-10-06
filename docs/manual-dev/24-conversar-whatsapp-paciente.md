# Fatia · Conversar com o paciente no WhatsApp

| Status                         | Spec                                              |
| ------------------------------ | ------------------------------------------------- |
| código entregue · Fase 7 aberta | `specs/2026-10-06-conversar-whatsapp-paciente.md` |

Registro objetivo: [`docs/implementation/conversar-whatsapp-paciente.md`](../implementation/conversar-whatsapp-paciente.md).

A Fase 7 **não fecha** com esta fatia. O ClinRoma continua sem inbox. O clique não manda mensagem pelo número pareado da clínica.

## O que esta fatia entrega

- Botão **Conversar** no modal da consulta, na ficha, na lista do dia (também quando a agenda está num intervalo) e no card da fila
- Quem vê: administrador, dentista e recepção. Na fila, ler o quadro basta
- Antes de abrir, o servidor confere a sessão guardada da clínica e, se ela está em operação, pergunta ao canal se o número existe
- O chat abre neste computador. Procedimento, observação e nome não vão no endereço
- Se o destino for o segundo contato, o aviso é **Abrindo conversa com o segundo contato.**

**Não entrega:** botão nas consultas da Hoje nem na lista geral de pacientes, mensagem pronta, histórico, auditoria do clique, mudança no disparo de pós-cirurgia, questionário ou oferta da fila.

## Árvore

```text
src/features/whatsapp/
├── domain/chat-link.ts (+ .test.ts)
├── lib/check-whatsapp-number.ts (+ .test.ts)
├── open-patient-chat-action.ts (+ .test.ts)
└── components/patient-whatsapp-chat-button.tsx
```

A agenda, a ficha e a fila só encaixam esse botão. O telefone não entra na leitura da agenda nem da fila: o clique leva o paciente e o servidor lê o cadastro.

## Fluxo

1. A pessoa clica em **Conversar**. O botão espera e ignora outro clique até a resposta.
2. Sem sessão autenticada, o fluxo de login de hoje. Visualizador e auxiliar são recusados e o canal não é consultado.
3. O destino é o telefone do cadastro, se for aproveitável; senão o segundo contato. Sem os dois, o aviso pede o cadastro.
4. Sessão guardada fora de operação: **WhatsApp não está logado.** O canal não é consultado.
5. Sessão em operação: o canal confirma o número. Só confirmação explícita abre `https://wa.me/{dígitos}`.
6. Número ausente: **Este número não está no WhatsApp.**
7. Rede, resposta ruim, corpo inesperado ou 15 s: **Não foi possível falar com o WhatsApp da clínica. Tente de novo em instantes.**
8. Se o status guardado diz que está em operação e o canal responde que a sessão parou, a tela usa **WhatsApp não está logado.**

A conversa sai da conta de WhatsApp aberta neste computador. A sessão da clínica só serve para as duas conferências.

## Homologação manual

Contas de desenvolvimento: capítulo [`03-fase-1-dados-auth-papeis.md`](./03-fase-1-dados-auth-papeis.md).

| Cenário | Conta | O que conferir |
| ------- | ----- | -------------- |
| Lista, modal, ficha e fila | Recepção | **Conversar** aparece. O clique na lista não abre o modal |
| Número que existe | Recepção, sessão da clínica logada | O WhatsApp deste computador abre, sem texto clínico |
| Número que não existe | Recepção | **Este número não está no WhatsApp.** |
| Sessão deslogada | Recepção | **WhatsApp não está logado.** O canal de existência não precisa ser chamado |
| Segundo contato | Paciente sem telefone de cadastro aproveitável | **Abrindo conversa com o segundo contato.** |
| Dentista na fila | Dentista | Vê **Conversar** sem poder mover o card |
| Visualizador | Visualizador | Agenda e ficha sem o botão |

Em 2026-10-06 a recepção viu o botão nas quatro superfícies e um número existente abriu o WhatsApp. Os outros cenários da tabela seguem em [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md).

## Comandos

```bash
npm run test
npm run lint
npm run build
```

Não há migration nesta fatia.
