# F7-06 · Estoque baixo para o financeiro

| Campo      | Valor                                                |
| ---------- | ---------------------------------------------------- |
| **Status** | concluída (código) · homologação na Fase 7           |
| **Plano**  | `docs/plans/plano-F7.md` · Passo 6                   |
| **Spec**   | `specs/2026-08-26-f7-06-estoque-baixo-financeiro.md` |
| **Fase**   | 7 de `docs/PLANO.md` (fase ainda aberta)             |

## Objetivo

Avisar o **financeiro por e-mail** quando um insumo entra em reposição (saldo menor que o mínimo, mínimo > 0, incluindo zerado), sem tela de configurações e sem mudar a Hoje nem a lista de estoque. Destino vazio: não dispara.

## Entregue

### Domínio

| Arquivo                                                 | Função                                                |
| ------------------------------------------------------- | ----------------------------------------------------- |
| `src/features/stock/domain/finance-alert.ts`            | Precisa de reposição, cruzou, saiu, destino, episódio |
| `src/features/stock/domain/finance-alert.test.ts`       | Vitest das regras §4.1–4.4                            |
| `src/features/stock/domain/finance-alert-email.ts`      | Assunto e corpo (HTML + texto)                        |
| `src/features/stock/domain/finance-alert-email.test.ts` | Sem PHI; campos obrigatórios; copy                    |
| `src/features/stock/domain/finance-alert-retry.ts`      | 3 tentativas, +5 min, +15 min                         |
| `src/features/stock/domain/finance-alert-retry.test.ts` | Política de retentativa                               |

### Persistência

| Arquivo                                               | Função                                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `supabase/migrations/023_stock_finance_alerts_f7.sql` | Tabela `stock_finance_alerts`, unicidade do episódio aberto, RLS (sem policy para authenticated) |
| `src/lib/supabase/database.types.ts`                  | Tipos da tabela e enum `stock_finance_alert_status`                                              |

Migrations `001`–`022` não foram editadas.

### Borda

| Arquivo                                                  | Função                                                               |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| `src/features/stock/lib/enqueue-finance-alert.ts`        | Criar aviso ao cruzar; cancelar pendente ao sair                     |
| `src/features/stock/lib/send-finance-alert-email.ts`     | Montar e enviar via Resend (mesmo cliente e remetente da F6)         |
| `src/features/stock/lib/process-finance-alerts.ts`       | Pendentes + varredura de itens já em reposição                       |
| `src/app/api/cron/process-stock-finance-alerts/route.ts` | Rotina `CRON_SECRET`; resposta só com contagens                      |
| `src/features/stock/actions.ts`                          | Gancho após cadastro, alteração de mínimo, compra e ajuste           |
| `src/features/stock/lib/apply-withdrawal.ts`             | Gancho após retirada (incluindo override)                            |
| `src/features/stock/lib/apply-stock-entry.ts`            | Gancho após entrada / pacote                                         |
| `src/lib/email/resend-client.ts`                         | `getFinanceAlertEmail()` lê `FINANCE_ALERT_EMAIL`                    |
| `.env.example`                                           | `FINANCE_ALERT_EMAIL` com e-mail de teste só em comentário           |
| `vercel.json`                                            | Manifesto sem relógio nativo. Job acordado pela VPS a cada 5 minutos |

Hoje e Estoque **sem** mudança visual. Sem acoplamento ao módulo de lembretes.

## Testes automatizados

- Precisa / não precisa; cruzou; saiu; mínimo 0; igual ao mínimo; zerado com mínimo > 0.
- Um aviso por episódio; pendente cancelado ao sair; varredura não recria com episódio aberto.
- Destino vazio / inválido não chama o provedor.
- Copy do e-mail: assunto, saldo, mínimo, unidade, ligação `/estoque`; sem paciente; sem travessão.
- Retentativa: 3 tentativas, +5 / +15, depois falhou.

## Evidências de Done

| Comando                | Resultado                                                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test`         | OK · 247 passed, 15 skipped                                                                                                                     |
| `npm run lint`         | Arquivos da fatia: 0 erros. Repo: 1 erro + 2 warnings pré-existentes fora do escopo (`password-input.tsx`, `env.test.ts`, script de migrations) |
| `npx prettier --check` | Arquivos da fatia: OK. `format:check` do repo falha em arquivos legados (fora desta fatia)                                                      |
| `npm run build`        | OK · Next.js 16.3.1 · rota `/api/cron/process-stock-finance-alerts`                                                                             |
| `npm run db:push`      | OK · `023_stock_finance_alerts_f7.sql` aplicada (aviso Docker de cache local, ignorado)                                                         |
| `npm run db:types`     | Tipos da `023` atualizados à mão em `database.types.ts` (CLI exige Docker)                                                                      |

## Pendências

- Endereço de produção do financeiro: pendente com o Felipe (não bloqueia o código). Destino vazio = não dispara.
- Homologação em dispositivo real: fechamento da Fase 7.
- Fechamento documental da Fase 7 inteira **não** entra nesta fatia.

## Segurança (checklist aplicável)

- Destino só no ambiente. Sem tela de configurações. Sem segredo no cliente.
- Rotina protegida por `CRON_SECRET`. Escrita do aviso via `service_role` no servidor.
- RLS na tabela nova: authenticated/anon sem GRANT nem policy (fail secure).
- Falha do aviso não reverte o estoque.
- E-mail e resposta do job sem PHI, sem endereço completo e sem saldo.
