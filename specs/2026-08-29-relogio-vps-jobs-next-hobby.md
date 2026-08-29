# Spec · Relógio VPS + jobs Next (Hobby)

| Campo            | Valor                                              |
| ---------------- | -------------------------------------------------- |
| **Status**       | draft                                              |
| **Data**         | 2026-08-29                                         |
| **Slug**         | relogio-vps-jobs-next-hobby                        |
| **Plano origem** | `docs/plans/plano-cron-vps-hobby.md`               |
| **Fase**         | Fatia operacional (não fecha a Fase 7)             |
| **Autonomia**    | low (só repo, docs e publicação da hospedagem)     |

---

## 1. Contexto

O piloto roda na hospedagem **Hobby**. Esse plano **não aceita relógio nativo a cada 5 minutos**. Enquanto o manifesto da publicação ainda pede esse intervalo, o build **não sobe**. Duas rotinas já versionadas (aviso de estoque baixo ao financeiro e mensagens agendadas ao paciente) **não entram no ar**. Quem chama de fora recebe **job inexistente**.

O relógio real **já está instalado** na VPS Campinas (outro agent): a cada 5 minutos acorda os quatro jobs do app publicado. Não falta instalar relógio. Falta **parar de pedir relógio nativo** na hospedagem e **alinhar os docs vivos** ao contrato.

Dois jobs já estão no ar (expiração de ofertas da fila e lembretes pós-consulta). O segredo compartilhado do relógio **já bate** nesses dois. Não regravar o valor.

**Pré-requisito:** plano `docs/plans/plano-cron-vps-hobby.md` aprovado com a decisão default (um só relógio: a VPS). Fallback de relógio nativo 1x/dia **não** entra, salvo pedido explícito nesta spec.

Esta spec **não** fecha a Fase 7. Specs históricas que ainda falam em intervalo de 5 minutos no relógio nativo **permanecem** como registro da época.

---

## 2. Objetivo

1. Destravar a publicação Hobby: o manifesto **não** registra relógio nativo.
2. Fazer subir, sem mudar regra de negócio, os dois jobs que hoje estão só no repositório.
3. Deixar explícito nos docs vivos: **relógio = VPS**; **jobs = rotinas do app publicado**; **Enviar agora** não depende do relógio.

**Valor entregue:** o deploy do piloto volta a subir; a VPS passa a acordar as quatro rotinas; o time deixa de tratar “subir para Pro” ou “chamar na mão” como caminho do piloto.

---

## 3. Atores

| Ator | Interesse |
| ---- | --------- |
| Relógio (VPS Campinas) | Acordar os quatro jobs a cada 5 minutos, com o segredo compartilhado |
| Jobs (app publicado) | Executar a rotina quando acordados; recusar quem chega sem o segredo |
| Dentista / recepção | **Enviar agora** continua imediato; agendar pós-cirurgia continua “até 5 minutos depois do horário” via VPS |
| Financeiro | Aviso de estoque baixo volta a poder ser varrido no ar (regra já existente) |
| Mantenedor | Publicar a fatia; conferir que os dois jobs ausentes passaram a existir no ar; não SSH |
| Hospedagem Hobby | Publicar o app **sem** relógio nativo a cada 5 minutos |

O paciente, o auxiliar e o visualizador **não** mudam de tela nesta fatia.

---

## 4. Modelo de domínio

### 4.1 Relógio versus job

| Papel | Quem é | O que faz |
| ----- | ------ | --------- |
| **Relógio** | VPS Campinas | A cada 5 minutos, acorda cada um dos quatro jobs com o segredo compartilhado |
| **Job** | Rotina já existente no app publicado | Processa o lote da vez (idempotente) e devolve só contagens |
| **Enviar agora** | Ação humana na aba Pós-cirurgia | Dispara na hora. **Não** passa pelo relógio |

Um único relógio. A hospedagem Hobby **não** é relógio neste piloto.

### 4.2 Os quatro jobs (já existentes; esta fatia não muda a regra)

| Job | Papel de negócio |
| --- | ---------------- |
| Expiração de ofertas da fila | Encerra oferta vencida (40 min) |
| Lembretes pós-consulta | Envia / retenta e-mail ao dentista |
| Aviso de estoque baixo ao financeiro | Varre episódios e envia / retenta e-mail |
| Mensagens agendadas ao paciente | Dispara pós-cirurgia no horário; retenta oferta da fila que falhou no instante |

Os dois primeiros **já estão no ar**. Os dois últimos **já existem no repositório** e passam a entrar no ar quando o build Hobby subir.

