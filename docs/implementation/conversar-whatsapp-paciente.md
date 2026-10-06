# Fatia · Conversar com o paciente no WhatsApp

| Campo      | Valor                                                                 |
| ---------- | --------------------------------------------------------------------- |
| **Status** | em código · **não** fecha a Fase 7                                    |
| **Data**   | 2026-10-06                                                            |
| **Spec**   | `specs/2026-10-06-conversar-whatsapp-paciente.md`                     |
| **Plano**  | `docs/plans/plano-conversar-whatsapp-paciente.md`                     |
| **Branch** | `feature/conversar-whatsapp-paciente`                                 |

Admin, dentista e recepção abrem o WhatsApp daquele paciente no computador em que estão. O clique não dispara mensagem pelo número da clínica.

## Entregue

| Arquivo | Função |
| ------- | ------ |
| `src/features/whatsapp/domain/chat-link.ts` | Endereço `wa.me` sem texto clínico e frases do clique |
| `src/features/whatsapp/lib/check-whatsapp-number.ts` | Pergunta ao canal se o número existe. Teto de 15 s. Destino mascarado no registro |
| `src/features/whatsapp/open-patient-chat-action.ts` | Clique autenticado. Recusa visualizador e auxiliar. Não mistura com parear, QR ou desconectar |
| `src/features/whatsapp/components/patient-whatsapp-chat-button.tsx` | Botão **Conversar**, espera, um aviso, abre o chat no mesmo clique |
| `src/features/agenda/components/appointment-detail.tsx` | Botão no modal da consulta |
| `src/features/agenda/components/agenda-day-list.tsx` | Botão na lista, ao lado do item que abre o modal |
| `src/features/agenda/components/agenda-range-list.tsx` | A lista do intervalo repassa a permissão |
| `src/features/agenda/components/agenda-view.tsx` | A permissão desce até a lista e o modal |
| `src/features/patients/components/patient-summary.tsx` | Botão no resumo da ficha |
| `src/features/records/components/patient-chart.tsx` | A ficha decide com quem já lê o status da sessão |
| `src/features/waitlist/components/waitlist-card.tsx` | Botão no card, também para quem só lê |
| `src/app/(app)/agenda/page.tsx` | Repassa se o papel pode abrir |
| `src/app/(app)/fila/page.tsx` | Repassa a permissão ao quadro, sem exigir escrita no card |
| `docs/SECURITY.md` | Nota: o clique não dispara; a chave fica no servidor; o registro mascara o destino |

Não há migration. Agenda e fila continuam sem coluna de telefone. O contrato de disparo não mudou.

A fila não ganhou prop nova no quadro: a página envolve o quadro e o card lê se aquele papel pode abrir. Assim o dentista vê o botão sem permissão de mover o card.

## Testes

| Arquivo | O que cobre |
| ------- | ----------- |
| `src/features/whatsapp/domain/chat-link.test.ts` | Endereço sem texto clínico; só `numberExists` verdadeiro libera; frases sem travessão |
| `src/features/whatsapp/lib/check-whatsapp-number.test.ts` | Existe, não existe, HTTP ruim com destino mascarado, sessão parada, corpo inesperado, 15 s |
| `src/features/whatsapp/open-patient-chat-action.test.ts` | Visualizador e auxiliar não consultam o canal; sessão parada, sem telefone e paciente ilegível também não |

## Evidências (2026-10-06)

| Comando | Resultado |
| ------- | --------- |
| `npx eslint` nos arquivos desta fatia | saída limpa, exit 0 |
| `npm run test` | 66 arquivos, 481 testes passaram, 26 ignorados |
| `npm run build` | Next.js 16.3.1 compilou e o TypeScript passou |
| `npm run lint` no repo inteiro | exit 1 em arquivos que esta fatia não toca (scanner de estoque, lista de estoque, oferta da fila, avisos antigos) |

`npm run db:push` e `npm run db:types` não se aplicam: não houve migration.

## Navegador (2026-10-06, `http://localhost:3000`, recepção, largura 390)

| Caminho | O que se viu |
| ------- | ------------ |
| Lista do dia na agenda | **Conversar** em cada consulta, altura 44 px |
| Clique em **Conversar** na lista | O modal não abriu. A action respondeu 200 em cerca de 3 s e o navegador abriu o WhatsApp do número, sem texto clínico |
| Modal da consulta | **Conversar** junto de **Abrir prontuário** |
| Ficha da mesma paciente | **Conversar** no resumo |
| Fila | **Conversar** nos cards, junto das ações de quem escreve |
| Hoje | Consultas de hoje sem **Conversar** |

## Fora desta fatia

Card de consultas na Hoje, lista geral de pacientes, mensagem pré-preenchida, inbox, auditoria do clique, disparo pelo número da clínica, fechamento da Fase 7.

## Pendência

Homologação com a sessão da clínica deslogada, um número que não existe no WhatsApp, o aviso do segundo contato, e os papéis visualizador e dentista na fila. Ver `docs/state/PENDENCIAS.md`.
