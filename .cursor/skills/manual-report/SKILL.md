---
name: manual-report
description: Skill para criar, executar e documentar testes manuais no padrão Zelita (POP-QA-ZELITA-001). Gera relatório HTML light-first com scoreboard, galeria de evidências e log de bugs. Use em testes manuais, homologação MVP e validação de fluxos UI/PWA. Triggers on "criar relatório de testes", "testes manuais", "manual report", "plano de testes manual", "relatório de homologação", "QA manual", "criar testes", "gerar relatório de testes", "homologação", "evidências de teste".
---

# Skill: Manual Report (POP-QA-ZELITA-001)

Skill para criação e atualização de relatórios de testes manuais da **Zelita** — SaaS de coordenação familiar para cuidado de idosos.

> **Automação:** Vitest cobre domínio e casos de uso. Esta skill cobre **homologação manual** de UI/PWA/fluxos — **sem Playwright** no MVP.

> **ClinRoma:** usar na **Fase 6** (`docs/PLANO.md`), após entregar todos os módulos e **antes da entrega ao cliente**. Escopo: login, agenda, prontuário (áudio/foto), fila Kanban, link público LGPD, scan QR e lembrete. Referências: `docs/PLANO.md`, `docs/SECURITY.md`, `AGENTS.md`. Relatório sugerido: `docs/relatorio-testes-manuais.html` · evidências em `docs/evidencias/`.

> **Recomendação de modelo:** Para melhor qualidade, use um LLM superior (Claude Opus/Sonnet ou Gemini Pro).

---

## Fluxo de Trabalho

### FASE 1 — Entender o Projeto

**1.1 Buscar documentação**

Nesta ordem:

1. `docs/prd-mvp.md` — escopo funcional do MVP
2. `docs/arquitetura-solucao.md` — stack e superfícies
3. `docs/architecture/` — mapa de módulos e ADRs (quando existir)
4. `docs/state/PENDENCIAS.md` — o que falta validar (fonte viva)
5. `marca-zelita.html` / `zelita-prototipo.html` — marca e UX de referência
6. `.cursor/rules/project-general.mdc` — regras do agente

Se a documentação estiver incompleta, avise e sugira consultar `docs/state/PENDENCIAS.md` antes de criar TCs.

**1.2 Tipo de projeto**

**Web — Next.js (App Router) + Supabase + Inngest + Vercel** (monorepo: `apps/web`).

Ambiente padrão de teste manual:

- **Local:** app em `apps/web` → `http://localhost:3000` (ajustar se o script do monorepo usar outra porta)
- **Pré-requisitos:** `.env.local` com Supabase (+ Inngest/Sentry quando aplicável); migrations aplicadas (`npm run db:push` ou equivalente)

**1.3 Mapear fluxos do MVP**

Códigos `FL-XX` alinhados ao PRD (fatias). Priorize pela fatia em curso:

| Código | Fluxo                              | Superfície / rotas (alvo)                    |
| ------ | ---------------------------------- | -------------------------------------------- |
| FL-01  | Auth OTP (e-mail + código)         | `(auth)/` — entrar / código                  |
| FL-02  | Onboarding + pessoa cuidada        | cadastro 8 passos · care recipient           |
| FL-03  | Remédios e cartela                 | `(family)/` remédios · cálculo de fim        |
| FL-04  | Lembretes (job + WhatsApp sandbox) | Inngest · canal WA · `reminder_sent`         |
| FL-05  | PWA idoso (vínculo device)         | `(elder)/` · sem login · QR/código           |
| FL-06  | SOS                                | PWA + painel · disclaimer SAMU/Bombeiros     |
| FL-07  | Segurança / RLS / papéis           | multi-membro · service role só server        |
| FL-08  | Exames / convites / geo / billing  | conforme fatia 3–4 (quando entrar no escopo) |

Consulte `docs/state/PENDENCIAS.md` para priorizar TCs ainda não validados. Na **fatia 1**, foque FL-01…FL-04 (+ smoke FL-07).

---

### FASE 2 — Estrutura de Pastas