### 4.3 Segredo compartilhado

O relógio e os jobs compartilham um segredo só de servidor.

- Sem o segredo: o job **recusa** (não processa).
- Com o segredo certo: o job **processa**.
- Os dois jobs já no ar **já comprovam** que o valor da hospedagem bate com o da VPS. Esta fatia **só confirma** que a variável existe em produção. **Não** regrava `.env` nem o valor.

### 4.4 Por que o relógio nativo quebra o piloto

O manifesto da publicação ainda pede relógio nativo **a cada 5 minutos** nos quatro jobs. O plano Hobby **recusa** esse intervalo. O build das fatias que incluíram os dois jobs novos **não publica**. Quem chama esses dois jobs no ar recebe **inexistente**, não **recusa por credencial**.

Esvaziar a lista de relógios nativos **não** apaga o manifesto. Só deixa de registrar relógio na hospedagem.

### 4.5 Um relógio, não dois

Um relógio nativo 1x/dia na hospedagem seria um **segundo** relógio: disparo extra, docs mais confusas. Os jobs são idempotentes, mas o contrato do piloto é **um** relógio (a VPS).

Fallback 1x/dia **fora** desta spec, salvo emenda explícita.

---

## 5. Matriz de acesso

Nenhuma tela, papel ou política de sessão muda.

Os jobs continuam **fora do shell autenticado**: só o relógio (ou o mantenedor em homologação) os acorda, com o segredo. Quem chega sem o segredo é recusado.

---

## 6. Escopo funcional

### 6.1 Manifesto da publicação

Retirar os quatro pedidos de relógio nativo a cada 5 minutos. Manter o arquivo. Lista de relógios nativos **vazia**.

Não apagar o manifesto. Não cadastrar relógio 1x/dia.

### 6.2 Publicação Hobby

Enviar a branch que a hospedagem publica como app do piloto. O código dos quatro jobs **não muda**. O build passa a incluir as duas rotinas que hoje ficam de fora.

Não SSH. Não mexer no crontab da VPS. Não mexer no gateway WhatsApp.

### 6.3 Segredo em produção

Confirmar no painel ou CLI da hospedagem: o segredo do relógio **existe** em produção. Não regravar. Não commitar valor.

### 6.4 Docs vivos

Atualizar só o que o time lê no dia a dia: pendências, README, segurança, registros e manuais das fatias de lembrete, estoque baixo e agendamento pós-cirurgia.

Contrato a passar a valer:

- Relógio = VPS Campinas, a cada 5 minutos.
- Jobs = as quatro rotinas do app publicado.
- Hospedagem Hobby = sem relógio nativo.
- Segredo do relógio = já ok (duas rotinas vivas comprovam).
- **Enviar agora** = independente do relógio.

Índices de implementação e de manual-dev: **sem fase nova**. Esta fatia não fecha a Fase 7.

Specs em `specs/` (inclusive as históricas com intervalo de 5 minutos no relógio nativo): **não editar**, salvo esta spec recém-criada.

---

## 7. Fora de escopo

- SSH na VPS, crontab, gateway WhatsApp, pasta do gateway na máquina.
- Nest, fila externa, Actions do GitHub ou Next.js na VPS como relógio.
- Relógio nativo 1x/dia na hospedagem (fallback só com emenda).
- Mudar regra, copy de tela, teste ou persistência dos quatro jobs.
- Sobrescrever `.env` / `.env.local`.
- Editar specs históricas.
- Fechar a Fase 7.
- Homologação `manual-report` completa.
- Criar capítulo novo em `docs/implementation/` ou `docs/manual-dev/` (só ajustar os já citados).

---

## 8. Caminhos felizes

### 8.1 Caminho feliz · Publicação destrava

1. O manifesto deixa de pedir relógio nativo.
2. A hospedagem Hobby aceita o build.
3. Os dois jobs que estavam só no repositório passam a existir no ar.
4. Os dois jobs que já estavam no ar continuam no ar.

### 8.2 Caminho feliz · Relógio único

1. A VPS acorda os quatro jobs a cada 5 minutos, com o segredo.
2. Cada job processa o lote da vez (ou devolve vazio, se não houver pendência).
3. Ninguém na hospedagem acorda os jobs por conta própria.

### 8.3 Caminho feliz · Conferência sem credencial

1. O mantenedor, da máquina local, acorda os dois jobs novos **sem** o segredo.
2. A resposta é **recusa por falta de credencial** (o job existe).
3. Deixa de ser **job inexistente**.

