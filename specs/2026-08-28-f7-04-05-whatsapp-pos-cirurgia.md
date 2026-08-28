# Spec · F7-04 + F7-05 · WhatsApp ao paciente e aba pós-cirurgia

| Campo            | Valor                                            |
| ---------------- | ------------------------------------------------ |
| **Status**       | draft                                            |
| **Data**         | 2026-08-28                                       |
| **Slug**         | f7-04-05-whatsapp-pos-cirurgia                   |
| **Plano origem** | `docs/plans/plano-F7.md` · Passo 5               |
| **Fase**         | 7 de `docs/PLANO.md`                             |
| **Spec pai**     | `specs/2026-08-25-fase-7-ajustes-demo-felipe.md` |
| **PRD vault**    | `prd-mvp.md` (revisão 2026-08-25) · D20, D21     |

---

## 1. Contexto

A demo de 2026-08-25 fechou que **automações para o paciente usam WhatsApp**, não e-mail. O dentista precisa mandar orientação **pós-cirurgia** em texto livre e a recepção precisa mandar o **link do questionário** de pré-consulta pelo mesmo canal. O lembrete da Fase 6 continua só para o **dentista**, por e-mail.

Hoje o cadastro já guarda telefone do paciente e segundo telefone do parente (F7-07). A anamnese isolada já gera um link **copiável** (F7-03). Não há canal de saída ao paciente neste sistema: a equipe copia, cola no WhatsApp pessoal e não fica rastro de quem enviou.

O inbox e o bot **não** entram neste repositório (DeskcommCRM). Esta fatia só **dispara**.

O canal técnico do piloto já está decidido no vault: **WhatsApp Web da clínica** num processo que fica ligado (máquina no Brasil). O aplicativo da clínica continua onde já está. A máquina **já foi comprada**; o gateway **ainda pode estar fora do ar** quando o código entrar. Com o canal desligado ou sem configuração, o sistema **não dispara** e avisa na tela, no mesmo espírito do e-mail do financeiro vazio.

Esta spec cobre **F7-04 e F7-05 juntas**. São o mesmo assunto: um canal e as duas telas que o usam. Não implementar em paralelo em fatias separadas.

**Pré-requisito:** F7-07 (dois telefones) e F7-03 (link de anamnese copiável) em código. F7-06 (e-mail financeiro) **não** bloqueia.

---

## 2. Objetivo

Dar à equipe um **canal único de WhatsApp da clínica** para o paciente (ou o parente) e duas ações visíveis:

1. **Aba pós-cirurgia:** texto livre, destino visível, enviar, histórico do que saiu.
2. **Anamnese pré-consulta:** além de copiar o link, **enviar o link por WhatsApp**. O convite de tablet **não** dispara.

**Valor entregue:** o dentista manda a orientação pelo número da clínica, com registro na ficha; a recepção manda o questionário sem depender do WhatsApp pessoal; se o canal ainda não estiver no ar, o restante do prontuário não quebra.

---

## 3. Atores

| Ator            | Interesse |
| --------------- | --------- |
| Dentista        | Escrever e enviar a orientação pós-cirurgia; ver se chegou a sair |
| Recepção        | Enviar o link do questionário; em apoio, enviar pós-cirurgia se o dentista pedir |
| Administrador   | Mesmas ações; configurar o canal no ambiente |
| Paciente        | Recebe no WhatsApp; **não** usa esta tela |
| Parente         | Recebe se o destino for o segundo telefone |
| Visualizador    | Vê a ficha cadastral; **não** vê abas clínicas nem envia |
| Auxiliar de sala | Sem módulo de pacientes; fora desta feature |
| Inbox da recepção | Fora deste repositório |

---

## 4. Modelo de domínio

### 4.1 Canal da clínica

O sistema fala com **um** número de WhatsApp da **clínica** (nunca o pessoal do dentista). Esse número vive num processo separado que precisa estar ligado. O aplicativo só envia texto. **Não** lê conversa, **não** mostra inbox, **não** responde o paciente.

Configuração do canal: endereço do gateway, chave e nome da sessão, **só no ambiente**. Sem tela de configurações nesta fatia. Sem prefixo público de variável de ambiente para a chave.

