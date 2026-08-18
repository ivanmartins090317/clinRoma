# Fase 1 · Dados, autenticação e papéis

| Status | Spec |
| ------ | ---- |
| concluída | `specs/2026-08-18-fase-1-dados-auth-papeis.md` |

## O que esta fase entrega

Infraestrutura que **destrava todos os módulos seguintes**:

- Schema completo do MVP no Postgres, com **RLS por papel**.
- **Login** de colaboradores (e-mail + senha).
- **Guarda** na navegação e no layout autenticado.
- **Seed** de desenvolvimento (5 dentistas + 5 contas de teste).
- Helper de **auditoria** (`writeAuditLog`) para uso nas Fases 3+.

Não entrega CRUD visível de pacientes, agenda, fila ou estoque (placeholders continuam).

---

## Arquitetura da feature Auth

```text
src/features/auth/
├── schemas.ts              # Zod: email + senha
├── actions.ts              # loginAction, logoutAction (server)
└── components/
    ├── login-form.tsx      # client: formulário /login
    └── logout-form.tsx     # server: form action Sair

src/lib/auth/
├── session.ts              # getAuthSession, requireAuthSession
├── roles.ts                # matriz papel → módulo (UI + guarda)
└── guard.ts                # assertRouteAccess, sanitizeReturnTo

src/lib/audit/
└── write-audit-log.ts      # insert em audit_log

src/app/(auth)/login/       # rota pública de login
src/app/(app)/acesso-negado/  # 403 amigável
```

### Fluxo de login

1. Usuário envia e-mail e senha (`LoginForm` → `loginAction`).
2. **Rate limit:** máximo 5 tentativas por 15 min (chave e-mail + IP).
3. **Zod** valida campos.
4. `supabase.auth.signInWithPassword`.
5. Consulta `profiles`: existe? `active === true`?
6. Redirect para `/hoje` ou `returnTo` (somente paths internos permitidos).

### Fluxo de guarda (rotas autenticadas)

1. **Middleware** redireciona visitante de `(app)/*` para `/login`.
2. **Layout `(app)`** chama `requireAuthSession()` e `assertRouteAccess()`.
3. **AppShell** recebe `allowedModuleIds` e esconde links proibidos.
4. **RLS** no banco impede leitura/escrita fora do papel mesmo com API direta.

---

## Contas de teste (desenvolvimento)

> **Somente ambiente de dev.** Nunca usar estas senhas em produção.

### Senha padrão

```text
ClinRomaDev2026!
```

### Usuários seed

| Papel | E-mail | O que testar |
| ----- | ------ | ------------ |
| Admin | `admin@clinroma.dev` | Acesso a todos os módulos + auditoria |
| Dentista | `dentist@clinroma.dev` | Agenda, pacientes; **sem** Scan QR |
| Recepção | `reception@clinroma.dev` | Agenda, fila, pacientes; **sem** Scan QR |
| Auxiliar | `assistant@clinroma.dev` | Estoque + Scan QR; **sem** agenda/pacientes/fila |
| Visualizador | `viewer@clinroma.dev` | Leitura limitada; sem fila/estoque |

O dentista de teste está vinculado ao registro clínico **Dr. Felipe Roma** (`dentists.profile_id`).

### Como fazer login

1. Subir o app: `npm run dev`
2. Abrir [https://localhost:3000/login](https://localhost:3000/login)
3. Informar e-mail da tabela acima e senha `ClinRomaDev2026!`
4. Após entrar, redirect para `/hoje`

---

## Como alterar senhas e contas de teste

### Opção A · Dashboard Supabase (mais simples)

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard/project/skdtkmruianufgenrlqv) → **Authentication** → **Users**.
2. Localize o usuário (ex.: `reception@clinroma.dev`).
3. Use **Send password recovery** ou **Reset password** / edição manual conforme a UI do dashboard.
4. **Não** commitar a nova senha no repositório.

Ideal para alteração pontual no dia a dia.

### Opção B · Nova migration SQL (reprodutível no time)

Para trocar a senha **de todas** as contas seed de uma vez:

1. Crie `supabase/migrations/010_alter_dev_password.sql` (exemplo):

```sql
-- Troque NOVA_SENHA_AQUI antes de aplicar
DO $$
DECLARE
  new_password text := crypt('NOVA_SENHA_AQUI', gen_salt('bf'));
BEGIN
  UPDATE auth.users
  SET encrypted_password = new_password, updated_at = now()
  WHERE email IN (
    'admin@clinroma.dev',
    'dentist@clinroma.dev',
    'reception@clinroma.dev',
    'assistant@clinroma.dev',
    'viewer@clinroma.dev'
  );
END $$;
```

2. Atualize este manual e o `README.md` com a nova senha de dev.
3. Rode `npm run db:push`.

> Use senhas fictícias longas. Nunca senhas reais de produção.

### Opção C · Editar seed original (banco novo ou reset)

Arquivo fonte: `supabase/migrations/008_seed_dev.sql`

- Linha da senha: `dev_password text := crypt('ClinRomaDev2026!', gen_salt('bf'));`
- Altere o literal `'ClinRomaDev2026!'` para a nova senha.
- **Só reaplica** em banco limpo ou se você rodar o bloco manualmente no SQL Editor (o `ON CONFLICT DO NOTHING` não atualiza senha de usuários já existentes).

