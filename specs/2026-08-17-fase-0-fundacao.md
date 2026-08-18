# Spec · Fase 0 · Fundação do repositório

| Campo            | Valor                    |
| ---------------- | ------------------------ |
| **Status**       | draft                    |
| **Data**         | 2026-08-17               |
| **Slug**         | fase-0-fundacao          |
| **Plano origem** | `docs/plans/plano-F0.md` |
| **Fase**         | 0 de `docs/PLANO.md`     |

---

## 1. Contexto

O ClinRoma já possui um scaffold Next.js com seis módulos navegáveis no desktop (sidebar), tokens visuais da marca Neo Roma, clientes Supabase escritos e rotas placeholder. Ainda não há login, guarda por papel, banco de dados, biblioteca de componentes padronizada, refresh automático de sessão, navegação mobile ou ambiente de desenvolvimento preparado para testes em celular real (HTTPS, microfone, câmera).

Esta feature prepara o repositório para a Fase 1 (dados, autenticação e papéis), sem entregar lógica de negócio.

---

## 2. Objetivo

Deixar o repositório **clonável e operável** por qualquer desenvolvedor, com qualidade mínima de código (lint e build limpos), shell de navegação **mobile-first**, desenvolvimento local em **HTTPS** para testes no iPhone/Android na rede local, e base Supabase/shadcn pronta para evoluir.

**Valor entregue:** um dev clona o repo, configura variáveis de ambiente a partir do exemplo versionado, sobe o app e consegue percorrer todos os módulos no celular real sem perder-se na interface.

---

## 3. Atores

| Ator                         | Interesse                                                         |
| ---------------------------- | ----------------------------------------------------------------- |
| Desenvolvedor                | Onboarding rápido, lint/format/build confiáveis, HTTPS no celular |
| Dentista / auxiliar (futuro) | Alvos de toque adequados e navegação inferior no celular          |
| Mantenedor do repo           | Estrutura Supabase CLI e shadcn alinhada ao restante do plano     |

---

## 4. Escopo funcional

### 4.1 Onboarding e versionamento

- O arquivo de exemplo de variáveis de ambiente passa a ser versionado no repositório (hoje bloqueado pelo ignore de `.env*`).
- O README descreve clone, instalação, variáveis obrigatórias, comandos de lint/format/build e acesso mobile via HTTPS.
- Trabalho local relevante (app, docs, marca, supabase, regras Cursor) entra em branch dedicada `chore/fase-0-fundacao`.

### 4.2 Qualidade de código

- Prettier já configurado; resta eliminar warnings de lint (imports não utilizados).
- `npm run lint`, `npm run format:check` e `npm run build` devem concluir sem erros.

### 4.3 Design system mínimo (shadcn + Neo Roma)

- Inicializar shadcn/ui com configuração do projeto.
- Mapear tokens Neo Roma existentes para o tema shadcn em estilos globais.
- Entregar componentes base mínimos (botão e campo de texto) para validar integração com Tailwind 4.
- Alinhar layout raiz ao tema da marca (hoje há divergência entre tokens Neo Roma e classes genéricas no corpo da página).

### 4.4 Infraestrutura Supabase (sem domínio)

- Inicializar pasta e configuração do Supabase CLI.
- Manter pasta de migrations vazia (placeholder), **sem** scripts SQL de negócio.
- Documentar scripts `db:push` e `db:push:dry` no README.

### 4.5 Sessão (refresh apenas)

- Camada na borda do app que renova cookies de sessão Supabase a cada navegação.
- **Sem** bloqueio de rotas, **sem** tela de login, **sem** checagem de papel (Fase 1).

### 4.6 Shell mobile

- Em telas menores que `md`: barra inferior fixa com os módulos principais.
- A partir de `md`: sidebar lateral mantida como hoje.
- Conteúdo principal respeita área segura do dispositivo (notch, home indicator).

**Decisão fechada nesta spec:** barra inferior com **5 itens**; "Scan QR" permanece acessível pela rota `/estoque/scan`, agrupado conceitualmente sob Estoque (ícone/entrada de Estoque leva à listagem; scan continua como sub-rota). Evita barra apertada com 6 ícones.

### 4.7 Padrões de toque e mobile dev

- Alvos interativos com área mínima de 44×44 px.
- Campos de formulário com tamanho de fonte mínimo 16 px (evita zoom involuntário no iOS).
- Padding com `env(safe-area-inset-*)` onde a barra inferior ou cabeçalho encostam nas bordas.
- Comando de desenvolvimento local serve o app em **HTTPS**; README explica acesso via IP da máquina na rede Wi‑Fi e confiança no certificado no iPhone.

---

## 5. Fora de escopo