| Canal | Comportamento |
| ----- | ------------- |
| Ausente (faltou endereço, chave ou sessão) | **Não dispara.** Botões de envio desabilitados. Aviso claro. Não chama o gateway. |
| Presente | Tentativa imediata de envio. A equipe vê o resultado na mesma tela. |

Se o canal estiver configurado e o gateway recusar ou estiver fora, o envio **falha** com mensagem genérica. A equipe pode tentar de novo. Não há rotina periódica silenciosa nesta fatia (é ação da pessoa na ficha, não job de estoque).

Tela de QR para reconectar a sessão e confirmação de entrega (tiques) **ficam fora**. Reconectar é operação da máquina. O sistema só diz se **este** disparo saiu ou não.

### 4.2 Destino

Não existe marca “este paciente tem WhatsApp”. O destino é o primeiro número **aproveitável**:

1. **Telefone** do cadastro, se der para virar um destino de WhatsApp.
2. Senão, **segundo telefone**, se der.
3. Senão, **sem destino:** botão desabilitado e aviso.

Os dois números podem existir. Só o primeiro aproveitável é usado. A equipe **vê** qual número vai receber (e, se for o segundo, a observação: filho, esposa, cuidador), para não mandar orientação clínica no número errado sem perceber.

Não há escolha manual de destino nesta fatia. Trocar o número é editar o cadastro.

### 4.3 Número aproveitável (Brasil)

Os telefones do cadastro são texto livre (F7-07). O WhatsApp precisa de um número nacional brasileiro utilizável.

Regras:

- Considerar só os **dígitos**.
- **10 ou 11 dígitos:** DDD + número local. Completar com o código do país **55**.
- **12 ou 13 dígitos começando com 55:** já está no formato nacional; usar assim.
- Qualquer outro tamanho ou conjunto de dígitos: **não aproveitável**.

Exemplos:

| Cadastro | Destino |
| -------- | ------- |
| `11999990001` (seed da Maria) | aproveitável (celular com DDD 11) |
| `(11) 99999-0001` | igual, depois de limpar |
| `5511999990001` | aproveitável |
| vazio, `123`, só DDD | não aproveitável |

Não inventar DDD. Não completar 8 dígitos “porque a clínica é em São Paulo”. Número de telefone fixo com 10 dígitos conta como aproveitável na regra; se o WhatsApp recusar na hora do envio, o registro fica **falhou**.

### 4.4 Registro de envio

Cada tentativa de disparo vira um **registro na ficha** daquele paciente:

- **Finalidade:** pós-cirurgia ou convite de anamnese.
- **Destino** usado (número já normalizado para envio).
- **Qual contato:** telefone do paciente ou segundo telefone.
- **Corpo** que saiu (texto livre ou texto fixo do convite). Visível **só** na ficha para quem já lê o prontuário.
- **Situação:** pendente (enquanto o envio está em curso na tela), enviado, falhou.
- **Quem** enviou, **quando** tentou, e quando concluiu se enviado.
- Consulta vinculada **se** a ficha foi aberta a partir de uma consulta; senão, vazio.
- Erro **curto e genérico** se falhou (sem detalhe do gateway, sem corpo, sem chave).

Regras:

- Dois envios de propósito (segunda orientação, reenvio do link) geram **dois** registros. Não há “um por dia”.
- Clique duplo ou envio ainda em curso: **um** disparo só.
- Falha do canal **não** apaga o texto que a equipe digitou.
- Logs, monitoramento e resposta de rotina: destino **mascarado**, **sem** corpo, **sem** nome completo do paciente.

O registro de envio **não** é o lembrete pós-consulta do dentista. Não misturar os dois.

### 4.5 Pós-cirurgia

Nova aba na ficha, junto das abas clínicas.

- Área de texto **livre**. Sem modelo pronto nesta fatia.
- Vazio ou só espaços: **não envia**.
- Teto: **2.000** caracteres.
- Mostra o destino resolvido **antes** de enviar.
- Sem destino ou sem canal: botão **Enviar** desabilitado, com o motivo.
- Com destino e canal: envia o texto exatamente como está (depois de tirar espaços das pontas).
- Abaixo do compositor: lista dos envios **pós-cirurgia** daquele paciente (mais recente primeiro): quando, quem, destino, situação, corpo.

