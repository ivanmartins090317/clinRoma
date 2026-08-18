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
git checkout chore/fase-0-fundacao   # branch da Fase 0, se aplicável

npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
```

| Variável                        | Obrigatória na F0 | Descrição                                                   |
| ------------------------------- | ----------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Não               | URL do projeto Supabase. Vazio: navegação estática funciona |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Não               | Chave anônima do Supabase                                   |
| `NEXT_PUBLIC_APP_URL`           | Não               | Default: `https://localhost:3000`                           |
| `SUPABASE_DB_PASSWORD`          | Só para `db:push` | Senha Postgres (Fase 1+)                                    |

### 3. Subir o servidor (HTTPS)

```bash
npm run dev
```

O script usa `next dev --experimental-https`. O Next gera certificado local automaticamente.

- **Desktop:** [https://localhost:3000](https://localhost:3000)
- O navegador pode pedir para confiar no certificado de desenvolvimento. Aceite para continuar.

### 4. Acesso no celular (mesma rede Wi‑Fi)

1. Descubra o IP local da máquina (ex.: `ipconfig` no Windows, `192.168.x.x`).
2. No iPhone/Android, abra `https://<IP-local>:3000` (porta padrão do Next).
3. **iPhone (Safari):** se aparecer aviso de certificado, toque em "Mostrar detalhes" e confie no certificado para este dispositivo/rede.
4. Confirme que firewall/antivírus não bloqueia a porta 3000 na rede local.

Barra inferior com 5 módulos (Hoje, Agenda, Pacientes, Fila, Estoque). Scan QR em `/estoque/scan` ou pelo botão na tela de Estoque.

### Qualidade de código

```bash
npm run lint          # ESLint (zero warnings)
npm run format        # corrige com Prettier
npm run format:check  # só verifica
npm run build         # build de produção
npm run test          # testes unitários (Vitest)
```

### Supabase CLI

Migrations ficam em `supabase/migrations/` (vazio na Fase 0).

```bash
npm run db:push:dry   # dry-run: lista o que seria aplicado
npm run db:push       # aplica migrations no Postgres remoto (requer SUPABASE_DB_PASSWORD)
```

## Estrutura

```
src/
  app/              # rotas (app autenticado + link público fila)
  components/ui/    # shadcn (Button, Input, ...)
  features/         # agenda, patients, records, stock, waitlist (Fase 1+)
  lib/              # supabase, env, utils
supabase/
  config.toml       # Supabase CLI
  migrations/       # SQL (Fase 1+)
docs/
  SECURITY.md
  plans/plano-F0.md
```

## Documentação

PRD e decisões de produto ficam no vault `segundo-cerebro` em
`10 Dev/Clientes/clinica-neo-roma-dev/Projetos/operacional/`.

## Projeto relacionado

**DeskcommCRM** (WhatsApp + leads para paciente) é um repositório separado, implementado depois.