### 8.4 Caminho feliz · Enviar agora intacto

1. O dentista usa **Enviar agora** na Pós-cirurgia.
2. A mensagem sai na hora, com o canal no ar.
3. O relógio não participa.

### 8.5 Caminho feliz · Docs alinhados

1. Quem abre pendências, README, segurança ou os manuais das fatias tocadas lê: relógio = VPS; jobs = app publicado; Hobby sem relógio nativo.
2. O texto “até Pro / chamar na mão como caminho do piloto” some dos docs vivos.

---

## 9. Erros, bordas e mitigações

| Situação | Comportamento esperado | Mitigação |
| -------- | ---------------------- | --------- |
| Manifesto ainda pede relógio a cada 5 minutos | Build Hobby falha; jobs novos continuam inexistentes no ar | Esvaziar a lista de relógios nativos §6.1 |
| Publicação antiga continua no ar | Os dois jobs novos ainda respondem inexistente | Conferir §8.3: recusa por credencial, não inexistente |
| Relógio nativo 1x/dia cadastrado | Segundo relógio; disparo extra; docs confusas | Proibido nesta spec §4.5 |
| Chamada sem o segredo | Recusa; não processa | Já é o contrato dos jobs; §8.3 usa isso como prova de existência |
| Segredo divergente entre VPS e hospedagem | Jobs recusam o relógio | Já evidenciado: duas rotinas vivas processam; só confirmar presença §6.3 |
| VPS cai | Jobs param de acordar até a VPS voltar | Fora desta fatia; fallback 1x/dia só com emenda |
| **Enviar agora** com canal no ar | Continua imediato | Não acoplar ao relógio §4.1 |
| Agendar pós-cirurgia | Continua “até 5 minutos depois do horário” quando a VPS acordar o job | Docs vivos deixam de dizer “só Pro” |
| Job sem lote pendente | Processa zero; não quebra | Idempotência já existente |
| SSH / crontab / gateway | Não fazer | §7 |
| Spec histórica ainda fala em relógio nativo a cada 5 minutos | Permanece como registro | Não editar `specs/` antigas §6.4 |
| Fechar Fase 7 de quebra | Proibido | Sem fase nova nos índices |

---

## 10. Critérios de Done

### Obrigatórios (DoD)

- [ ] Manifesto da publicação: lista de relógios nativos **vazia**. Sem intervalo de 5 minutos. Sem relógio 1x/dia.
- [ ] Arquivo do manifesto **permanece** no repositório (não apagado).
- [ ] Código dos quatro jobs **intacto** (nenhuma mudança de regra).
- [ ] Publicação Hobby sobe na branch que o app do piloto usa.
- [ ] Caminho §8.3: os dois jobs que hoje estão inexistentes no ar passam a **recusar sem credencial**.
- [ ] Segredo do relógio confirmado presente em produção; valor **não** regravado; `.env` / `.env.local` **não** tocados.
- [ ] Docs vivos da tabela §11 dizem: relógio = VPS a cada 5 minutos; jobs = as quatro rotinas; Hobby sem relógio nativo; **Enviar agora** independente.
- [ ] README deixa de apresentar “até Pro / chamar na mão” como caminho do piloto.
- [ ] `docs/SECURITY.md` deixa de apresentar o Hobby como relógio 1x/dia; passa a apontar a VPS a cada 5 minutos.
- [ ] `docs/state/PENDENCIAS.md`: bloco operacional com o contrato acima; Fase 7 **não** marcada como fechada.
- [ ] Índices `docs/implementation/README.md` e `docs/manual-dev/README.md` **sem** fase nova.
- [ ] Specs históricas **não** editadas.
- [ ] `npm run lint`, `npm run format:check`, `npm run build`, `npm run test` passam (regressão; sem teste novo).
- [ ] Nenhum arquivo fora do escopo §11.

### Qualidade

- [ ] Copy nova em pt-BR; sem travessão em texto novo de produto.
- [ ] Relato final: o que subiu e o que os docs passam a dizer.

### Explicitamente **não** exigido nesta spec

- Homologação `manual-report`.
- iPhone / Android reais (ficam no fechamento da Fase 7).
- SSH para conferir o crontab.
- Teste novo, migration, tela, persistência.
- Fechamento da Fase 7.
- Capítulo novo de implementação ou de manual-dev.
- Cobertura 80% extra (nada de domínio novo).

---

## 11. Escopo de arquivos permitidos