Não é evolução. Não grava no histórico de evoluções. Não anexa foto.

### 4.6 Convite de anamnese por WhatsApp

Só a finalidade **pré-consulta**. O convite de **consultório / tablet** continua só abrir ou copiar; **não** dispara WhatsApp.

Comportamento:

1. A equipe aciona **Enviar questionário por WhatsApp**.
2. Se não houver convite pré-consulta **aberto**, o sistema cria um (mesmas regras da F7-03: validade 7 dias, um aberto por finalidade, gerar de novo invalida o anterior).
3. Se já houver aberto, **reutiliza** o link atual (não invalida só para mandar).
4. Monta uma mensagem **fixa** (a equipe não edita o corpo nesta fatia) com o link e a validade.
5. Envia ao destino resolvido e grava o registro com finalidade convite.

**Copiar link** e **Gerar link pré-consulta** **permanecem**. Servem quando o canal está fora ou quando a família pede o texto para colar.

Texto fixo aceito (sem travessão):

`Olá. Segue o questionário de saúde da Clínica Neo Roma para preencher antes da consulta. Vale por 7 dias.`

Na linha seguinte, só o endereço do convite.

Sem CPF, sem prontuário, sem respostas. O primeiro nome do paciente **não** entra nesta fatia (evita corpo diferente por teste e reduz dado no WhatsApp além do necessário).

### 4.7 O que esta fatia não é

- Não é inbox, bot, conversa ou fila de atendimento no WhatsApp.
- Não é lembrete ao dentista.
- Não é e-mail ao paciente.
- Não é confirmação de consulta nem oferta da fila (a fila continua com link copiado na mão).
- Não é tela de QR, painel de sessão ou escolha de provedor na interface.

---

## 5. Matriz de acesso

| Ação | admin | reception | dentist | room_assistant | viewer | paciente |
| ---- | :---: | :-------: | :-----: | :------------: | :----: | :------: |
| Ver aba pós-cirurgia e histórico de envios da ficha | Sim | Sim | Sim | Não | Não | Não |
| Enviar pós-cirurgia | Sim | Sim | Sim | Não | Não | Não |
| Ver destino na aba Anamnese e enviar o questionário | Sim | Sim | Sim | Não | Não | Não |
| Gerar / copiar link (já existe) | Sim | Sim | Sim | Não | Não | Não |
| Abrir no tablet (já existe) | Sim | Sim | Sim | Não | Não | Não |
| Receber a mensagem no WhatsApp | Não | Não | Não | Não | Não | **Sim** (ou o parente) |
| Configurar o canal pela interface | Não | Não | Não | Não | Não | Não |

Quem envia é quem **já escreve** prontuário e já gera convite (F7-03). A recusa vale na interface **e** no servidor. Falha segura: visualizador e auxiliar não disparam.

Auditoria:

- Enviar: escrita (finalidade, paciente, destino mascarado, situação). **Sem** corpo nos metadados de log.
- Ver a aba faz parte da leitura de prontuário já auditada ao abrir a ficha. Sem segundo evento só por trocar de aba.

O disparo usa o canal no **servidor**. A chave do gateway **nunca** vai ao navegador.

---

## 6. Escopo funcional

### 6.1 Aba Pós-cirurgia

Quando a equipe com visão clínica abre a ficha:

- nova aba **Pós-cirurgia** (rótulo curto, alvo ≥ 44 px, rolagem horizontal das abas como hoje);
- compositor + destino + enviar;
- lista de envios daquela finalidade.

Papel sem visão clínica: a aba **não existe** (igual Odontograma e Evoluções).

Se a ficha veio de uma consulta, o envio guarda essa consulta. Se veio da lista de pacientes, o envio fica sem consulta.

### 6.2 Aba Anamnese

Permanece gerar link, copiar e abrir no tablet.

