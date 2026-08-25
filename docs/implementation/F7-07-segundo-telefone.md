# F7-07 · Segundo telefone no cadastro

| Campo      | Valor                                        |
| ---------- | -------------------------------------------- |
| **Status** | concluída (código) · homologação na Fase 7   |
| **Plano**  | `docs/plans/plano-F7.md` · Passo 1           |
| **Spec**   | `specs/2026-08-25-f7-07-segundo-telefone.md` |
| **Fase**   | 7 de `docs/PLANO.md` (fase ainda aberta)     |

## Objetivo

Permitir que recepção, dentista e administrador registrem um **segundo telefone opcional** no cadastro, com observação de quem é o contato (parente). Os dados aparecem no resumo cadastral só quando há número, e permanecem ao reabrir a ficha.

## Entregue

### Persistência

| Arquivo                                       | Função                                                               |
| --------------------------------------------- | -------------------------------------------------------------------- |
| `supabase/migrations/019_ajustes_demo_f7.sql` | Colunas `patients.secondary_phone` e `patients.secondary_phone_note` |
| `src/lib/supabase/database.types.ts`          | Tipos dos dois campos                                                |

A migration **019** nesta fatia contém **somente** esses dois campos. Tokens de anamnese e mensagens ao paciente ficam para `020+`.

### Domínio

| Arquivo                                                | Função                                              |
| ------------------------------------------------------ | --------------------------------------------------- |
| `src/features/patients/domain/secondary-phone.ts`      | Trim, opcional, observação sem número, tetos, audit |
| `src/features/patients/domain/secondary-phone.test.ts` | Vitest das regras                                   |

### Borda e UI

| Arquivo                                                | Função                                                |
| ------------------------------------------------------ | ----------------------------------------------------- |
| `src/features/patients/schemas.ts`                     | Validação Zod no criar e no atualizar                 |
| `src/features/patients/actions.ts`                     | Persistência + auditoria sem número completo          |
| `src/features/patients/queries.ts`                     | Leitura dos dois campos no detalhe (lista inalterada) |
| `src/features/patients/components/patient-form.tsx`    | Campos + texto de ajuda                               |
| `src/features/patients/components/patient-summary.tsx` | Bloco do segundo contato só quando há número          |

## Testes automatizados

- `patients/domain/secondary-phone.test.ts`: vazio/opcional; trim; observação sem número; tetos 40/120; flag de auditoria informado/removido/ausente.

## Evidências de Done

| Comando                | Resultado                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `npm run test`         | OK · 142 passed, 15 skipped                                                                                              |
| `npm run lint`         | Arquivos da fatia: 0 erros. Repo: 1 erro + 1 warning pré-existentes fora do escopo (`password-input.tsx`, `env.test.ts`) |
| `npx prettier --check` | Arquivos da fatia: OK. `format:check` do repo falha em 231 arquivos legados (fora desta fatia)                           |
| `npm run build`        | OK · Next.js 16.3.1                                                                                                      |
| `npm run db:push`      | OK · `019_ajustes_demo_f7.sql` aplicada                                                                                  |
| `npm run db:types`     | Não executado (Docker indisponível); tipos dos dois campos atualizados manualmente                                       |

## Pendências

- Homologação em iPhone/Android reais: fechamento da Fase 7 (viewport mobile nesta fatia).
- Itens F7-02 a F7-06, F7-08 e F7-09 ainda não implementados.

## Segurança (checklist aplicável)

- Autorização revalidada na server action (admin, dentista, recepção).
- Fail secure: visualizador e auxiliar não alteram o cadastro.
- Auditoria `create`/`update` em `patients` com `secondaryContact: informed | removed | absent`, sem o número.
- Políticas RLS existentes intactas (colunas novas na mesma tabela).
- Sem segredo no cliente.
