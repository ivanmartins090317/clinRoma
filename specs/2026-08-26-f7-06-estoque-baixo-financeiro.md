# Spec · F7-06 · Estoque baixo para o financeiro

| Campo            | Valor                                              |
| ---------------- | -------------------------------------------------- |
| **Status**       | draft                                              |
| **Data**         | 2026-08-26                                         |
| **Slug**         | f7-06-estoque-baixo-financeiro                     |
| **Plano origem** | `docs/plans/plano-F7.md` · Passo 6                 |
| **Fase**         | 7 de `docs/PLANO.md`                               |
| **Spec pai**     | `specs/2026-08-25-fase-7-ajustes-demo-felipe.md`   |
| **PRD vault**    | `prd-mvp.md` (revisão 2026-08-25)                  |

---

## 1. Contexto

A Fase 5 entregou o estoque operacional: cadastro, entrada por planilha, QR, retirada por scan e **alertas na Hoje** quando o insumo fica abaixo do mínimo. A spec da F5 deixou **fora** o e-mail de estoque baixo. Na demo de 2026-08-25 o Felipe pediu que o **financeiro** receba esse aviso por e-mail, para comprar sem depender de alguém abrir o sistema.

Hoje a recepção e o admin vêem a lista na Hoje. Quem compra insumo **não** recebe nada se não entrar no app. Sem o aviso, a reposição continua informal.

O endereço do financeiro **ainda não veio do Felipe**. Esta fatia implementa o aviso completo; com o destino vazio, **não dispara**. Quando ele passar o e-mail, basta configurar o ambiente.

Esta spec cobre **apenas F7-06**. Não inclui WhatsApp, pós-cirurgia, anamnese, odontograma, transcrição, card do paciente nem o fechamento documental da Fase 7 inteira.

**Pré-requisito:** estoque da Fase 5 no `main` (movimentação, saldo, mínimo, alertas na Hoje) e o envio de e-mail já usado no lembrete pós-consulta (Fase 6). F7-04 e F7-05 **não** bloqueiam esta fatia.

**E-mail de teste (desenvolvimento / homologação interna):** `ivanmartins.ilha@gmail.com`. Não é o endereço de produção da clínica. Não gravar esse valor no código; só no ambiente local e como exemplo comentado.

---

## 2. Objetivo

Avisar o **financeiro por e-mail** quando um insumo **entra em reposição** (saldo abaixo do mínimo), reutilizando o mesmo sentido operacional de estoque baixo da Fase 5, **sem tela de configurações** e **sem mudar** a Hoje nem a lista de estoque.

**Valor entregue:** quem compra recebe o aviso no e-mail; a equipe continua vendo o alerta na Hoje; se o endereço ainda não estiver configurado, o estoque funciona igual e ninguém é importunado.

---

## 3. Atores

| Ator             | Interesse |
| ---------------- | --------- |
| Financeiro       | Receber o e-mail de reposição; pode **não** ter conta no sistema |
| Administrador    | Configurar o endereço no ambiente; movimentar estoque; não precisa de tela nova |
| Auxiliar de sala | Retirada por scan que pode cruzar o mínimo (o aviso sai nos bastidores) |
| Recepção         | Continua vendo o alerta na Hoje; **não** recebe este e-mail |
| Dentista         | Continua vendo o alerta na Hoje; **não** recebe este e-mail |
| Visualizador     | Sem módulo de estoque; fora desta feature |
| Paciente         | Fora desta feature |

---

## 4. Modelo de domínio

### 4.1 Precisa de reposição

Um insumo **precisa de reposição** quando:

- o **estoque mínimo** é maior que zero; e
- a **quantidade atual** é **menor** que esse mínimo.

Isso **inclui zerado** (saldo 0 com mínimo > 0): é o caso mais urgente de compra.

Não precisa de reposição quando:

- o mínimo é 0 (a clínica não definiu limite); ou
- a quantidade atual é maior ou igual ao mínimo.

A lista **Estoque · abaixo do mínimo** na Hoje **não muda** nesta fatia. Hoje hoje omite o zerado (trata zerado como situação própria). O e-mail ao financeiro usa o critério acima, alinhado ao texto da spec F5 (atual &lt; mínimo, mínimo &gt; 0).