Acrescentar **Enviar questionário por WhatsApp** (alvo ≥ 44 px), visível para quem já gera convite.

Estados:

| Situação | Botão |
| -------- | ----- |
| Sem destino aproveitável | Desabilitado. Aviso: cadastre o telefone do paciente ou o segundo contato. |
| Canal ausente | Desabilitado. Aviso: WhatsApp da clínica indisponível. Copiar o link continua possível. |
| Destino e canal ok | Habilitado. Depois do envio, confirmação em pt-BR. |

Ajuda do link pré-consulta passa a admitir os dois caminhos: copiar **ou** enviar pelo WhatsApp da clínica.

### 6.3 Configuração de ambiente

Documentar no exemplo de ambiente (valores vazios, sem segredo real):

- endereço do gateway;
- chave do gateway;
- nome da sessão (com default documentado, ex.: sessão `default`).

Comentário: o processo 24h fica na máquina da clínica; o aplicativo só dispara. Número de **teste** primeiro. Não commitar chave, endereço interno nem número real.

Se qualquer um dos três faltar, o canal conta como **ausente** (§4.1).

### 6.4 Copy (pt-BR)

Exemplos aceitos (sem travessão):

- Aba: `Pós-cirurgia`
- Compositor: `Mensagem para o paciente`
- Destino paciente: `Será enviado para [número]`
- Destino parente: `Será enviado para [número] ([observação])`
- Sem destino: `Cadastre o telefone do paciente ou um segundo contato para enviar WhatsApp.`
- Canal ausente: `WhatsApp da clínica indisponível. Copie o link ou tente mais tarde.`
- Enviar: `Enviar WhatsApp`
- Enviar anamnese: `Enviar questionário por WhatsApp`
- Sucesso: `Mensagem enviada.`
- Sucesso anamnese: `Questionário enviado por WhatsApp.`
- Falha: `Não foi possível enviar a mensagem.`
- Texto vazio: `Escreva a mensagem antes de enviar.`
- Texto longo: `Mensagem muito longa.`
- Sem permissão: `Sem permissão para enviar WhatsApp.`
- Ajuda pré-consulta (atualizada): `Envie pelo WhatsApp da clínica ou copie o link. Vale por 7 dias.`
- Situação na lista: `Enviado` / `Falhou`
- Lista vazia: `Nenhuma mensagem pós-cirurgia enviada ainda.`

### 6.5 Seed e teste local

Não é obrigatório um seed de mensagem já enviada.

Para homologar o destino: **Maria Silva** do seed (`11999990001`) tem telefone aproveitável. Um paciente de desenvolvimento **sem** telefone e **sem** segundo telefone cobre o botão desabilitado.

Envio real depende do gateway e de um número de teste. Os testes automatizados cobrem destino, texto e recusa **sem** chamar a rede.

---

## 7. Fora de escopo

- Inbox, bot, conversa, webhook de mensagem recebida.
- Tela de QR, reconectar sessão, painel “WhatsApp desconectado”.
- Confirmação de entrega (tiques) além do “o gateway aceitou este disparo”.
- Rotina periódica de retentativa (a equipe tenta de novo na tela).
- Cloud API da Meta, Evolution, bridge DeskcommCRM (provedor do piloto: o gateway Web da clínica).
- Template rico de pós-cirurgia; escolha de destino na hora do envio.
- Enviar o convite de **tablet** por WhatsApp.
- Oferta da fila e lembrete do dentista por WhatsApp.
- E-mail ao paciente. Tela `/configuracoes`.
- Máscara de telefone no cadastro (continua texto livre; só o destino do envio normaliza).
- Campo “tem WhatsApp” no cadastro.
- F7-01, F7-02, F7-03 (questionário), F7-06, F7-07, F7-08, F7-09, salvo o botão novo na aba Anamnese.
- Fechamento documental da Fase 7 inteira.
- Playwright. Sobrescrever `.env.local`.
- Instalar o gateway na máquina (ops). Esta spec entrega o disparo no aplicativo.

---

## 8. Fluxos

### 8.1 Caminho feliz · Pós-cirurgia para o telefone do paciente

