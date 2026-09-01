# F7-04 + F7-05 · WhatsApp ao paciente e aba pós-cirurgia

| Campo      | Valor                                                |
| ---------- | ---------------------------------------------------- |
| **Status** | concluída (código) · homologação na Fase 7           |
| **Plano**  | `docs/plans/plano-F7.md` · Passo 5                   |
| **Spec**   | `specs/2026-08-28-f7-04-05-whatsapp-pos-cirurgia.md` |
| **Fase**   | 7 de `docs/PLANO.md` (fase ainda aberta)             |

## Objetivo

Dar à equipe um **canal único de WhatsApp da clínica** (só disparo) e duas ações na ficha: aba **Pós-cirurgia** (texto-padrão editável + histórico) e **Enviar questionário por WhatsApp** na anamnese pré-consulta (opcional; tablet da clínica permanece). Canal ausente no ambiente: não dispara; copiar o link continua. Inbox, bot e conversa ficam fora deste repositório.

## Entregue

### Domínio

| Arquivo                                                    | Função                                              |
| ---------------------------------------------------------- | --------------------------------------------------- |
| `src/features/records/domain/whatsapp-destination.ts`      | Ordem do destino e número aproveitável no Brasil    |
| `src/features/records/domain/whatsapp-destination.test.ts` | Vitest §4.2–4.3 (Maria do seed, parente, inválido)  |
| `src/features/records/domain/patient-message.ts`           | Finalidade, teto 2.000, copy, recusas de corpo      |
| `src/features/records/domain/patient-message.test.ts`      | Texto vazio, teto, convite sem CPF, recusa de papel |

### Persistência

| Arquivo                                           | Função                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `supabase/migrations/024_patient_messages_f7.sql` | Tabela `patient_messages`, enums, RLS clínica (sem acesso anônimo) |
| `src/lib/supabase/database.types.ts`              | Tipos da tabela e enums de finalidade, contato e situação          |

Migrations `001`–`023` não foram editadas.

### Borda e UI

| Arquivo                                                        | Função                                                                  |
| -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/lib/whatsapp/send-whatsapp.ts`                            | Adapter server-only (`destino` + `texto`). Canal ausente não chama rede |
| `src/lib/whatsapp/send-whatsapp.test.ts`                       | Canal ausente; destino mascarado em log                                 |
| `src/features/records/lib/send-patient-whatsapp.ts`            | Autorizar, resolver destino, gravar registro, chamar adapter            |
| `src/features/records/permissions.ts`                          | `canSendPatientWhatsApp` (espelho de quem escreve prontuário)           |
| `src/features/records/schemas.ts`                              | Zod do texto e do paciente                                              |
| `src/features/records/actions.ts`                              | Enviar pós-cirurgia; enviar convite pré-consulta por WhatsApp           |
| `src/features/records/queries.ts`                              | Destino na ficha; lista de envios pós-cirurgia; canal configurado       |
| `src/features/records/components/post-surgery-message.tsx`     | Aba: compositor, destino, enviar, lista                                 |
| `src/features/records/components/anamnesis-invite-actions.tsx` | Bloco de convite extraído + botão de WhatsApp pré-consulta              |
| `src/features/records/components/patient-chart.tsx`            | Nova aba; usa o bloco extraído; arquivo não cresceu                     |
| `src/features/records/domain/anamnesis-form-v2.ts`             | Copy do botão e da ajuda pré-consulta                                   |
| `.env.example`                                                 | Três variáveis do canal, vazias                                         |
| `README.md`                                                    | Só a tabela de variáveis do canal                                       |
| `docs/SECURITY.md`                                             | Superfície de disparo: chave no servidor, PHI fora de log               |

## Testes automatizados

- Destino: Maria `11999990001`; máscara `(11) 99999-0001`; `5511…`; lixo/`123`/só DDD; segundo telefone com observação; telefone válido ganha do segundo.
- Texto vazio, teto 2.000, copy do convite sem CPF e sem nome; recusa de visualizador/auxiliar; canal ausente não chama o gateway.
- Destino mascarado em log de falha; chave e corpo ausentes do log.

## Evidências de Done

| Comando                | Resultado                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `npm run test`         | OK · 273 passed, 15 skipped                                                                                           |
| `npm run lint`         | Arquivos da fatia: 0 erros. Repo: 1 erro + 2 warnings pré-existentes (`password-input.tsx`, `env.test.ts`, script db) |
| `npx prettier --check` | Arquivos da fatia: OK. `format:check` do repo falha em arquivos legados (fora desta fatia)                            |
| `npm run build`        | OK · Next.js 16.3.1                                                                                                   |
| `npm run db:push`      | OK · `024_patient_messages_f7.sql` aplicada (aviso Docker de cache local, ignorado)                                   |
| `npm run db:types`     | Tipos da `024` atualizados à mão em `database.types.ts` (CLI exige Docker)                                            |

## Pendências

- Homologação com número de teste e gateway no ar: fechamento da Fase 7.
- Ops da VPS (Docker, túnel, sessão estável) **não** é entrega de código desta fatia.
- Fechamento documental da Fase 7 inteira **não** entra nesta fatia.

## Segurança (checklist aplicável)

- Autorização revalidada no servidor (admin, dentist, reception). Visualizador e auxiliar: fail secure.
- RLS na tabela nova: leitura/escrita só para papéis clínicos; anon sem GRANT.
- Zod na borda do texto e do paciente.
- Chave do gateway só no servidor. Sem `NEXT_PUBLIC_` na chave. Sem `service_role` no client.
- Auditoria de envio: finalidade, paciente, destino mascarado, situação. **Sem** corpo.
