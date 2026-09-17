# Roteiro · Definir e redefinir senha

Cobre o **TC-57** (convite da Equipe) e o fluxo **Esqueci minha senha** no login.

---

## Ajuste · 16/09/2026

Sintoma no reteste: o convite abria `/definir-senha` com *Link inválido ou expirado.* As Redirect URLs de produção já estavam no painel. Não faltava outra URL na allowlist.

Causa: o e-mail ia com o `action_link` do GoTrue (`*.supabase.co/auth/v1/verify`). O app usa `@supabase/ssr` (PKCE). Depois do verify os tokens não viravam sessão de recovery, e a tela marcava o link como inválido.

Correção no código (não no painel):

| Antes | Depois |
| ----- | ------ |
| E-mail com `action_link` do Supabase | E-mail com `/auth/confirm?token_hash=...&type=recovery&next=/definir-senha` (ou `/redefinir-senha`) |
| Cliente tentava ler hash/`code` na tela | `src/app/auth/confirm/route.ts` chama `verifyOtp` e grava a sessão |
| Sem sessão em 2,5s → *Link inválido* | Formulário só abre com sessão pronta |

Arquivos: `src/features/auth/domain/recovery-link.ts`, `src/app/auth/confirm/route.ts`, `src/features/team/lib/provision-collaborator.ts`, `src/features/auth/components/set-password-form.tsx`.

O que **não** muda no painel: Redirect URLs de `/definir-senha` e `/redefinir-senha` podem ficar. `/auth/confirm` é rota pública do Next; não entra na allowlist.

O que **precisa** no ambiente:

- Site URL: `https://neo-roma.vercel.app`
- `NEXT_PUBLIC_APP_URL`: `https://neo-roma.vercel.app`
- Código publicado (o e-mail antigo continua com o `action_link` quebrado)

Para o reteste: **Reenviar convite**. Não reutilizar o e-mail anterior a este ajuste.

---

## Redirect URLs (Supabase)

Painel: **Authentication → URL Configuration**.

**Site URL** (produção): `https://neo-roma.vercel.app`

| Ambiente | URL |
| -------- | --- |
| Produção | `https://neo-roma.vercel.app/definir-senha` |
| Produção | `https://neo-roma.vercel.app/redefinir-senha` |
| Local (dev HTTPS) | `https://localhost:3000/definir-senha` |
| Local (dev HTTPS) | `https://localhost:3000/redefinir-senha` |

---

## Pré-condição

1. Login admin: `admin@clinroma.dev` / `ClinRomaDev2026!`
2. Código do ajuste já no ambiente que você está testando
3. Site URL e Redirect URLs acima
4. Resend configurado (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`)

---

## TC-57 · convite

1. **Equipe** → **Novo colaborador** (ou **Reenviar convite** se o usuário já existe)
2. Entrega: **Convite por e-mail**
3. Abrir o e-mail **Definir minha senha**
4. A URL deve cair em `/definir-senha` (não em `/login`) e mostrar o formulário, não *Link inválido ou expirado*
5. Informar a senha duas vezes (ex.: `ClinRomaDev2026!`) e salvar
6. Login com o **e-mail cadastrado** (não o placeholder `voce@clinroma.dev`)
7. Entrar no papel escolhido na Equipe

---

## Esqueci minha senha

1. Em `/login`, **Esqueci minha senha**
2. Informar o e-mail do acesso
3. A tela sempre diz: *Se o e-mail existir, enviamos um link.*
4. Abrir **Redefinir minha senha** e cair em `/redefinir-senha` com o formulário
5. Salvar a senha nova e entrar pelo login

---

## O que fotografar / mandar no chat

1. E-mail com o link (URL em `/auth/confirm` ou já em `/definir-senha`)
2. Tela `/definir-senha` com o formulário visível
3. Login com *Senha definida. Entre com o e-mail e a senha nova.*
4. Sessão no papel escolhido na Equipe

Status: **TC-57 aprovado** em 16/09/2026 (login Tc-57 Administração após definir senha). Evidência: `docs/evidencias/tc57-convite-login-admin.png`.