1. Canal configurado. Dentista autentica e abre a ficha da **Maria Silva**.
2. Aba **Pós-cirurgia**. Vê o destino no telefone dela (número do seed, já aproveitável).
3. Escreve um texto livre (ex.: cuidados com gelo e alimentação).
4. Envia. A tela confirma `Mensagem enviada.`
5. A lista mostra o envio: agora, o dentista, o destino, situação enviado, o mesmo texto.
6. Recarregar a ficha: o registro permanece.

**Pronto quando este fluxo passa** (em homologação com número de teste; em teste automatizado, o destino e a recusa bastam se o canal estiver ausente no ambiente de CI).

### 8.2 Caminho feliz · Pós-cirurgia para o segundo telefone

1. Paciente **sem** telefone aproveitável e **com** segundo telefone de parente (com observação `filho`).
2. A aba mostra que o envio vai para o segundo número e a observação.
3. Enviar conclui como no §8.1, registrado como segundo contato.

### 8.3 Caminho feliz · Questionário por WhatsApp

1. Recepção na ficha da Maria, aba Anamnese, aciona **Enviar questionário por WhatsApp**.
2. Um convite pré-consulta aberto passa a existir (ou o já aberto é reutilizado). Copiar link continua mostrando o mesmo endereço.
3. O WhatsApp da clínica recebe / o destino de teste recebe o texto fixo + o link.
4. Registro na ficha com finalidade convite. Situação enviado.
5. **Abrir no tablet** não dispara WhatsApp.

### 8.4 Caminho feliz · Canal ausente (máquina ainda sem gateway)

1. Ambiente sem endereço/chave/sessão (caso atual até a ops terminar).
2. Abrir pós-cirurgia e anamnese: botões de envio **desabilitados**, aviso de indisponível.
3. Copiar link pré-consulta **continua** funcionando (F7-03 intacta).
4. Nenhuma chamada ao gateway. Prontuário, estoque e agenda intactos.

### 8.5 Caminho feliz · Copiar link com canal no ar

1. Canal configurado. Recepção gera o link e copia, **sem** apertar enviar WhatsApp.
2. Nenhum registro de disparo. O convite existe como na F7-03.

### 8.6 Caminho feliz · Reenvio de propósito

1. Depois do §8.1, o dentista envia outra mensagem (retorno, dúvida da família).
2. Dois registros na lista, os dois enviados.

---

## 9. Erros, bordas e mitigações

| Situação | Comportamento esperado | Mitigação |
| -------- | ---------------------- | --------- |
| Sem telefone e sem segundo | Não envia; aviso de cadastro | §4.2 / §6.4 |
| Telefone lixo (`123`) e segundo válido | Usa o segundo | §4.2 / §4.3 |
| Telefone válido e segundo preenchido | Usa o **telefone** | Ordem §4.2 |
| Canal ausente | Não chama gateway; copiar link ok | §4.1 / §8.4 |
| Gateway fora ou recusa | Situação falhou; texto permanece; pode tentar de novo | §4.1 |
| Texto vazio / só espaços | Recusa na tela e no servidor | §4.5 |
| Mais de 2.000 caracteres | Recusa | §4.5 |
| Visualizador | Sem aba, sem ação | §5 |
| Sessão expirada | Não envia; fluxo atual de login | Comportamento atual |
| Clique duplo | Um disparo | §4.4 |
| Ficha sem consulta | Registro sem consulta | §6.1 |
| Enviar anamnese sem convite aberto | Cria o de pré-consulta e envia | §4.6 |
| Enviar anamnese com convite aberto | Reutiliza o link | §4.6 |
| Abrir no tablet | Sem WhatsApp | §4.6 / §7 |
| Logs / monitoramento | Sem corpo, destino mascarado | §4.4 |
| Travessão em copy nova | Proibido | §6.4 |
| Chave no navegador | Proibido | §5 / §11 |
| Misturar com lembrete do dentista | Proibido | §4.4 |
| Paciente responde no WhatsApp | Fora de escopo; a equipe não vê isso aqui | §7 |

---

## 10. Critérios de Done

### Obrigatórios (DoD)

