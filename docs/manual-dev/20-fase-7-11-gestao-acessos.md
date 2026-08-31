# Fase 7 · Fatia F7-11 · Gestão de acessos pelo admin (Equipe)

| Status                  | Registro                                          |
| ----------------------- | ------------------------------------------------- |
| código entregue (F7-11) | `docs/implementation/F7-11-gestao-acessos.md`     |

A Fase 7 inteira **ainda está aberta**. Este capítulo cobre a tela `/equipe`, onde o admin cria acessos, troca papéis e desativa colaboradores.

## Por que esta fatia existiu

O papel `admin` sempre foi o gestor de acessos no modelo de dados, mas o poder era teórico:

- a política de `profiles` era `FOR ALL` para admin, porém a tabela só tinha `GRANT SELECT`, então nenhuma escrita passava pelo cliente autenticado;
- não havia módulo de UI, e colaboradores só nasciam pelo seed SQL ou pelo painel do Supabase;
- o trigger `handle_new_user` aceitava `role` do metadata do signup, o que permitiria alguém se cadastrar já como `admin` se o signup público estivesse aberto.

## O que esta fatia entrega

- Tela `/equipe`, **exclusiva do admin**: os outros quatro papéis caem em `/acesso-negado`
- No celular, o acesso vem pelo **botão de conta** ao lado da barra inferior (ver "Acesso no celular")
- Criar colaborador em dois modos: **convite por e-mail** (link de definir senha, enviado pelo Resend) ou **senha temporária** exibida uma única vez na tela
- Trocar o papel de qualquer colaborador, exceto o próprio
- Desativar e reativar acesso. O login já recusa conta inativa, e a sessão em curso cai no próximo carregamento
- Reenviar convite para quem perdeu ou deixou o link expirar
- Travas no banco contra autorrebaixamento e contra deixar a clínica sem admin ativo

**Não entrega:** exclusão definitiva de colaborador, troca de senha pelo próprio usuário, vínculo automático entre perfil e registro em `dentists`, fechamento da Fase 7

---

## Papéis do sistema (referência)

| Papel            | Hoje     | Agenda   | Pacientes | Fila     | Estoque  | Scan QR  | WhatsApp | Equipe   |
| ---------------- | -------- | -------- | --------- | -------- | -------- | -------- | -------- | -------- |
| `admin`          | escrita  | escrita  | escrita   | escrita  | escrita  | escrita  | escrita  | escrita  |
| `dentist`        | leitura  | leitura  | escrita   | leitura  | leitura  | nenhum   | nenhum   | nenhum   |
| `reception`      | leitura  | escrita  | escrita   | escrita  | leitura  | nenhum   | escrita  | nenhum   |
| `room_assistant` | nenhum   | nenhum   | nenhum    | nenhum   | leitura  | escrita  | nenhum   | nenhum   |
| `viewer`         | leitura  | leitura  | leitura   | nenhum   | nenhum   | nenhum   | nenhum   | nenhum   |

Fonte da verdade: `ROLE_MODULE_MATRIX` em `src/lib/auth/roles.ts`. Permissões mais finas de prontuário (registrar evolução, refazer e corrigir transcrição) ficam em `src/features/records/permissions.ts` e valem só para `admin` e `dentist`.

Cadastrar dentista **não** é criar login: a tabela `dentists` é registro clínico (nome, CRO, cor na agenda) e o vínculo com o acesso é o campo opcional `profile_id`.

---

## Árvore tocada

```text
src/features/team/
├── domain/team-guards.ts (+ .test.ts)
├── domain/temp-password.ts (+ .test.ts)
├── domain/invite-email-content.ts (+ .test.ts)
├── lib/provision-collaborator.ts
├── lib/deliver-invite.ts
├── lib/send-collaborator-invite.ts
├── lib/team-action-context.ts
├── schemas.ts
├── queries.ts
├── actions.ts
└── components/
    ├── collaborator-list.tsx
    ├── collaborator-row.tsx
    ├── collaborator-dialog.tsx
    └── temp-password-panel.tsx

src/app/(app)/equipe/page.tsx
src/components/mobile-account-menu.tsx
supabase/migrations/028_team_access_f7.sql
```

---

## Acesso no celular

A barra inferior é fixa em **5 ícones**, e Scan QR, WhatsApp e Equipe ficam fora dela. Antes desta fatia, quem estava fora da barra dependia de entrada contextual (Scan QR dentro de `/estoque`, WhatsApp pelo card na Hoje) e o logout no celular simplesmente não existia.

Agora existe o **botão de conta** (`src/components/mobile-account-menu.tsx`), um círculo com as iniciais do usuário à esquerda da barra. Ele abre um menu com:

- os módulos que o papel tem e que **não** couberam na barra, calculados por `getMobileSecondaryModules`;
- nome e papel do usuário;
- **Sair da conta**.

Assim nenhum módulo permitido fica sem caminho no celular: o admin chega em Equipe, WhatsApp e Scan QR; a recepção chega em WhatsApp; a auxiliar chega em Scan QR. Quem não tem módulo extra (dentista e visualizador) vê só o cabeçalho e o Sair.

O botão fica à **direita** da barra: em desenvolvimento, o badge do Next.js Dev Tools ocupa o canto inferior esquerdo e intercepta o toque.

Os links usam `onNavigate` (não `onClick`) para fechar o menu. Fechar no `onClick` desmonta o portal do Popover antes de a navegação começar, e o clique não leva a lugar nenhum.

---

## Fluxos principais

### Admin cria colaborador com convite por e-mail

1. Login `admin@clinroma.dev`, menu **Equipe**, botão **Novo colaborador**
2. Preencher nome, e-mail e papel; deixar a entrega em **Convite por e-mail**
3. A action cria o usuário no Auth com `service_role`. O trigger insere o perfil como `viewer`
4. Ainda com `service_role`, a action aplica o papel escolhido
5. A action gera um link de recovery e envia pelo Resend
6. O colaborador abre o link, define a senha e entra normalmente

Se o Resend não estiver configurado ou o envio falhar, a tela **não** perde o acesso criado: ela mostra a senha temporária como saída, com o motivo da falha.

### Admin cria colaborador com senha temporária

Mesmos passos, escolhendo **Senha temporária**. A senha aparece uma única vez, com botão copiar. Ela nunca é gravada no banco nem no `audit_log`. O admin entrega ao colaborador e pede a troca no primeiro acesso.

### Admin troca papel

Selecionar o novo papel na linha do colaborador. A action valida no servidor e escreve com o cliente autenticado, de modo que RLS e trigger funcionem como segunda barreira. O `audit_log` guarda papel anterior e novo.

Um detalhe do Supabase que vale lembrar em qualquer escrita sob RLS: `update()` barrado pela política afeta **zero linhas e não devolve erro**. Por isso as duas actions terminam em `.select("id").maybeSingle()` e tratam "nenhuma linha" como recusa; sem isso a tela mostraria sucesso para uma alteração que não aconteceu.

### Admin desativa acesso

Botão **Desativar**. O perfil fica `active = false`. Nada é apagado, então a autoria de prontuário, estoque, fila e auditoria continua rastreável. Reativar é o mesmo botão.

---

## Travas que valem mesmo fora da UI

`supabase/migrations/028_team_access_f7.sql` instala o trigger `on_profile_update_guard`, que levanta exceção em dois casos:

- o usuário tenta alterar o próprio `role` ou `active`;
- a alteração deixaria a clínica sem nenhum admin ativo.

Como as actions escrevem com o cliente autenticado, as travas valem para qualquer caminho que passe pela sessão, não só pela tela. O `GRANT UPDATE` é por coluna (`display_name`, `role`, `active`), então `id` e timestamps ficam fora de alcance.

---

## Contas de teste da fatia

As contas do seed (`docs/manual-dev/03-fase-1-dados-auth-papeis.md`) continuam valendo. Para esta fatia:

| Conta                    | O que deve acontecer em `/equipe`                                  |
| ------------------------ | ------------------------------------------------------------------ |
| `admin@clinroma.dev`     | Vê a tela e todos os controles; no celular, item no menu de conta   |
| `dentist@clinroma.dev`   | Sem item no menu lateral nem no menu de conta; rota nega            |
| `reception@clinroma.dev` | Sem item no menu lateral nem no menu de conta; rota nega            |
| `assistant@clinroma.dev` | Sem item no menu lateral nem no menu de conta; rota nega            |
| `viewer@clinroma.dev`    | Sem item no menu lateral nem no menu de conta; rota nega            |

Na linha do próprio admin logado, os controles são substituídos por um aviso: o próprio acesso não é editável.

---

## Operação e ambiente

```bash
npm run db:push    # aplicar a migration 028 no Supabase
npm test           # domínio de guardas, senha temporária e convite
```

Variáveis usadas: `SUPABASE_SERVICE_ROLE_KEY` (criação do usuário e leitura de e-mails), `RESEND_API_KEY` e `RESEND_FROM_EMAIL` (modo convite), `NEXT_PUBLIC_APP_URL` (destino do link de senha).

Recomendação de ops: manter o signup público desabilitado no projeto Supabase. A migration já impede autopromoção a admin, mas cadastro aberto continua indesejado num sistema clínico de um único inquilino.