### 4.2 Episódio de reposição

Um **episódio** começa quando o insumo **passa a** precisar de reposição e termina quando **deixa de** precisar.

| Transição | Significado |
| --------- | ----------- |
| Não precisava → precisa | **Entrou** em reposição. Pode gerar aviso. |
| Precisa → ainda precisa | Continua no mesmo episódio. **Não** gera novo aviso. |
| Precisa → não precisa | **Saiu** de reposição (compra, ajuste, mínimo baixado). Episódio encerra. |
| Não precisava → não precisa | Nada. |

Causas típicas de entrada: retirada por scan, ajuste para baixo, cadastro já abaixo do mínimo, aumento do mínimo acima do saldo.

Causas típicas de saída: entrada de compra, ajuste para cima, mínimo reduzido a 0 ou para um valor que o saldo atende.

### 4.3 Aviso ao financeiro

Cada episódio admite **no máximo um aviso enviado com sucesso**.

O aviso registra, em linguagem operacional (não é prontuário):

- o **insumo**;
- saldo e mínimo **no momento em que o aviso foi montado**;
- **situação:** pendente, enviado, falhou ou cancelado;
- tentativas e próxima tentativa (mesma política de retentativa do lembrete: 3 tentativas, +5 min, +15 min, depois falhou definitivo);
- momento de criação e, se enviado, momento do envio;
- mensagem de erro **curta e genérica** se falhou (sem detalhe do provedor, sem endereço completo).

Regras:

- Enfileirar o aviso **não** desfaz a movimentação de estoque. Se o enfileiramento falhar, o saldo permanece; a varredura (§4.6) cobre o caso.
- Se o episódio **encerrar** enquanto o aviso ainda está **pendente**, o aviso vira **cancelado**: o financeiro não recebe e-mail de um item que já foi reposto.
- Aviso **já enviado** permanece histórico; um episódio novo (saiu e entrou de novo) gera **outro** aviso.

### 4.4 Destino

O destinatário é **um** endereço de e-mail do financeiro, lido da **configuração de ambiente** (`FINANCE_ALERT_EMAIL`).

| Destino | Comportamento |
| ------- | ------------- |
| Ausente, só espaços, ou formato inválido | **Não dispara:** não cria aviso, não chama o provedor, a varredura não envia. O estoque segue normal. |
| Preenchido e válido | Avisos novos são enfileirados e processados. |

Não há tela de configurações nesta fatia. Não há lista de cópias. Quando o Felipe passar o endereço de produção, o admin coloca no ambiente (local ou painel de hospedagem). Até lá, o valor de teste é `ivanmartins.ilha@gmail.com` **só no ambiente**, nunca no código-fonte.

O **remetente** é o mesmo já usado no lembrete pós-consulta. A chave do provedor de e-mail também. Sem segundo provedor.

### 4.5 Conteúdo do e-mail

Objetivo: o financeiro saber **o que comprar**, sem dado de paciente.

**Assunto:** `ClinRoma · Estoque baixo · [nome do insumo]`

**Corpo (HTML + texto simples):**

- Saudação curta (ex.: `Olá, financeiro.`).
- Uma linha: o insumo **precisa de reposição**.
- Nome do insumo, quantidade atual, estoque mínimo, unidade (unitário, caixa, rolo ou frasco).
- Data e hora do aviso no fuso `America/Sao_Paulo` (dd/MM/yyyy HH:mm).
- Ligação para abrir o **Estoque** no app (URL pública do sistema).
- Rodapé: Clínica Neo Roma, mensagem automática, **sem** nome de paciente, CPF, prontuário, QR de pacote ou responsável pela retirada.

O corpo **não** lista todos os insumos da clínica. Só o insumo daquele episódio.

### 4.6 Varredura

Além do enfileiramento na movimentação, uma **rotina periódica** (mesmo ritmo dos outros jobs da clínica, a cada 5 minutos) faz duas coisas:

1. Processa avisos **pendentes** cuja próxima tentativa já chegou (retentativa).
2. Para cada insumo que **ainda precisa de reposição** e **não tem** aviso pendente nem enviado **neste episódio**, cria o aviso (cobre seed já abaixo do mínimo, falha de enfileiramento e endereço que passou a existir depois).