- [ ] Caminho §8.1: destino no telefone do paciente; texto livre sai; registro permanece ao recarregar.
- [ ] Caminho §8.2: sem telefone aproveitável, usa o segundo e mostra a observação.
- [ ] Caminho §8.3: envia o questionário pré-consulta; tablet **não** envia; copiar link permanece.
- [ ] Caminho §8.4: canal ausente → nenhum disparo; F7-03 intacta.
- [ ] Caminhos §8.5 e §8.6: copiar sem registro; segundo envio de propósito gera segundo registro.
- [ ] Destino §4.2 e número §4.3 cobertos em regra de domínio (Vitest), incluindo o telefone da Maria do seed e os casos inválidos.
- [ ] Texto vazio, teto de 2.000 caracteres e recusa sem permissão cobertos na borda (teste sem rede).
- [ ] Canal ausente **não** chama o gateway (teste da regra).
- [ ] Corpo do convite: texto fixo + link; **sem** CPF; teto de copy em teste.
- [ ] Aba nova só para quem vê conteúdo clínico; envio só para quem já escreve prontuário; visualizador coberto na recusa.
- [ ] Registro com quem, quando, destino, finalidade, situação; **sem** corpo em log.
- [ ] Variáveis do canal documentadas no exemplo de ambiente, vazias, sem segredo.
- [ ] `npm run lint`, `npm run format:check`, `npm run build`, `npm run test` passam.
- [ ] Checklist aplicável de `docs/SECURITY.md`: autorização no servidor, fail secure, PHI fora de log, chave só no servidor, canal só no ambiente.
- [ ] Copy pt-BR; sem travessão em textos novos.
- [ ] Nenhum arquivo fora do escopo §11.
- [ ] Arquivos novos ≤ ~300 linhas. A ficha do paciente **não** cresce: extrair o bloco de convite e a aba nova.
- [ ] `docs/state/PENDENCIAS.md`: **F7-04** e **F7-05** marcados como implementados; homologação com número real e máquina no ar permanece na homologação da Fase 7. Ops da VPS **não** é item de código desta fatia.

### Qualidade

- [ ] Abas usáveis no celular (alvos ≥ 44 px, aba alcançável na rolagem).
- [ ] Destino legível **antes** de enviar (número + se é parente).
- [ ] Falha do envio **não** apaga o texto digitado.
- [ ] F7-03, F7-07 e o card da ficha continuam utilizáveis (regressão: gerar/copiar/tablet e segundo telefone).

### Explicitamente **não** exigido nesta spec

- Homologação `manual-report` completa.
- iPhone e Android reais (fechamento da Fase 7), salvo o caminho feliz com número de teste quando o gateway estiver no ar.
- Gateway instalado e sessão estável por 7 dias (ops).
- Tela de QR, webhook, inbox.
- Docs de fechamento da Fase 7 inteira. Registro curto desta fatia é permitido se o close-phase de fatia já estiver em uso.
- Cobertura 80% global do repositório (apenas domínio e borda tocados).
- Texto-padrão de pós-cirurgia pedido pelo Felipe (continua 100% livre).

---

## 11. Escopo de arquivos permitidos

Implementação **somente** nos paths abaixo. Qualquer outro arquivo exige atualização desta spec.

Linguagem de domínio nas seções 1 a 10. Paths, migration e variáveis aparecem **só** aqui (e na configuração §6.3).

### Criar