- Migrations SQL, políticas de acesso ao banco, buckets de arquivos (Fase 1).
- Tela de login, guarda por papel, seed de dentistas (Fase 1).
- Pasta `src/features/*` e lógica de negócio dos módulos.
- Vitest, relatório manual de homologação (Fase 6).
- Calendário, gravador de áudio, leitor QR.
- Deploy Vercel / ambiente de produção.
- Correção de `docs/SECURITY.md` (single-tenant vs `clinic_id`).
- Componentes shadcn além do mínimo (botão + campo de texto), salvo necessidade técnica imediata.

---

## 6. Fluxos

### 6.1 Caminho feliz · Novo desenvolvedor

1. Desenvolvedor clona o repositório e faz checkout da branch de fundação.
2. Copia o arquivo de exemplo de ambiente para `.env.local` e preenche URL e chave anônima do Supabase (podem ficar vazias para navegação estática).
3. Executa instalação de dependências e sobe o servidor de desenvolvimento em HTTPS.
4. Abre o app no navegador desktop: sidebar visível, redirecionamento da raiz para "Hoje", navegação entre os seis módulos funciona.
5. Executa lint, verificação de formatação e build: todos passam.
6. No iPhone (mesma rede Wi‑Fi), acessa `https://<IP-local>:<porta>`, confia no certificado se solicitado.
7. Barra inferior aparece; toca cada item e chega à tela correspondente; conteúdo não fica oculto atrás da barra ou do notch.
8. Página pública da fila (`/fila/resposta/[token]`) continua acessível **fora** do shell autenticado, sem barra inferior de módulos.

### 6.2 Caminho feliz · Sessão Supabase configurada

1. Desenvolvedor preenche variáveis Supabase no ambiente local.
2. Navega entre rotas autenticadas; a camada de refresh mantém cookies válidos sem erro visível ao usuário.
3. Nenhuma rota exige login; o app permanece navegável.

### 6.3 Caminho feliz · Validar design system

1. Desenvolvedor importa botão e campo de texto shadcn em uma tela placeholder (ex.: "Hoje").
2. Componentes renderizam com cores Neo Roma (burgundy, gold, cream) coerentes com sidebar e logo.
3. Build de produção inclui os estilos sem warning de Tailwind.

### 6.4 Caminho feliz · Supabase CLI

1. Desenvolvedor executa dry-run de push de migrations: confirma que não há migrations pendentes (pasta vazia).
2. README indica como aplicar migrations quando existirem na Fase 1.

---

## 7. Erros, bordas e mitigações

| Situação                                             | Comportamento esperado                                                       | Mitigação                                                            |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Variáveis Supabase ausentes                          | App sobe; navegação estática funciona; refresh de sessão não quebra a página | Camada de refresh tolerante; mensagem clara no README                |
| Certificado HTTPS não confiável no iPhone            | Safari bloqueia ou avisa                                                     | README com passo a passo para confiar no certificado de dev          |
| IP local incorreto ou firewall                       | Celular não alcança o dev server                                             | README lista checagem de rede e porta                                |
| Lint com imports órfãos                              | CI/local falha no DoD                                                        | Corrigir antes de fechar a feature                                   |
| Barra inferior + teclado virtual                     | Conteúdo ou barra sobrepostos de forma ilegível                              | `safe-area-inset` e padding inferior no main                         |
| Rota pública da fila                                 | Não deve mostrar shell de módulos internos                                   | Layout `(app)` separado da rota pública                              |
| Duplicação de cores (CSS, TS, shadcn)                | Risco de drift visual                                                        | Fonte única em variáveis CSS; TS só referencia quando necessário     |
| Middleware com falha                                 | Navegação ou cookies quebrados                                               | Testar rotas `(app)` e rota pública após implementar                 |
| `NEXT_PUBLIC_APP_URL` em HTTP enquanto dev usa HTTPS | Links absolutos inconsistentes                                               | Default ou documentação alinhada ao fluxo HTTPS de dev               |
| Windows + certificado local                          | mkcert ou flag experimental do Next                                          | Documentar opção que funcionar no ambiente do time                   |
| Módulo "Scan QR" sem item na barra                   | Usuário mobile pode não achar scan                                           | Link visível na tela de Estoque (placeholder pode ser texto simples) |

---

## 8. Critérios de Done

### Obrigatórios (DoD)

- [ ] `npm run lint` termina sem warnings nem erros.
- [ ] `npm run format:check` passa.
- [ ] `npm run build` passa.
- [ ] `.env.example` versionado; clone + copy + install + dev documentados no README.
- [ ] shadcn inicializado; botão e campo de texto utilizáveis com tema Neo Roma.
- [ ] Supabase CLI init; `supabase/migrations/` presente (vazia); scripts `db:push` / `db:push:dry` documentados.
- [ ] Camada de refresh de sessão ativa; **nenhuma** guarda de rota ou login.
- [ ] Barra inferior mobile (5 itens) + sidebar desktop; navegação entre Hoje, Agenda, Pacientes, Fila, Estoque.
- [ ] Acesso a Scan QR via Estoque ou URL direta `/estoque/scan`.
- [ ] Dev HTTPS funcional; README com acesso via IP local no celular.
- [ ] Padrões de toque em estilos globais: 44×44 px, inputs 16 px, safe-area.
- [ ] Layout raiz alinhado aos tokens Neo Roma (sem classes genéricas conflitantes no body).
- [ ] Validação manual em iPhone real: percorrer todos os módulos via barra inferior sem layout quebrado.

