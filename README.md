# ClinRoma

Sistema clínico odontológico: agenda, prontuário, insumos com QR code, estoque, fila Kanban e lembretes internos.

**Piloto:** Clínica Neo Roma (Felipe Roma).

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4 + shadcn/ui
- Supabase (Auth, Postgres, RLS, Storage)

## Desenvolvimento

### 1. Clonar e instalar

```bash
git clone <repo-url> clinroma
cd clinroma

npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
```

| Variável                        | Obrigatória | Descrição                                                                    |
| ------------------------------- | ----------- | ---------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Sim (F1+)   | URL do projeto Supabase                                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim (F1+)   | Chave anônima do Supabase                                                    |
| `NEXT_PUBLIC_APP_URL`           | Não         | Default: `https://localhost:3000`                                            |
| `SUPABASE_DB_PASSWORD`          | Só db:push  | Senha Postgres (Settings → Database no dashboard)                            |
| `SUPABASE_SERVICE_ROLE_KEY`     | Opcional    | Server-only: seed/jobs, merge de áudio. **Nunca** no client                  |
| `OPENAI_API_KEY`                | Fase 3+     | Server-only: transcrição Whisper. Sem ela, áudio salva mas transcrição falha |

### 3. Banco de dados (Fase 1)

```bash
npm run db:push:dry   # revisar delta
npm run db:push       # aplicar migrations + seed de dev
npm run db:types      # regenerar src/lib/supabase/database.types.ts
```

Migrations em `supabase/migrations/` (001 a 013). Seeds idempotentes: `008_seed_dev.sql`, `011_seed_agenda_dev.sql`, `013_seed_records_dev.sql`.

#### Homologação da agenda (Fase 2)

Após `db:push`, o seed inclui **6 pacientes fictícios** e **consultas de exemplo** em dias adjacentes (hoje, amanhã, ontem). Use `reception@clinroma.dev` no desktop para marcar, remarcar arrastando e cancelar. Use `dentist@clinroma.dev` no celular (viewport estreito) para validar a lista do dia filtrada no Dr. Felipe Roma.

#### Homologação do prontuário (Fase 3)

Obrigatório em **iPhone e Android reais** antes de fechar a fase operacionalmente:

1. `npm run dev` (HTTPS) no IP da máquina ou localhost no celular
2. Login como `dentist@clinroma.dev`
3. Agenda ou Hoje → consulta de **Maria Silva** → **Abrir prontuário**
4. Evolução com foto + gravação de áudio; validar transcrição com `OPENAI_API_KEY` configurada

Paciente seed **Maria Silva** já possui consentimento LGPD, anamnese e achado odontológico demo (migration 013).

#### Contas de teste (desenvolvimento)

Senha comum: `ClinRomaDev2026!`

| Papel            | E-mail                   |
| ---------------- | ------------------------ |
| Admin            | `admin@clinroma.dev`     |
| Dentista         | `dentist@clinroma.dev`   |
| Recepção         | `reception@clinroma.dev` |
| Auxiliar de sala | `assistant@clinroma.dev` |
| Visualizador     | `viewer@clinroma.dev`    |

O dentista de teste está vinculado ao registro clínico **Dr. Felipe Roma** (primeiro dos 5 dentistas seed).

### 4. Subir o servidor (HTTPS)

```bash
npm run dev
```

- **Desktop:** [https://localhost:3000](https://localhost:3000)
- Login em `/login`. Após autenticar, redireciona para `/hoje`.
- Rotas autenticadas exigem sessão; guarda por papel no layout `(app)`.

### 5. Acesso no celular (mesma rede Wi‑Fi)

1. Descubra o IP local da máquina (ex.: `ipconfig` no Windows).
2. No iPhone/Android, abra `https://<IP-local>:3000`.
3. Confie no certificado de desenvolvimento se solicitado.

### Qualidade de código

```bash
npm run lint
npm run format:check
npm run build
npm run test
```

Testes RLS contra o banco remoto (opcional):

```bash
RUN_RLS_TESTS=true npm run test
```

## Papéis e módulos

| Papel          | Hoje | Agenda | Pacientes | Fila | Estoque | Scan QR |
| -------------- | ---- | ------ | --------- | ---- | ------- | ------- |
| admin          | RW   | RW     | RW        | RW   | RW      | RW      |
| dentist        | R    | R      | RW        | R    | R       | -       |
| reception      | R    | RW     | RW        | RW   | R       | -       |
| room_assistant | -    | -      | -         | -    | R       | RW      |
| viewer         | R    | R      | R         | -    | -       | -       |

Rota pública `/fila/resposta/[token]` permanece sem login.

## Estrutura

```
src/
  app/(app)/        rotas autenticadas
  app/(auth)/login/ autenticação
  app/fila/resposta link público do paciente
  features/auth/    login, logout, schemas
  lib/auth/         sessão, papéis, guarda
  lib/audit/        registro de auditoria
  lib/supabase/     client, server, admin, types
supabase/migrations/
docs/SECURITY.md
```

## Documentação

PRD e decisões de produto ficam no vault `segundo-cerebro` em
`10 Dev/Clientes/clinica-neo-roma-dev/Projetos/operacional/`.

## Projeto relacionado

**DeskcommCRM** (WhatsApp + leads para paciente) é um repositório separado.