| Arquivo | Motivo |
| ------- | ------ |
| `specs/2026-08-28-f7-04-05-whatsapp-pos-cirurgia.md` | Esta spec |
| `src/features/records/domain/whatsapp-destination.ts` | Ordem do destino + número aproveitável no Brasil |
| `src/features/records/domain/whatsapp-destination.test.ts` | Vitest §4.2–4.3 (Maria do seed, parente, inválido) |
| `src/features/records/domain/patient-message.ts` | Finalidade, teto do texto, situação, recusas de corpo vazio |
| `src/features/records/domain/patient-message.test.ts` | Texto vazio, teto, copy do convite sem CPF |
| `src/lib/whatsapp/send-whatsapp.ts` | Adapter server-only: um provedor (gateway da clínica). Interface estável (`destino` + `texto`) |
| `src/lib/whatsapp/send-whatsapp.test.ts` | Canal ausente não chama rede; mascarar destino em qualquer log de teste |
| `src/features/records/lib/send-patient-whatsapp.ts` | Autorizar, resolver destino, gravar registro, chamar o adapter, devolver situação |
| `src/features/records/components/post-surgery-message.tsx` | Aba: compositor, destino, enviar, lista |
| `src/features/records/components/anamnesis-invite-actions.tsx` | Extrair o bloco de convite da ficha + botão de WhatsApp pré-consulta |
| `supabase/migrations/024_patient_messages_f7.sql` | Persistência do registro de envio, políticas de acesso (leitura/escrita clínica; sem acesso anônimo) |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/features/records/components/patient-chart.tsx` | Nova aba; usar o bloco extraído de convite; **não** crescer o arquivo |
| `src/features/records/actions.ts` | Enviar pós-cirurgia; enviar convite pré-consulta por WhatsApp |
| `src/features/records/schemas.ts` | Validação na borda do texto e do paciente |
| `src/features/records/queries.ts` | Destino na ficha; lista de envios pós-cirurgia |
| `src/features/records/permissions.ts` | Quem envia (espelho de quem já escreve prontuário / gera convite) |
| `src/features/records/domain/anamnesis-form-v2.ts` | Copy §6.4 do botão e da ajuda pré-consulta |
| `.env.example` | Documentar as três variáveis do canal, vazias |
| `src/lib/supabase/database.types.ts` | Regenerar após a migration `024` |
| `docs/SECURITY.md` | Superfície de disparo: chave no servidor, PHI fora de log, destino mascarado, sem inbox |
| `docs/state/PENDENCIAS.md` | Marcar F7-04 e F7-05 após o código (não nesta spec draft) |

### Permitido com restrição

| Arquivo | Restrição |
| ------- | --------- |
| `README.md` | **Só** a tabela de variáveis do canal. Sem reescrever o README. |
| `.cursor/rules/project-general.mdc` | **Só** reforçar: ClinRoma dispara; inbox fora. Sem reabrir F0–F6. |
| `AGENTS.md` | **Só** se o close-phase da fatia já atualizar a linha de WhatsApp; sem reescrever o arquivo. |
| `docs/manual-dev/14-fase-7-03-anamnese-isolada.md` | **Só** uma linha: o disparo do link é F7-04/F7-05, se o capítulo ainda disser que WhatsApp não existe. |

### Proibido alterar nesta feature

- Questionário papel, tokens, página pública `/anamnese/[token]` (regras F7-03 intactas, salvo o botão na ficha).
- Cadastro e regra do segundo telefone (`secondary-phone.ts`), salvo **ler** os campos já existentes.
- Lembretes (`src/features/reminders/**`) e avisos de estoque. **Não** reutilizar o canal reservado de lembrete ao dentista.
- Odontograma, transcrição, busca, card clínico (F7-09), e-mail financeiro.
- Fila, agenda, scan.
- `supabase/migrations/001` a `023`.
- Conteúdo extra em `024` além do registro de mensagem ao paciente.
- `.env.local`, secrets reais, número da clínica, endereço do gateway.
- Spec pai da Fase 7 e specs F7-01 a F7-03 / F7-06 a F7-09, salvo pedido explícito.
- Docs de fechamento da Fase 7 inteira.
- Inbox, webhook de recebimento, tela de QR.

---

## 12. Decisões fechadas nesta spec

| # | Decisão |
| - | ------- |
| 1 | **Uma** fatia: F7-04 + F7-05. Não paralelizar em dois PRs |
| 2 | Só **disparo**. Inbox/bot fora deste repositório |
| 3 | Provedor do piloto: **gateway Web da clínica** (decisão do vault). Interface de envio isolada para trocar depois se o gateway falhar |
| 4 | Canal ausente no ambiente = **não dispara** (código pode entrar antes da máquina ficar pronta) |
| 5 | Destino: telefone do paciente se aproveitável; senão segundo telefone; senão bloqueia. Sem flag “tem WhatsApp” |
| 6 | Número: dígitos + Brasil 55 conforme §4.3. Sem máscara no cadastro |
| 7 | Pós-cirurgia: **100% texto livre**. Sem modelo |
| 8 | Teto do texto: 2.000 caracteres |
| 9 | Link pré-consulta: **enviar por WhatsApp** + **copiar** continua. Tablet **não** dispara |
| 10 | Corpo do convite **fixo** + link. Sem nome e sem CPF |
| 11 | Resultado **na hora** na tela. Sem cron de retentativa nesta fatia |
| 12 | QR, webhook de status/entrega e inbox **fora** |
| 13 | Quem envia = quem já escreve prontuário (admin, dentista, recepção) |
| 14 | Corpo visível na ficha; **ausente** de log e monitoramento |
| 15 | Não misturar com lembrete do dentista |
| 16 | Migration incremental `024`; não editar `001`–`023` |
| 17 | Fechamento da Fase 7 inteira **não** entra nesta fatia |
| 18 | Ops da VPS (Docker, túnel, sessão de 7 dias) **não** é entrega de código desta spec |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Gateway ainda não instalado | Canal ausente = no-op visível §4.1 / §8.4 |
| Sessão WhatsApp cair no meio do dia | Falha genérica na tela; reconectar é ops §4.1 / §7 |
| Ban / termos da Meta (protocolo Web) | Número da **clínica**, teste primeiro; aceito no piloto (vault) |
| Telefone texto livre virar destino inválido | Regra §4.3 + recusa clara; seed da Maria coberto em teste |
| Mandar para o parente sem a equipe notar | Destino e observação visíveis **antes** de enviar §4.2 |
| PHI no log | Sem corpo; destino mascarado §4.4 / §9 |
| Escopo inflar para inbox ou QR | Fora §7; decisões 2 e 12 |
| Ficha do paciente passar de 300 linhas | Extrair convite e aba nova §11 |
| Timeout no disparo | Um envio em curso; falhou se não confirmar; texto permanece |
| Dois consumidores (aba + anamnese) no mesmo arquivo de ações | Adapter único; ações finas; arquivos ≤ 300 linhas |
| Túnel / acesso do aplicativo ao gateway | Variáveis só no ambiente; falha vira “indisponível”, não stack |
| Resposta do paciente no WhatsApp | Fora; copy não promete conversa |

---

## 14. Referências

- Plano: `docs/plans/plano-F7.md` · Passo 5 · F7-04 e F7-05
- Spec pai: `specs/2026-08-25-fase-7-ajustes-demo-felipe.md` § F7-04, F7-05
- Spec F7-03: `specs/2026-08-26-f7-03-anamnese-isolada.md` (link copiável; disparo ficava para cá)
- Spec F7-07: `specs/2026-08-25-f7-07-segundo-telefone.md` (telefone e segundo contato)
- Spec F6: `specs/2026-08-18-fase-6-lembrete-piloto.md` (lembrete é **dentista** / e-mail; não misturar)
- Spec F7-06: `specs/2026-08-26-f7-06-estoque-baixo-financeiro.md` (destino vazio = não dispara)
- `docs/SECURITY.md` · PHI, fail secure, segredos no ambiente
- `docs/state/PENDENCIAS.md` · F7-04, F7-05
- PRD vault: `prd-mvp.md` §3.7, §4.5, §7.9, D20, D21
- Arquitetura vault: `10 Dev/Clientes/clinica-neo-roma-dev/Projetos/operacional/arquitetura-solucao.md`
- VPS: `10 Dev/Referencias/2026-08-27-vps-compartilhada-processos-24h.md`
- Ata: `10 Dev/Clientes/clinica-neo-roma-dev/Reunioes/2026-08-25-apresentacao-felipe-feedback.md`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Próximo passo após aprovação explícita desta spec:** implementar **F7-04 e F7-05 juntas** na branch `feature/fase-7-ajustes-demo-felipe`, sem inbox, sem QR, sem fechar a Fase 7 no mesmo passo até você pedir.

Não implementar código enquanto esta spec estiver em **draft** sem o seu sim.