```
docs/
├── relatorio-testes-manuais.html   ← relatório principal
├── evidencias/                      ← screenshots dos TCs
│   └── README.md
└── state/
    └── PENDENCIAS.md                ← sincronizar após homologação
```

**Se `docs/evidencias/` não existir**, crie com `README.md` (nomenclatura, formatos).

---

### FASE 3 — Criar os Casos de Teste

| Campo                | Regra                                                     |
| -------------------- | --------------------------------------------------------- |
| `Código`             | Sequencial global: `TC-01`, `TC-02`, …                    |
| `Descrição`          | Ação + resultado observável                               |
| `Pré-condição`       | Auth, env, dados de teste, opt-in WA se necessário        |
| `Resultado Esperado` | Comportamento correto (ex.: lembrete ≠ tomada confirmada) |
| `Status`             | `Pendente`, `Aprovado`, `Reprovado`, `Bloqueado`          |

**Severidade de bugs (`BG-XX`):**

- 🔴 **CRÍTICO** — perda de dados, RLS quebrado, SOS/lembrete core inutilizável, vazamento entre famílias
- 🟠 **ALTO** — fluxo P0 com defeito, workaround difícil
- 🟡 **MÉDIO** — funcionalidade secundária ou visual relevante
- ⚪ **BAIXO** — cosmético, copy, melhoria de UX

**Casos obrigatórios (quando a fatia existir):**

- Login OTP + reenvio invalida código anterior
- Cadastro de care recipient **sem** criar `auth.users` para o idoso
- Cartela com data de fim calculada antes de salvar
- Job de lembrete grava `reminder_sent` (não `medication_taken`)
- PWA abre com vínculo de device, sem senha
- SOS com confirmação anti-toque + disclaimer
- RLS: membro da família A não vê dados da família B

---

### FASE 4 — Gerar / Atualizar o Relatório HTML

Arquivo: `docs/relatorio-testes-manuais.html`

Especificação: [`references/report-spec.md`](references/report-spec.md)

**Obrigatório:**

- Paleta **Zelita** (verde-petróleo + sand; coral só para SOS) — ver report-spec
- Tipografia: **Plus Jakarta Sans** (display) + **Inter** (corpo)
- Scoreboard + barra de progresso + acordeão por fluxo
- Galeria de evidências com lightbox
- Log de bugs + matriz de cobertura
- `testData` no JavaScript para counters automáticos
- Rodapé: **Zelita** · POP-QA-ZELITA-001

**Nomenclatura de screenshots:**

```
docs/evidencias/tc03-cartela-fim-calculado.jpeg
docs/evidencias/tc12-pwa-vinculo-sem-login.jpeg
```

---

### FASE 5 — Checklist Final

- [ ] `docs/evidencias/` existe
- [ ] `docs/relatorio-testes-manuais.html` abre no browser sem erros no console
- [ ] Fluxos da fatia em curso cobertos (ou justificativa de escopo reduzido)
- [ ] TCs numerados sequencialmente; status inicial `Pendente`
- [ ] `testData` coerente com totais por fluxo
- [ ] Galeria com placeholders ou evidências reais
- [ ] Seção de bugs preparada
- [ ] Matriz de cobertura calculada
- [ ] `docs/state/PENDENCIAS.md` atualizado quando TCs forem aprovados

---

## Instruções para Preenchimento (orientar o usuário)

### O usuário faz:

1. Executa cada TC no navegador (`localhost:3000` ou ambiente indicado)
2. Captura screenshot do resultado
3. Envia imagem + status (✅ / ❌ / ⚠️) + observação

### A AI faz:

- Nomeia evidência: `tc[número]-[descricao-curta].jpeg`
- Atualiza status no HTML e `testData`
- Adiciona imagem na galeria do fluxo
- Registra bug `BG-XX` se reprovado
- Recalcula scoreboard e matriz
- Marca item correspondente em `docs/state/PENDENCIAS.md` quando aplicável

---

## Referências

- Especificação HTML: [`references/report-spec.md`](references/report-spec.md)
- Pendências vivas: `docs/state/PENDENCIAS.md`
- PRD: `docs/prd-mvp.md`
- Marca: `marca-zelita.html`