Para forçar atualização no seed existente, prefira a **Opção B**.

### Opção D · Criar colaborador novo (sem migration)

1. Dashboard → **Authentication** → **Add user** (e-mail + senha).
2. O trigger `handle_new_user` cria `profiles` com papel padrão `viewer`.
3. Ajuste papel no SQL Editor:

```sql
UPDATE public.profiles
SET role = 'reception', display_name = 'Nome Exibido', active = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'novo@clinroma.dev');
```

4. Opcional: vincular dentista clínico:

```sql
UPDATE public.dentists
SET profile_id = (SELECT id FROM auth.users WHERE email = 'novo@clinroma.dev')
WHERE full_name = 'Dr. Felipe Roma';
```

---

## Como alterar papéis e permissões

### Na aplicação (navegação)

Editar matriz em `src/lib/auth/roles.ts` (`ROLE_MODULE_MATRIX`).

### No banco (RLS)

Editar policies nas migrations do domínio ou nova migration que faça `DROP POLICY` + `CREATE POLICY`.

**Importante:** UI e RLS devem permanecer **coerentes**. Ao mudar um lado, atualize o outro e rode testes:

```bash
npm run test
RUN_RLS_TESTS=true npm run test   # valida policies no Supabase remoto
```

---

## Banco de dados

### Aplicar / atualizar schema

```bash
# revisar delta
npm run db:push:dry

# aplicar
npm run db:push
```

Migrations em ordem lexicográfica `001` … `009`.

| # | Arquivo | Domínio |
| - | ------- | ------- |
| 001 | `profiles_dentists.sql` | Perfis, dentistas, trigger signup |
| 002 | `patients_records.sql` | Pacientes, prontuário, odontograma, anexos |
| 003 | `appointments.sql` | Consultas |
| 004 | `stock.sql` | Insumos, pacotes QR, movimentações |
| 005 | `waitlist.sql` | Fila, ofertas, respostas (hash only) |
| 006 | `reminders_audit.sql` | Lembretes, audit_log |
| 007 | `storage.sql` | Buckets privados |
| 008 | `seed_dev.sql` | Dentistas + contas teste |
| 009 | `fix_seed_auth.sql` | Correção identities para login |

### Regenerar tipos TypeScript

```bash
npm run db:types
```

Requer Docker (Supabase CLI). Se falhar, types manuais em `src/lib/supabase/database.types.ts` permanecem válidos até regerar.

---

## Matriz de acesso (referência rápida)

| Módulo | admin | dentist | reception | room_assistant | viewer |
| ------ | :---: | :-----: | :-------: | :------------: | :----: |
| Hoje | RW | R | R | - | R |
| Agenda | RW | R | RW | - | R |
| Pacientes | RW | RW | RW | - | R* |
| Fila | RW | R | RW | - | - |
| Estoque | RW | R | R | R | - |
| Scan QR | RW | - | - | RW | - |
| Auditoria (DB) | R | - | - | - | - |

\* Viewer: dados demográficos em `patients`; sem prontuário clínico na RLS.

---

## Auditoria

Helper para features futuras (prontuário na F3):

```typescript
import { writeAuditLog } from "@/lib/audit/write-audit-log";

await writeAuditLog({
  action: "read",
  entityType: "medical_records",
  entityId: recordId,
  metadata: { source: "patient-chart" },
});
```

Somente **admin** lê `audit_log` via RLS. Insert permitido a usuários ativos (ator = sessão atual).

---

## Testes desta fase

```bash
npm run test                                    # unitários (56 testes)
RUN_RLS_TESTS=true npm run test                 # inclui RLS remoto
npm run test -- src/lib/auth/roles.test.ts      # só matriz de papéis
```

Arquivos: `src/lib/auth/*.test.ts`, `src/features/auth/schemas.test.ts`, `src/lib/audit/*.test.ts`.

---

## Troubleshooting

| Problema | Causa provável | Ação |
| -------- | -------------- | ---- |
| Login indisponível | `.env.local` sem URL/anon key | Preencher `NEXT_PUBLIC_SUPABASE_*` |
| Credenciais inválidas | Senha alterada ou seed não aplicado | Verificar dashboard ou rodar `db:push` |
| Conta desativada | `profiles.active = false` | `UPDATE profiles SET active = true WHERE …` |
| Conta sem perfil | Trigger falhou | Inserir em `profiles` manualmente ou recriar user |
| Database error querying schema | `auth.identities` incompleto | Migration `009` deve estar aplicada |
| Acesso negado inesperado | Papel vs rota | Conferir `roles.ts` e matriz acima |
| RLS test skip | Falta `RUN_RLS_TESTS=true` | Exportar flag + `.env.local` com credenciais |

---

## Próxima fase

[Fase 2 · Agenda](../state/PENDENCIAS.md#fase-2--agenda): calendário, CRUD de consultas, `/hoje` com dados reais.

Registro de entregáveis: [`docs/implementation/F1-dados-auth-papeis.md`](../implementation/F1-dados-auth-papeis.md).
