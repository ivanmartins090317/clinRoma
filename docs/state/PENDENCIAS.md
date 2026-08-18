# Pendências · ClinRoma

Fonte viva do que **ainda falta implementar ou validar**. Atualizar ao concluir cada fase.

Última revisão: **2026-08-18** (após Fase 4 · código entregue).

---

## Fase 1 · Fechamento operacional

Itens da F1 já codificados, mas ainda não homologados manualmente:

- [ ] Login como recepção (`reception@clinroma.dev`) e navegação só nos módulos permitidos
- [ ] Login como dentista e tentativa de acessar Scan QR (deve negar)
- [ ] Login como auxiliar (`assistant@clinroma.dev`): Estoque + Scan OK; Agenda/Pacientes/Fila negados
- [ ] Visitante em `/fila/resposta/exemplo-token` sem redirect ao login e sem shell interno
- [ ] Logout limpa sessão; `/agenda` volta a exigir login
- [ ] Rodar `npm run format:check` limpo no repo (ajustar arquivos legados da F0)
- [ ] Regerar `database.types.ts` via `npm run db:types` (requer Docker para Supabase CLI)

---

## Fase 2 · Fechamento operacional

Código entregue (ver `docs/implementation/F2-agenda.md`). Homologação manual pendente:

- [ ] Recepção (desktop): criar consulta em slot livre, buscar paciente seed
- [ ] Recepção: remarcar arrastando com confirmação
- [ ] Recepção: cancelar consulta (slot liberado)
- [ ] Recepção: tentar conflito de horário (mesmo dentista) e ver mensagem de bloqueio
- [ ] Dentista (mobile/viewport estreito): lista do dia filtrada no Dr. Felipe Roma, somente leitura
- [ ] Visualizador: ver agenda sem ações de escrita
- [ ] Auxiliar: acesso a `/agenda` negado (403)
- [ ] Verificar bundle mobile sem `react-big-calendar` (dynamic import só em `md+`)

**Pronto quando:** recepção marca/remarca/cancela consulta; dentista vê agenda do dia no celular.

---

## Fase 2 · Implementação (concluída)

Referência: `docs/PLANO.md` §6 · `specs/2026-08-18-fase-2-agenda.md`

- [x] `src/features/agenda/` (queries, actions, schemas, domain, componentes)
- [x] Calendário com coluna por dentista (`agenda-calendar.tsx`)
- [x] Visões dia e semana (desktop); lista do dia agrupada por dentista (mobile)
- [x] CRUD consulta: criar, editar, remarcar, cancelar
- [x] Drag-and-drop para remarcar com confirmação
- [x] Bloqueio de conflito de horário (domínio + migration 010)
- [x] `/hoje` com consultas reais do dia
- [x] Import dinâmico do calendário só a partir de `md`
- [x] Seed: pacientes fictícios + consultas (`011_seed_agenda_dev.sql`)
- [x] Documentação: `docs/implementation/F2-agenda.md`, `docs/manual-dev/04-fase-2-agenda.md`

---

## Fase 3 · Pacientes e prontuário

Referência: `specs/2026-08-18-fase-3-pacientes-prontuario.md` · `docs/implementation/F3-pacientes-prontuario.md`

### Implementação (concluída)

- [x] `src/features/patients/` (busca, cadastro LGPD, componentes)
- [x] `src/features/records/` (anamnese, odontograma, evolução, gravador, transcrição)
- [x] Migrations `012_patients_records_f3.sql`, `013_seed_records_dev.sql`
- [x] Páginas `/pacientes`, `/pacientes/novo`, `/pacientes/[id]`
- [x] Link **Abrir prontuário** na agenda e Hoje
- [x] API `/api/records/audio-chunk` e `/api/records/transcribe`
- [x] Testes Vitest de domínio (CPF, FDI, anamnese 12m, MIME)
- [x] Documentação F3 em `docs/implementation/` e `docs/manual-dev/`

### Fechamento operacional (homologação manual)

- [ ] **iPhone real:** fluxo evolução + foto + áudio + transcrição sem reload (§8.5 spec)
- [ ] **Android real:** mesmo fluxo com WebM/Opus
- [ ] Desktop: recepção cadastra paciente; dentista anamnese + odontograma
- [ ] Configurar `OPENAI_API_KEY` no ambiente de dev para transcrição real
- [ ] Visualizador: só cadastro, sem abas clínicas

**Pronto quando:** dentista documenta atendimento no celular com áudio transcrito; recepção cadastra e localiza pacientes.

---

## Fase 4 · Fila Kanban

Referência: `specs/2026-08-18-fase-4-fila-kanban.md` · `docs/implementation/F4-fila-kanban.md`

### Implementação (concluída)

- [x] `src/features/waitlist/` (queries, actions, schemas, domain, componentes)
- [x] Migrations `014_waitlist_f4.sql`, `015_seed_waitlist_dev.sql`
- [x] Kanban real em `/fila` (desktop DnD + mobile abas/menu)
- [x] CRUD fila com LGPD e unicidade de entrada ativa
- [x] Oferta de horário com token opaco, hash, validade 40 min
- [x] Página pública `/fila/resposta/[token]` aceitar/recusar
- [x] Aceite cria consulta `confirmed` com validação de conflito
- [x] API pública + cron de expiração
- [x] Resumo fila em `/hoje`
- [x] Atalho oferta pós-cancelamento na agenda
- [x] Testes Vitest de domínio (expiração, token, nome parcial, transições)
- [x] Documentação F4 em `docs/implementation/` e `docs/manual-dev/`

### Fechamento operacional (homologação manual)

- [ ] Recepção: incluir paciente, ofertar horário, copiar link
- [ ] Paciente (mobile/viewport estreita): aceitar link seed → consulta na agenda
- [ ] Cenário recusa: card volta a Aguardando
- [ ] Expiração: cron ou curl manual + link expirado na UI pública
- [ ] Dentista: fila somente leitura
- [ ] Visualizador: `/fila` negado

**Pronto quando:** cancelamento vira consulta confirmada pelo link, sem ligação telefônica.

---

## Fase 5 · Insumos e estoque