Se o destino estiver vazio, a rotina é **no-op**: não cria, não envia, não marca falha.

Se a chave ou o remetente do provedor estiverem ausentes, o aviso permanece pendente (igual ao lembrete): não some no silêncio eterno; consome a política de tentativas com erro genérico de configuração.

### 4.7 O que o aviso não é

- Não é a lista da Hoje.
- Não é um módulo financeiro (compra, NF, fornecedor).
- Não é push no celular.
- Não é e-mail para recepção, dentista ou auxiliar.
- Não é tela de configurações.

---

## 5. Matriz de acesso

O disparo é **rotina do sistema**, não um botão na interface.

| Ação | admin | reception | dentist | room_assistant | viewer | financeiro (sem conta) |
| ---- | :---: | :-------: | :-----: | :------------: | :----: | :--------------------: |
| Ver alerta na Hoje (já existe) | Sim | Sim | Sim | Não† | Não | Não |
| Movimentar saldo (já existe) | Sim | Não | Não | Sim (scan) | Não | Não |
| Receber o e-mail de reposição | Não‡ | Não | Não | Não | Não | **Sim** (destino) |
| Configurar o endereço pela interface | Não | Não | Não | Não | Não | Não |
| Disparar o aviso na mão pela interface | Não | Não | Não | Não | Não | Não |

**†** Auxiliar vê saldo no detalhe e no scan, como na F5; não acessa a Hoje.

**‡** Admin só recebe se o endereço configurado for o dele (caso de teste). O papel em si não entra na lista.

A rotina de envio usa credencial de servidor, não a sessão de quem retirou o pacote. Políticas de acesso do estoque **não abrem** leitura clínica. Falha segura: papel sem estoque não altera saldo e portanto não dispara aviso por ação própria.

---

## 6. Escopo funcional

### 6.1 Gancho nas escritas de saldo

Depois que o saldo ou o mínimo **já persistiu** com sucesso, o sistema compara a situação **antes** e **depois**:

- cadastro de insumo (saldo inicial e mínimo);
- alteração de insumo (mínimo ou dados que afetem o critério);
- entrada de compra / pacote;
- retirada por scan (incluindo override do admin);
- ajuste de saldo.

Se entrou em reposição: enfileira o aviso (se o destino estiver válido) e tenta o envio imediato, no mesmo espírito do lembrete. Falha no envio imediato **não** desfaz o estoque.

Se saiu de reposição: cancela aviso pendente daquele insumo.

### 6.2 Rotina periódica

Mesmo segredo de cron já usado nas outras rotinas. Resposta só com contagens (processados, enviados, falhos, cancelados, criados pela varredura). **Sem** nome de insumo, **sem** endereço, **sem** saldo na resposta HTTP.

### 6.3 Configuração de ambiente

Documentar no exemplo de ambiente:

- `FINANCE_ALERT_EMAIL` (opcional; vazio = não dispara).
- Comentário: em desenvolvimento pode usar `ivanmartins.ilha@gmail.com`; em produção, o endereço que o Felipe passar.
- Reutilizar `RESEND_API_KEY` e `RESEND_FROM_EMAIL` (já documentados na F6).

Não criar segundo remetente. Não commitar endereço real nem chave.

### 6.4 Interface

**Sem mudança visual obrigatória** em Estoque nem na Hoje. Sem seção nova de falhas (a da F6 é de lembrete ao dentista; não misturar). Sem `/configuracoes`.

A visibilidade operacional da equipe continua sendo a seção **Estoque · abaixo do mínimo** na Hoje.

### 6.5 Copy (pt-BR)

Exemplos aceitos (sem travessão):

- Assunto: `ClinRoma · Estoque baixo · Anestésico`
- Corpo: `O insumo abaixo precisa de reposição.`
- Linha: `Anestésico: 2 de 5 (frasco).`
- Ligação: `Abrir estoque`
- Rodapé: `Clínica Neo Roma. Mensagem automática, não responda.`
- Erro genérico persistido: `Não foi possível enviar o e-mail.`
- Erro de configuração: `Serviço de e-mail não configurado.`

### 6.6 Seed e teste local

O seed da F5 já deixa **Anestésico** abaixo do mínimo. Esta fatia **não** reescreve esse seed.

