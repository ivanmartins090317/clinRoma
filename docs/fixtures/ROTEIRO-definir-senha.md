# Roteiro · Definir e redefinir senha

Cobre o **TC-57** (convite da Equipe) e o fluxo **Esqueci minha senha** no login.

O e-mail do convite usa recovery do Supabase. Os tokens vão no hash da URL; o app precisa das rotas `/definir-senha` e `/redefinir-senha` **liberadas** nas Redirect URLs.

---

## Redirect URLs (Supabase)

Painel: **Authentication → URL Configuration → Redirect URLs**.

Inserido em 2026-09-16:

| Ambiente | URL |
| -------- | --- |
| Produção | `https://neo-roma.vercel.app/definir-senha` |
| Produção | `https://neo-roma.vercel.app/redefinir-senha` |
| Local (se testar no dev) | `https://localhost:3000/definir-senha` |
| Local (se testar no dev) | `https://localhost:3000/redefinir-senha` |

Sem essas entradas o link do e-mail não completa o redirect e a senha não grava.

`NEXT_PUBLIC_APP_URL` do app publicado deve ser `https://neo-roma.vercel.app`.

---

## Pré-condição

1. Login admin: `admin@clinroma.dev` / `ClinRomaDev2026!`
2. Redirect URLs acima já no projeto
3. Resend configurado (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`)

---

## TC-57 · convite

1. **Equipe** → **Novo colaborador** (ou **Reenviar convite** se o usuário já existe)
2. Entrega: **Convite por e-mail**
3. Abrir o e-mail **Definir minha senha**
4. A URL deve cair em `/definir-senha` (não em `/login`)
5. Informar a senha duas vezes (ex.: `ClinRomaDev2026!`) e salvar
6. Login com o **e-mail cadastrado** (não o placeholder `voce@clinroma.dev`)
7. Entrar no papel escolhido na Equipe

O link antigo, gerado antes deste ajuste, ainda aponta para `/login`. Reenviar o convite.

---

## Esqueci minha senha

1. Em `/login`, **Esqueci minha senha**
2. Informar o e-mail do acesso
3. A tela sempre diz: *Se o e-mail existir, enviamos um link.*
4. Abrir **Redefinir minha senha** e cair em `/redefinir-senha`
5. Salvar a senha nova e entrar pelo login
