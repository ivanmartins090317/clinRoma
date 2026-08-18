# Fase 3 · Pacientes e prontuário

| Campo      | Valor                                             |
| ---------- | ------------------------------------------------- |
| **Status** | concluída (código) · homologação manual pendente  |
| **Plano**  | `docs/PLANO.md` §6 · Fase 3                       |
| **Spec**   | `specs/2026-08-18-fase-3-pacientes-prontuario.md` |

## Objetivo

Prontuário eletrônico operacional: cadastro com LGPD, anamnese versionada, odontograma FDI, evolução com foto e áudio, transcrição Whisper assíncrona e auditoria de leitura/escrita.

## Entregue

### Banco de dados (migrations)

| Arquivo                       | Conteúdo                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------- |
| `012_patients_records_f3.sql` | FK consulta em `medical_records`, índice trigram em nome, triggers `updated_at` |
| `013_seed_records_dev.sql`    | Consentimento LGPD em pacientes seed, anamnese e achado odontológico demo       |

### Feature `src/features/patients/`

| Área    | Arquivos                                                      |
| ------- | ------------------------------------------------------------- |
| Domínio | `domain/cpf.ts` + testes                                      |
| Dados   | `queries.ts` (listagem, busca, detalhe)                       |
| Escrita | `actions.ts`, `schemas.ts` (Zod + consentimento LGPD)         |
| UI      | `patient-list.tsx`, `patient-form.tsx`, `patient-summary.tsx` |

### Feature `src/features/records/`

| Área       | Arquivos                                                                 |
| ---------- | ------------------------------------------------------------------------ |
| Domínio    | validade anamnese, FDI, limites MIME, formulário v1, transcrição         |
| Dados      | `queries.ts` (anamnese, odontograma, evoluções, signed URLs)             |
| Escrita    | `actions.ts`, `schemas.ts`, `permissions.ts`                             |
| UI         | ficha com abas, anamnese, odontograma desktop/mobile, evolução, gravador |
| Client lib | `upload-audio-chunk.ts`, `pick-audio-mime.ts`                            |

### Transcrição (server)

| Arquivo                                          | Função                         |
| ------------------------------------------------ | ------------------------------ |
| `src/lib/transcription/whisper.ts`               | Cliente OpenAI Whisper         |
| `src/lib/transcription/enqueue-transcription.ts` | Merge de chunks, job, fila     |
| `src/app/api/records/audio-chunk/route.ts`       | Recebe blocos durante gravação |
| `src/app/api/records/transcribe/route.ts`        | Job de transcrição             |

### Páginas e integrações

- `src/app/(app)/pacientes/page.tsx` · lista com busca
- `src/app/(app)/pacientes/novo/page.tsx` · cadastro LGPD
- `src/app/(app)/pacientes/[id]/page.tsx` · ficha clínica
- Link **Abrir prontuário** em `appointment-detail.tsx` e `/hoje`
- `patient-combobox.tsx` reutiliza busca de `patients`

### Componentes shadcn adicionados

`tabs`, `textarea`, `alert`, `progress`, `scroll-area`, `sonner` (toast leve)

### Testes automatizados

- `patients/domain/cpf.test.ts`
- `records/domain/anamnesis-expiry.test.ts`
- `records/domain/tooth-fdi.test.ts`
- `records/domain/attachment-limits.test.ts`
- `records/lib/pick-audio-mime.test.ts`

## Evidências de Done

| Comando                | Resultado                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `npm run db:push`      | Migrations 012 e 013 aplicadas                                                                                      |
| `npm run db:types`     | Não executado (Docker indisponível); tipos atualizados manualmente em `record_attachments`, `tooth_findings`, enums |
| `npm run lint`         | OK (0 erros)                                                                                                        |
| `npm run format:check` | Ver execução abaixo                                                                                                 |
| `npm run build`        | OK                                                                                                                  |
| `npm run test`         | OK · 70 passed, 15 skipped                                                                                          |

## Pendências menores desta fase

- Homologação manual **iPhone real** e **Android real**: fluxo evolução + áudio + transcrição (§8.5 da spec)
- Homologação desktop: recepção cadastra, dentista preenche anamnese e odontograma
- `OPENAI_API_KEY` configurada no ambiente de dev/staging para transcrição real

## Fora desta fase (correto)

- Painel admin de auditoria, edição pós-transcrição, bloqueio por anamnese expirada, manual-report formal (Fase 6)