Implementação **somente** nos paths abaixo. Qualquer outro arquivo exige atualização desta spec.

### Criar

| Arquivo | Motivo |
| ------- | ------ |
| `specs/2026-08-29-relogio-vps-jobs-next-hobby.md` | Esta spec |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `vercel.json` | Esvaziar a lista de relógios nativos; manter o arquivo |
| `docs/state/PENDENCIAS.md` | Bloco operacional: relógio VPS 5 min; quatro jobs; Hobby sem relógio nativo; segredo ok; Enviar agora independente |
| `README.md` | Tirar “até Pro / chamar na mão” como caminho do piloto; VPS = relógio |
| `docs/SECURITY.md` | Hobby sem relógio nativo a cada 5 minutos; disparo a cada 5 min pela VPS |
| `docs/implementation/F6-lembrete-piloto.md` | Relógio nativo fora; job acordado pela VPS |
| `docs/implementation/F7-05b-agendamento-pos-cirurgia.md` | Manifesto sem relógio nativo |
| `docs/implementation/F7-06-estoque-baixo-financeiro.md` | Idem |
| `docs/manual-dev/08-fase-6-lembrete-piloto.md` | Job a cada 5 min via VPS |
| `docs/manual-dev/15-fase-7-06-estoque-baixo-financeiro.md` | Varredura via VPS |
| `docs/manual-dev/17-fase-7-05b-agendamento-pos-cirurgia.md` | Relógio VPS; Enviar agora independente |

### Proibido alterar nesta feature

- Código dos quatro jobs e de qualquer feature (`src/**`).
- Specs em `specs/` além desta.
- Índices `docs/implementation/README.md` e `docs/manual-dev/README.md` (sem fase nova; não precisa tocar).
- `.env`, `.env.local`, valores de segredo.
- Crontab, gateway, máquina da clínica.
- Migrations, testes, UI.
- `docs/plans/plano-cron-vps-hobby.md` (já aprovado; não reabrir).

---

## 12. Decisões fechadas nesta spec

| # | Decisão |
| - | ------- |
| 1 | Relógio do piloto = **VPS Campinas**, a cada 5 minutos |
| 2 | Jobs = as **quatro** rotinas já existentes no app publicado |
| 3 | Hospedagem Hobby: **sem** relógio nativo (lista vazia). Manifesto permanece |
| 4 | Fallback 1x/dia na hospedagem: **não** entra |
| 5 | Código dos jobs **não muda** |
| 6 | Segredo do relógio: só confirmar presença em produção; **não** regravar |
| 7 | **Enviar agora** não usa relógio |
| 8 | Specs históricas **não** se editam |
| 9 | Sem fase nova; **não** fecha a Fase 7 |
| 10 | Sem SSH, sem crontab, sem gateway nesta fatia |
| 11 | Prova de existência no ar: chamada **sem** segredo recusa por credencial (não “inexistente”) |
| 12 | Branch a publicar: a que a hospedagem do piloto já usa |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Hobby recusar qualquer relógio que não seja diário | Lista vazia: nenhum relógio nativo §4.4 |
| Deploy antigo continuar no ar | Conferência §8.3 |
| Segundo relógio (1x/dia) confundir operação | Default vazio §4.5 |
| Segredo divergente | Duas rotinas vivas já processam; só confirmar presença |
| Docs vivos e specs históricas divergirem | Specs antigas ficam; docs vivos passam a ser a fonte operacional |
| Alguém SSH “só para conferir” | Proibido; a prova é a chamada sem segredo da máquina local |

Paths críticos de runtime: nenhum de tela. Só o manifesto da publicação e o deploy das duas rotinas já versionadas.

---

## 14. Referências

- Plano aprovado: `docs/plans/plano-cron-vps-hobby.md`
- Spec F6: `specs/2026-08-18-fase-6-lembrete-piloto.md` (job de lembrete; texto histórico de relógio nativo)
- Spec F7-05b: `specs/2026-08-28-f7-05b-agendamento-pos-cirurgia.md`
- Spec F7-06: `specs/2026-08-26-f7-06-estoque-baixo-financeiro.md`
- `docs/SECURITY.md` · jobs com segredo, Hobby
- `docs/state/PENDENCIAS.md`
- `AGENTS.md` · WhatsApp fora deste repo; ClinRoma dispara

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Próximo passo após aprovação explícita desta spec:** implementar **somente** o manifesto vazio + docs vivos da tabela §11, na branch que a hospedagem do piloto publica. Sem SSH, sem mudar job, sem fechar a Fase 7.
