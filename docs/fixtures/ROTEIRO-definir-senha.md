# Roteiro · Definir e redefinir senha

Cobre o **TC-57** (convite da Equipe) e o fluxo **Esqueci minha senha** no login.

O e-mail do convite usa recovery do Supabase. O app troca o `token_hash` em `/auth/confirm` e só então abre `/definir-senha` ou `/redefinir-senha` com a sessão pronta.

---

## Redirect URLs (Supabase)

Painel: **Authentication → URL Configuration**.

**Site URL** (produção): `https://neo-roma.vercel.app`

**Redirect URLs** (o `generateLink` ainda envia `redirectTo` para estas rotas; as que você já inseriu em 2026-09-16 podem ficar):

| Ambiente | URL |
| -------- | --- |
| Produção | `https://neo-roma.vercel.app/definir-senha` |
| Produção | `https://neo-roma.vercel.app/redefinir-senha` |
| Local (se testar no dev) | `https://localhost:3000/definir-senha` |
| Local (se testar no dev) | `https://localhost:3000/redefinir-senha` |

Não falta outra Redirect URL para o convite funcionar. O link do e-mail agora cai no próprio app (`/auth/confirm`), sem passar pelo verify do GoTrue. `/auth/confirm` é rota pública do Next; não precisa estar na allowlist.

`NEXT_PUBLIC_APP_URL` do app publicado deve ser `https://neo-roma.vercel.app`.

O link antigo (antes desta correção) aponta para `*.supabase.co/auth/v1/verify` e chega em `/definir-senha` **sem sessão**. Reenviar o convite.

---

## Pré-condição

1. Login admin: `admin@clinroma.dev` / `ClinRomaDev2026!`
2. Site URL e Redirect URLs acima já no projeto
3. Resend configurado (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`)

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
