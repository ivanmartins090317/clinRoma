# F7-01 · Transcrição editável

| Campo      | Valor                                             |
| ---------- | ------------------------------------------------- |
| **Status** | concluída (código) · homologação iPhone na Fase 7 |
| **Plano**  | `docs/plans/plano-F7.md` · Passo 1                |
| **Spec**   | `specs/2026-08-25-f7-01-transcricao-editavel.md`  |
| **Fase**   | 7 de `docs/PLANO.md` (fase ainda aberta)          |

## Objetivo

Permitir que dentista e administrador corrijam o texto da transcrição depois que o serviço concluir, sem alterar o áudio original. A correção permanece ao reabrir a ficha.

## Entregue

### Domínio

| Arquivo                                                  | Função                                             |
| -------------------------------------------------------- | -------------------------------------------------- |
| `src/features/records/domain/transcription-edit.ts`      | Situação editável, teto de 10.000, papéis × status |
| `src/features/records/domain/transcription-edit.test.ts` | Vitest das regras                                  |

### Borda e UI

| Arquivo                                                    | Função                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------- |
| `src/features/records/permissions.ts`                      | `canCorrectTranscription` (espelho da retentativa)                  |
| `src/features/records/schemas.ts`                          | `updateTranscriptionSchema`                                         |
| `src/features/records/actions.ts`                          | `updateTranscriptionAction` (auth, persistência, auditoria sem PHI) |
| `src/features/records/components/transcription-status.tsx` | Textarea + **Salvar correção** quando concluída                     |
| `src/features/records/components/evolution-list.tsx`       | Encaminha permissão de correção                                     |
| `src/features/records/components/patient-chart.tsx`        | Encaminha permissão de correção                                     |

Sem migration: o campo de texto da transcrição já existia.

## Testes automatizados

- `records/domain/transcription-edit.test.ts`: quem pode corrigir × situação; texto vazio / longo / válido; anexo que não é áudio.

## Evidências de Done

| Comando                | Resultado                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `npm run test`         | OK · 127 passed, 15 skipped                                                                                              |
| `npm run lint`         | Arquivos da fatia: 0 erros. Repo: 1 erro + 1 warning pré-existentes fora do escopo (`password-input.tsx`, `env.test.ts`) |
| `npx prettier --check` | Arquivos da fatia: OK                                                                                                    |
| `npm run build`        | OK · Next.js 16.3.1                                                                                                      |
| `npm run db:push`      | Não aplicável (sem migration)                                                                                            |

## Pendências

- Homologação em iPhone/Android reais: fechamento da Fase 7 (viewport mobile nesta fatia).
- Itens F7-02 a F7-09 ainda não implementados.

## Segurança (checklist aplicável)

- Autorização revalidada na server action (admin e dentist).
- Fail secure: recepção e visualizador não alteram o texto.
- Auditoria `update` em `record_attachments` sem corpo da transcrição.
- Políticas RLS existentes intactas.
- Sem segredo no cliente.