Para testar o cruzamento: um insumo que **não** precisa de reposição (ex.: Luva) sofre retirada ou ajuste até ficar abaixo; com destino de teste, o e-mail sai uma vez.

Não é obrigatório um seed novo de aviso enviado.

---

## 7. Fora de escopo

- F7-01 a F7-05, F7-07 a F7-09.
- Tela `/configuracoes` ou campo na clínica para o e-mail.
- Módulo financeiro, pedido a fornecedor, nota fiscal, OCR.
- Push, WhatsApp, SMS.
- Digest com vários insumos no mesmo e-mail (um aviso = um insumo).
- Lista de destinatários, cópia, ou horário comercial.
- Painel de falhas deste aviso na Hoje.
- Mudar a regra ou a lista visual da Hoje (incluindo passar a mostrar zerado lá).
- Reabrir F5 (scan, etiqueta, planilha).
- Fechamento documental da Fase 7 (`docs/implementation/F7-ajustes-demo-felipe.md` e capítulo inteiro do manual-dev).
- Playwright.
- Sobrescrever `.env.local`.
- Endereço de produção do Felipe (ele ainda vai passar).

---

## 8. Fluxos

### 8.1 Caminho feliz · Cruzou o mínimo na retirada

1. Destino de teste configurado (`ivanmartins.ilha@gmail.com`). Provedor de e-mail configurado.
2. Insumo **Luva** (ou equivalente acima do mínimo) sofre retirada até a quantidade atual ficar menor que o mínimo, ainda positiva ou zerada.
3. O saldo cai. A Hoje passa a listar o item se a regra visual atual cobrir; o zerado pode não aparecer na Hoje.
4. O financeiro recebe **um** e-mail com nome, saldo, mínimo, unidade e ligação para o Estoque.
5. Uma segunda retirada (ainda em reposição) **não** gera segundo e-mail.

**Pronto quando este fluxo passa.**

### 8.2 Caminho feliz · Reposição e novo episódio

1. Depois do §8.1, entra compra (ou ajuste para cima) e o saldo volta a atender o mínimo.
2. Aviso pendente, se houver, é cancelado; o já enviado permanece histórico.
3. Nova queda abaixo do mínimo.
4. O financeiro recebe **outro** e-mail (episódio novo).

### 8.3 Caminho feliz · Cadastro já abaixo do mínimo

1. Admin cadastra insumo com mínimo 20 e saldo inicial 5.
2. Com destino configurado, o aviso é enfileirado.
3. O financeiro recebe o e-mail daquele insumo.

### 8.4 Caminho feliz · Aumento do mínimo

1. Insumo com saldo 10 e mínimo 5 (não precisa de reposição).
2. Admin altera o mínimo para 15.
3. Passa a precisar de reposição. Aviso único, como no §8.1.

### 8.5 Caminho feliz · Destino vazio (caso do Felipe)

1. `FINANCE_ALERT_EMAIL` ausente ou vazio.
2. Auxiliar retira até cruzar o mínimo.
3. **Nenhum** e-mail sai. Nenhum aviso fica falhando em loop.
4. Estoque e Hoje continuam iguais à F5.

### 8.6 Caminho feliz · Endereço passou a existir

1. Anestésico do seed (ou outro) **já** precisa de reposição. Destino estava vazio.
2. Admin configura o destino de teste no ambiente.
3. Na próxima varredura, cria o aviso e envia **uma** vez para cada insumo ainda em reposição sem aviso neste episódio.
4. Varreduras seguintes **não** reenviam enquanto o episódio não encerrar.

### 8.7 Caminho feliz · Seed Anestésico com destino já configurado

1. Ambiente de desenvolvimento com destino de teste e provedor.
2. Sem nova movimentação, a varredura encontra o Anestésico abaixo do mínimo.
3. Um e-mail de Anestésico chega. Não dispara a cada 5 minutos.

---

## 9. Erros, bordas e mitigações

