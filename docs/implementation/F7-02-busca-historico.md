# F7-02 · Busca no histórico

| Campo      | Valor                                            |
| ---------- | ------------------------------------------------ |
| **Status** | concluída (código) · homologação na Fase 7       |
| **Plano**  | `docs/plans/plano-F7.md` · Passo 2               |
| **Spec**   | `specs/2026-08-25-f7-02-busca-historico.md`      |
| **Fase**   | 7 de `docs/PLANO.md` (fase ainda aberta)         |

## Objetivo

Na aba Evoluções da ficha, filtrar o histórico **daquele paciente** por um trecho de texto (corpo da evolução e transcrição concluída), indiferente a maiúsculas, sem busca global da clínica.

## Entregue

### Domínio

| Arquivo                                                 | Função                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------- |
| `src/features/records/domain/evolution-search.ts`       | Filtro puro: termo × corpo × transcrição concluída             |
| `src/features/records/domain/evolution-search.test.ts`  | Vitest: `dente 24`, case, trim, transcrição, sem duplicar      |

### Persistência

| Arquivo                                               | Função                                                                 |
| ----------------------------------------------------- | ---------------------------------------------------------------------- |
| `supabase/migrations/021_seed_busca_historico_f7.sql` | Seed incremental: duas evoluções de texto da Maria (uma com `dente 24`) |

Sem schema novo. Migrations `001`–`020` não foram editadas.

### UI

| Arquivo                                               | Função                                              |
| ----------------------------------------------------- | --------------------------------------------------- |
| `src/features/records/components/evolution-search.tsx`| Campo **Buscar no histórico** + limpar              |
| `src/features/records/components/evolution-list.tsx`  | Filtra a lista já carregada; vazio da busca         |

Filtro local, sem nova consulta ao servidor. `patient-chart.tsx`, `queries.ts` e `actions.ts` intactos. F7-01 (correção de transcrição) intacta: a busca usa o texto vigente.

## Testes automatizados

- Casa corpo; casa transcrição **concluída**; não casa pendente/processando/falhou.
- Não duplica (várias transcrições ou corpo + transcrição).
- Trim nas pontas; case-insensitive; substring exata (`dente 24` ≠ `dente24` ≠ `dente  24`).
- Termo vazio = lista completa na ordem; termo sem casamento = lista vazia; não inclui item que não estava na ficha.

## Evidências de Done

| Comando                | Resultado                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `npm run test`         | OK · 179 passed, 15 skipped                                                                                              |
| `npm run lint`         | Arquivos da fatia: 0 erros. Repo: 1 erro + 1 warning pré-existentes fora do escopo (`password-input.tsx`, `env.test.ts`) |
| `npx prettier --check` | Arquivos da fatia: OK. `format:check` do repo falha em arquivos legados (fora desta fatia)                               |
| `npm run build`        | OK · Next.js 16.3.1                                                                                                      |
| `npm run db:push`      | OK · `021_seed_busca_historico_f7.sql` aplicada (aviso Docker de cache local, ignorado)                                  |
| `npm run db:types`     | Não aplicável (sem mudança de schema)                                                                                    |

## Pendências

- Homologação em iPhone/Android reais: fechamento da Fase 7 (viewport mobile nesta fatia).
- Destacar o trecho encontrado e persistir o termo na URL ficam fora de escopo.

## Segurança (checklist aplicável)

- Busca só sobre a lista **já entregue** na leitura da ficha (autorização + RLS existentes).
- Fail secure: visualizador continua sem lista clínica e sem o campo.
- Sem segundo audit por tecla; logs sem corpo, transcrição ou termo buscado.
- Sem busca global; sem escrita no prontuário.
- Sem segredo no cliente. Sem schema/RLS novo.