### Qualidade

- [ ] Nenhum arquivo alterado fora do escopo permitido (seção 9).
- [ ] Copy em pt-BR; sem travessão "—" em textos novos.
- [ ] Imports órfãos removidos (`app-shell`, `page` raiz se aplicável).

### Explicitamente **não** exigido nesta fase

- Testes automatizados.
- Homologação formal com skill `manual-report`.
- Migrations SQL ou tipos gerados do banco.

---

## 9. Escopo de arquivos permitidos

Implementação **somente** nos paths abaixo. Qualquer outro arquivo exige atualização desta spec.

### Criar

| Arquivo                                  | Motivo                                                                                    |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| `specs/2026-08-17-fase-0-fundacao.md`    | Esta spec                                                                                 |
| `middleware.ts`                          | Refresh de sessão Supabase                                                                |
| `components.json`                        | Configuração shadcn                                                                       |
| `src/components/ui/button.tsx`           | Componente base shadcn                                                                    |
| `src/components/ui/input.tsx`            | Componente base shadcn                                                                    |
| `supabase/config.toml`                   | Supabase CLI init                                                                         |
| `supabase/migrations/.gitkeep`           | Placeholder migrations                                                                    |
| `.env.example`                           | Template de ambiente versionado                                                           |
| Certificados dev (se gerados localmente) | HTTPS local; **não** commitar chaves privadas sensíveis além do fluxo documentado do Next |

### Alterar

| Arquivo                          | Motivo                                                      |
| -------------------------------- | ----------------------------------------------------------- |
| `.gitignore`                     | Liberar `.env.example` (`!.env.example`)                    |
| `package.json`                   | Script dev HTTPS; deps shadcn/radix se necessário           |
| `README.md`                      | Onboarding, HTTPS mobile, lint/format/db                    |
| `src/components/app-shell.tsx`   | Bottom nav; limpeza de imports                              |
| `src/app/page.tsx`               | Limpeza de imports (se houver)                              |
| `src/app/globals.css`            | Theme shadcn + padrões de toque                             |
| `src/app/layout.tsx`             | Body alinhado aos tokens Neo Roma                           |
| `src/app/(app)/estoque/page.tsx` | Link para Scan QR (mínimo, se necessário para borda mobile) |
| `src/lib/env.ts`                 | Default de URL pública alinhado ao dev HTTPS                |
| `next.config.ts`                 | Ajustes dev HTTPS (se necessário)                           |
| `docs/plans/plano-F0.md`         | Atualizar status para "aprovado" / "em implementação"       |

### Pode incluir no commit da branch (decisão de repo)

| Path                                | Nota                                                         |
| ----------------------------------- | ------------------------------------------------------------ |
| `.cursor/rules/`, `.cursor/skills/` | Permitido se o mantenedor quiser versionar; não bloqueia DoD |

### Proibido alterar nesta feature

- `src/features/**` (ainda inexistente ou futura)
- `supabase/migrations/*.sql` (domínio Fase 1)
- `src/app/fila/resposta/**` (comportamento público existente, salvo fix de layout acidental)
- `docs/SECURITY.md`
- Lógica de negócio em páginas além de link mínimo Estoque → Scan

---

## 10. Decisões fechadas nesta spec

| #   | Decisão                                                  |
| --- | -------------------------------------------------------- |
| 1   | Bottom nav com **5 itens**; Scan QR agrupado sob Estoque |
| 2   | shadcn: apenas **botão + campo de texto** na F0          |
| 3   | Middleware: **somente refresh**; guarda na Fase 1        |
| 4   | Migrations: pasta vazia; zero SQL de domínio             |
| 5   | Prettier já feito; não reabrir escopo                    |

**Pendente fora desta spec (processo git):** commit único vs commits atômicos; inclusão de `.cursor/` no commit.

---

## 11. Riscos (referência)

| Risco                  | Mitigação                                          |
| ---------------------- | -------------------------------------------------- |
| shadcn + Tailwind 4    | Validar um componente antes de expandir            |
| HTTPS Windows + iPhone | README detalhado; `--experimental-https` ou mkcert |
| Middleware sem login   | Documentar limitação; guarda na F1                 |
| Cores duplicadas       | Centralizar em CSS variables                       |

---

## 12. Referências

- `docs/PLANO.md` · Fase 0
- `docs/plans/plano-F0.md`
- `AGENTS.md`
- `.cursor/rules/project-general.mdc`

---

## 13. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Próximo passo após aprovação explícita desta spec:** implementar na branch `chore/fase-0-fundacao`, sem expandir escopo.