| Situação | Comportamento esperado | Mitigação |
| -------- | ---------------------- | --------- |
| Destino vazio | Não dispara | §4.4 / §8.5 |
| Destino inválido (sem `@`, lixo) | Trata como vazio | Validação na borda da rotina |
| Provedor ou remetente ausente, destino preenchido | Aviso pendente; retentativa; depois falhou com erro genérico de configuração | Igual lembrete F6 |
| Provedor rejeita o envio | Retentativa; falhou definitivo na 3ª | Sem stack no registro |
| Enfileirar falha depois do saldo gravado | Saldo permanece; varredura cobre | §4.3 / §4.6 |
| Duas retiradas simultâneas no mesmo insumo | No máximo um aviso enviado por episódio | Unicidade do episódio aberto |
| Episódio encerra com aviso pendente | Cancela; não envia | §4.3 |
| Mínimo 0, saldo 0 | Não precisa de reposição; sem e-mail | §4.1 |
| Saldo exatamente igual ao mínimo | Não precisa de reposição | Igual F5: abaixo é **menor**, não menor ou igual |
| Insumo zerado com mínimo &gt; 0 | **Precisa** de reposição; e-mail se cruzou ou varredura | §4.1; Hoje pode omitir |
| Papel sem estoque tenta movimentar | Recusa atual da F5; sem aviso | Matriz §5 |
| Sessão expirada no scan | Retirada não grava; sem aviso | Comportamento atual |
| Logs / Sentry / resposta do job | Sem endereço completo, sem lista de saldos, sem PHI | Mascarar destino; só identificadores e contagens |
| Financeiro responde o e-mail | Fora de escopo; rodapé pede para não responder | Copy §6.5 |
| Endereço de teste no código | Proibido | Só ambiente; exemplo comentado |
| Travessão em copy nova | Proibido | §6.5 |

---

## 10. Critérios de Done

### Obrigatórios (DoD)

- [ ] Caminho feliz §8.1: cruzou o mínimo na retirada → um e-mail; segunda retirada no mesmo episódio → nenhum e-mail extra.
- [ ] Caminho feliz §8.2: reposição e nova queda → segundo e-mail.
- [ ] Caminhos §8.3 e §8.4: cadastro já abaixo e aumento do mínimo geram aviso.
- [ ] Caminho §8.5: destino vazio → nenhum envio, estoque intacto.
- [ ] Caminhos §8.6 e §8.7: varredura cobre item já em reposição (seed Anestésico) sem reenviar a cada ciclo.
- [ ] Critério §4.1 coberto em regra de domínio (Vitest): precisa / não precisa; cruzou; saiu; mínimo 0; igual ao mínimo; zerado com mínimo &gt; 0.
- [ ] Idempotência do episódio (um enviado por episódio; pendente cancelado ao sair) coberta em teste de domínio.
- [ ] Conteúdo do e-mail: assunto, saldo, mínimo, unidade, ligação ao Estoque; **sem** paciente; teto de copy em teste.
- [ ] Destino vazio / inválido não chama o provedor (teste da regra, sem bater em rede).
- [ ] Retentativa: 3 tentativas, +5 min, +15 min, depois falhou (números iguais ao lembrete; teste no domínio desta fatia, sem acoplar o módulo de lembretes).
- [ ] Escritas de saldo da F5 que alteram quantidade ou mínimo passam pelo gancho; falha do aviso **não** reverte o estoque.
- [ ] Rotina periódica protegida pelo mesmo segredo de cron; resposta sem endereço e sem saldo.
- [ ] `FINANCE_ALERT_EMAIL` documentado no exemplo de ambiente, com o e-mail de teste só em comentário.
- [ ] `npm run lint`, `npm run format:check`, `npm run build`, `npm run test` passam.
- [ ] Checklist aplicável de `docs/SECURITY.md`: autorização no servidor / rotina, fail secure, sem PHI em logs, sem segredo no cliente, destino só no ambiente.
- [ ] Copy pt-BR; sem travessão em textos novos.
- [ ] Nenhum arquivo fora do escopo §11.
- [ ] Arquivos novos ≤ ~300 linhas.
- [ ] `docs/state/PENDENCIAS.md`: item **F7-06** marcado como implementado; o endereço de produção do Felipe permanece na seção “Pendente com o Felipe”.

### Qualidade

- [ ] E-mail legível no celular (texto simples + HTML simples; sem layout pesado).
- [ ] Ligação “Abrir estoque” aponta para a URL pública do app, não para localhost hardcoded.
- [ ] Hoje e Estoque **não** pioram: regressão visual não é exigida, mas as telas existentes continuam utilizáveis.

