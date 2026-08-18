# Pendências · ClinRoma

Fonte viva do que **ainda falta implementar ou validar**. Atualizar ao concluir cada fase.

Última revisão: **2026-08-18** (após Fase 1).

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

## Fase 2 · Agenda

Referência: `docs/PLANO.md` §6 · Fase 2

- [ ] `src/features/agenda/` (queries, actions, schemas)
- [ ] Calendário com coluna por dentista (react-big-calendar atrás de `agenda-calendar.tsx`)
- [ ] Visões dia e semana (desktop); lista do dia agrupada por dentista (mobile)
- [ ] CRUD consulta: criar, editar, remarcar, cancelar
- [ ] Drag-and-drop para remarcar com confirmação
- [ ] Bloqueio de conflito de horário por dentista (domínio + banco)
- [ ] Substituir `/hoje` estática por consultas reais do dia
- [ ] Import dinâmico do calendário só a partir de `md`

**Pronto quando:** recepção marca/remarca/cancela consulta; dentista vê agenda do dia no celular.

---

## Fase 3 · Pacientes e prontuário

- [ ] Busca e cadastro de paciente + consentimento LGPD
- [ ] Anamnese versionada
- [ ] Odontograma interativo → `tooth_findings`
- [ ] Evolução: foto (câmera traseira) + áudio (`MediaRecorder`, formato runtime)
- [ ] Upload em buckets privados (`record-photos`, `record-audio`)
- [ ] Transcrição Whisper assíncrona + status na UI
- [ ] Audit log em leitura/escrita de prontuário (consumir helper da F1)
- [ ] Gravador mobile-first (blocos, retomada de rede, aviso iOS segundo plano)
- [ ] Odontograma mobile com zoom e toque
- [ ] Teste manual em iPhone e Android real

**Pronto quando:** dentista grava áudio no celular e transcrição aparece sem reload.

---

## Fase 4 · Fila Kanban

- [ ] Kanban real (vermelho/amarelo/verde) substituindo demo estático
- [ ] Drag entre colunas + alternativa mobile (abas/menu)
- [ ] Oferta de horário com token opaco (hash) e expiração 40 min
- [ ] Página pública `/fila/resposta/[token]` funcional (consentimento, aceitar/recusar)
- [ ] Aceite cria consulta na agenda (transação)
- [ ] Expiração automática da oferta

**Pronto quando:** vaga por cancelamento vira consulta confirmada pelo link, sem ligação da recepção.

---

## Fase 5 · Insumos e estoque

- [ ] CRUD insumo + estoque mínimo
- [ ] Upload planilha + digitação manual (`supply_sheets`)
- [ ] QR por pacote + folha de etiquetas (`supply-labels`)
- [ ] `/estoque/scan`: câmera, `BarcodeDetector` + fallback `zxing-wasm`
- [ ] Baixa de retirada (`supply_movements`) com responsável
- [ ] Modo leitura contínua (som/tátil entre scans)
- [ ] Alerta estoque mínimo na `/hoje`
- [ ] PWA/manifest para scan na tela inicial
- [ ] Teste manual iPhone + Android real

**Pronto quando:** auxiliar retira pacote pelo celular e saldo atualiza sozinho.

---

## Fase 6 · Lembrete e piloto

- [ ] Lembrete pós-consulta por e-mail (Resend) + retry + `reminders`
- [ ] Deploy Vercel + Supabase produção separado de dev
- [ ] Revisão checklist `docs/SECURITY.md` em todas as features
- [ ] Homologação manual completa (`.cursor/skills/manual-report`)
- [ ] Acompanhamento clínica piloto Neo Roma

**Pronto quando:** relatório HTML de homologação aprovado antes da entrega ao cliente.

---

## Dívida técnica transversal

- [ ] Corrigir `docs/SECURITY.md` (menção a `clinic_id` vs single-tenant)
- [ ] Meta ~80% cobertura em domínio e actions (a partir das features F2+)
- [ ] Consolidar migration `009` no `008` se houver reset limpo do banco de dev (opcional)
- [ ] WhatsApp paciente permanece fora deste repo (DeskcommCRM)

---

## Fora do escopo v1 (referência)

- OAuth / MFA / convite self-service
- OCR de planilha
- Playwright / E2E automatizado
- Export LGPD automatizado
- Integração WhatsApp Business completa