### Explicitamente **não** exigido nesta spec

- Homologação `manual-report` completa.
- iPhone e Android reais (ficam no fechamento da Fase 7).
- E-mail real do Felipe em produção.
- Tela de configurações.
- Painel de falhas deste aviso.
- Docs de fechamento da Fase 7 inteira. Registro curto desta fatia é permitido se o fluxo de close-phase da fatia já estiver em uso, mas **não** fecha a fase.
- Cobertura 80% global do repositório (apenas domínio tocado).
- Mudar a lista da Hoje para incluir zerado.

---

## 11. Escopo de arquivos permitidos

Implementação **somente** nos paths abaixo. Qualquer outro arquivo exige atualização desta spec.

### Criar

| Arquivo | Motivo |
| ------- | ------ |
| `specs/2026-08-26-f7-06-estoque-baixo-financeiro.md` | Esta spec |
| `src/features/stock/domain/finance-alert.ts` | Precisa de reposição, cruzou, saiu, destino válido/vazio, episódio |
| `src/features/stock/domain/finance-alert.test.ts` | Testes das regras §4.1–4.4 |
| `src/features/stock/domain/finance-alert-email.ts` | Assunto e corpo (HTML + texto) |
| `src/features/stock/domain/finance-alert-email.test.ts` | Sem PHI; campos obrigatórios; copy |
| `src/features/stock/domain/finance-alert-retry.ts` | Política de 3 tentativas (espelho numérico do lembrete, local ao estoque) |
| `src/features/stock/domain/finance-alert-retry.test.ts` | +5 / +15 / falhou |
| `src/features/stock/lib/enqueue-finance-alert.ts` | Criar aviso após cruzar; cancelar pendente ao sair |
| `src/features/stock/lib/send-finance-alert-email.ts` | Montar e enviar via cliente de e-mail já existente |
| `src/features/stock/lib/process-finance-alerts.ts` | Processar pendentes + varredura |
| `src/app/api/cron/process-stock-finance-alerts/route.ts` | Rotina periódica (mesmo segredo de cron) |
| `supabase/migrations/023_stock_finance_alerts_f7.sql` | Persistência do aviso (insumo, situação, tentativas, enviado em, erro genérico) e políticas de acesso |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/features/stock/actions.ts` | Gancho após cadastro, alteração de mínimo, ajuste (saldo já gravado) |
| `src/features/stock/lib/apply-withdrawal.ts` | Gancho após retirada (incluindo override) |
| `src/features/stock/lib/apply-stock-entry.ts` | Gancho após entrada / pacote (pode encerrar episódio) |
| `src/lib/email/resend-client.ts` | Leitura do destino `FINANCE_ALERT_EMAIL` (função pequena; reutilizar cliente e remetente) |
| `.env.example` | Documentar `FINANCE_ALERT_EMAIL` (comentário com o e-mail de teste) |
| `src/lib/supabase/database.types.ts` | Regenerar após a migration `023` |
| `docs/state/PENDENCIAS.md` | Marcar F7-06 após o código (não nesta spec draft) |

### Permitido com restrição

| Arquivo | Restrição |
| ------- | --------- |
| `README.md` | **Só** a tabela de variáveis: incluir `FINANCE_ALERT_EMAIL`. Sem reescrever o README. |
| `docs/manual-dev/07-fase-5-insumos-estoque.md` | **Só** uma linha apontando que o e-mail ao financeiro é F7-06, se o capítulo da F5 ainda disser que push/e-mail está fora. Sem virar o manual da F7. |
| `docs/SECURITY.md` | **Só** se for preciso registrar: destino no ambiente, sem PHI, destino mascarado em log, rotina com segredo. Sem reabrir o checklist inteiro. |
| `vercel.json` | **Só** agendar a rotina no mesmo intervalo dos outros jobs (`*/5 * * * *`). Criar o arquivo se ele não existir no repo, incluindo os crons já documentados da fila e dos lembretes. |

### Proibido alterar nesta feature

- Componentes visuais de estoque e Hoje (`stock-list.tsx`, `stock-supply-detail.tsx`, páginas `/estoque` e `/hoje`), salvo import mínimo impossível de evitar (não deve ser necessário).
- `src/features/stock/domain/supply-status.ts` (a Hoje continua com a regra atual).
- Lembretes (`src/features/reminders/**`), salvo nenhum acoplamento: **não** importar domínio de lembrete no estoque.
- WhatsApp, prontuário, pacientes, agenda, fila, anamnese.
- `supabase/migrations/001` a `022`.
- Conteúdo extra em `023` além do aviso financeiro de estoque (sem misturar tokens de anamnese nem mensagens WhatsApp).
- `.env.local`, secrets reais, endereço de produção.
- Spec pai da Fase 7 e specs F7-01 a F7-05 / F7-07 a F7-09, salvo pedido explícito.
- Docs de fechamento da Fase 7 inteira.

---

## 12. Decisões fechadas nesta spec

| # | Decisão |
| - | ------- |
| 1 | Canal: **e-mail**, mesmo provedor do lembrete pós-consulta |
| 2 | Destino: **um** endereço no ambiente (`FINANCE_ALERT_EMAIL`); vazio = não dispara |
| 3 | Sem tela de configurações nesta fatia |
| 4 | Precisa de reposição: mínimo &gt; 0 e quantidade atual **&lt;** mínimo (**inclui zerado**) |
| 5 | Igual ao mínimo **não** avisa |
| 6 | Um e-mail **por insumo por episódio**; sem digest |
| 7 | Segunda queda no mesmo episódio **não** reenvia; saiu e entrou de novo **reenvia** |
| 8 | Pendente é **cancelado** se o episódio encerrar antes do envio |
| 9 | Falha do aviso **não** desfaz movimentação de estoque |
| 10 | Varredura a cada 5 min: retentativa + itens já em reposição sem aviso neste episódio |
| 11 | Hoje e Estoque **sem** mudança visual obrigatória |
| 12 | Sem painel de falhas deste aviso |
| 13 | Sem dado de paciente no e-mail nem nos logs |
| 14 | E-mail de teste interno: `ivanmartins.ilha@gmail.com` só no ambiente |
| 15 | Endereço de produção continua pendente com o Felipe; não bloqueia o código |
| 16 | Migration incremental `023`; não editar `001`–`022` |
| 17 | Fechamento da Fase 7 inteira **não** entra nesta fatia |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Endereço do Felipe vazio no go-live | Destino vazio = no-op §4.4 / §8.5 |
| Spam a cada retirada abaixo do mínimo | Um aviso por episódio §4.2 |
| Item do seed nunca avisado | Varredura §4.6 / §8.7 |
| Avisar depois que já repor | Cancela pendente ao sair §4.3 |
| PHI / paciente no e-mail de estoque | Conteúdo só de insumo §4.5; testes |
| Destino em log | Mascara §9 |
| Acoplar estoque ao módulo de lembretes | Política de retentativa copiada em números; cliente de e-mail compartilhado e fino |
| Mudar a Hoje “de quebra” | Proibido alterar UI de alerta §11 |
| Dois avisos na corrida de scan | Unicidade do episódio aberto §9 |
| `vercel.json` ausente no repo | Permitido criar só com os crons já documentados + este |
| Financeiro sem conta no app | E-mail se basta; ligação abre o login se ele tiver acesso |

---

## 14. Referências

- Plano: `docs/plans/plano-F7.md` · Passo 6 · F7-06
- Spec pai: `specs/2026-08-25-fase-7-ajustes-demo-felipe.md` § F7-06
- Spec F5: `specs/2026-08-18-fase-5-insumos-estoque.md` §4.1, §6.9, §7 (e-mail estava fora)
- Spec F6: `specs/2026-08-18-fase-6-lembrete-piloto.md` (provedor, retentativa, destino, fail secure)
- `docs/SECURITY.md` · fail secure, segredos no ambiente, logs sem dado indevido
- `docs/state/PENDENCIAS.md` · F7-06
- Ata vault: `10 Dev/Clientes/clinica-neo-roma-dev/Reunioes/2026-08-25-apresentacao-felipe-feedback.md`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Próximo passo após aprovação explícita desta spec:** implementar **somente F7-06** na branch `feature/fase-7-ajustes-demo-felipe`, sem F7-04/F7-05 e sem fechar a Fase 7 no mesmo passo até você pedir.
