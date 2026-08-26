# Spec · F7-08 · Odontograma em formato de cruz

| Campo            | Valor                                              |
| ---------------- | -------------------------------------------------- |
| **Status**       | draft                                              |
| **Data**         | 2026-08-25                                         |
| **Slug**         | f7-08-odontograma-cruz                             |
| **Plano origem** | `docs/plans/plano-F7.md` · Passo 3                 |
| **Fase**         | 7 de `docs/PLANO.md`                               |
| **Spec pai**     | `specs/2026-08-25-fase-7-ajustes-demo-felipe.md`   |
| **PRD vault**    | `prd-mvp.md` (revisão 2026-08-25)                  |

---

## 1. Contexto

A Fase 3 entregou odontograma com numeração **FDI**, um achado por **paciente + dente + face**, paleta de condições e layouts separados de mesa e celular (zoom e toque). A interface atual é uma **grade de botões numerados**, não o desenho que o Felipe usa no consultório.

Na demo de 2026-08-25 ele pediu o odontograma em **formato de cruz**, igual ao papel/referência da clínica. Sem a cruz, o dentista não reconhece o mapa no dia a dia.

Esta spec cobre **apenas F7-08**: a **aparência e as áreas de toque**. O que já está gravado (dente, face, condição) **permanece**. Não inclui busca no histórico, anamnese papel, WhatsApp nem card clínico.

**Pré-requisito:** odontograma da Fase 3 no `main` (achados FDI, confirmar ao salvar, quem pode ver e alterar).

**Referência visual obrigatória:** `docs/assets/odontograma-formato-cruz.png`.

---

## 2. Objetivo

Substituir o mapa em grade pelo **odontograma em cruz** da referência: arco superior e inferior, direita e esquerda **do paciente**, números FDI na cruz, **três vistas empilhadas por dente**, faces tocáveis na vista oclusal/incisal, usável no celular com zoom e rolagem.

**Valor entregue:** o dentista marca o dente e a face no mesmo desenho que já conhece no papel, sem perder os achados já salvos.

---

## 3. Atores

| Ator             | Interesse |
| ---------------- | --------- |
| Dentista         | Ler e marcar achados no formato de cruz, no celular e na mesa |
| Recepção         | Mesma leitura e, se precisar, a mesma escrita já permitida na Fase 3 |
| Administrador    | Mesma leitura e escrita, para suporte |
| Visualizador     | Sem conteúdo clínico; **não** vê odontograma |
| Auxiliar de sala | Sem módulo de pacientes; fora desta feature |
| Paciente         | Não usa esta tela |

---

## 4. Modelo de domínio

### 4.1 O que não muda

O **achado odontológico** continua:

- um registro por combinação **paciente + dente + face**;
- dente em numeração **FDI** (11 a 48, dentição permanente);
- faces já existentes: vestibular, lingual, palatina, mesial, distal, oclusal, incisal;
- condições já existentes: saudável, cárie, restauração, ausente, tratamento indicado (rótulos e cores atuais);
- salvar **ao confirmar** dente + face + condição;
- histórico fino por dente na trilha de auditoria, sem novo histórico paralelo.

Esta feature **não** cria dente decíduo, **não** cria novo código de condição, **não** junta faces num único registro “dente inteiro”.

### 4.2 A cruz (orientação)

O mapa é uma **cruz**, como quem olha o paciente de frente:

| Eixo | Significado |
| ---- | ----------- |
| Linha horizontal | Arco **superior** (acima) versus arco **inferior** (abaixo) |
| Linha vertical | **Direita do paciente** (à esquerda de quem olha a tela) versus **esquerda do paciente** (à direita de quem olha a tela) |

Números FDI **colados na cruz**, nos quatro quadrantes:

| Quadrante (do paciente) | Sequência (do terceiro molar para o incisivo central, ou o inverso conforme a referência) |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| Superior direito        | **18 · 17 · 16 · 15 · 14 · 13 · 12 · 11** (18 no extremo, 11 junto à linha vertical) |
| Superior esquerdo       | **21 · 22 · 23 · 24 · 25 · 26 · 27 · 28** (21 junto à linha vertical, 28 no extremo) |
| Inferior direito        | **48 · 47 · 46 · 45 · 44 · 43 · 42 · 41** (48 no extremo, 41 junto à linha vertical) |
| Inferior esquerdo       | **31 · 32 · 33 · 34 · 35 · 36 · 37 · 38** (31 junto à linha vertical, 38 no extremo) |

A grade atual (quatro fileiras de botões 11–18, 21–28, …) **sai**. Os 32 dentes permanentes continuam; só muda o arranjo.

### 4.3 Três vistas por dente

Cada dente tem **três vistas empilhadas**. O empilhamento e o desenho seguem a imagem de referência (não precisa ser ilustração fotorealista; precisa ser **reconhecível** frente ao PNG):

| Vista | Papel |
| ----- | ----- |
| **Raiz** | Silhueta da raiz (e coroa anatômica, se a referência mostrar). Raízes apontam **para fora** da cruz: superior para cima, inferior para baixo. |
| **Coroa** | Vista facial simplificada da coroa, mais próxima da cruz do que a raiz, conforme a referência. |
| **Oclusal / incisal** | Esquema visto de cima (ou da borda incisal nos anteriores), **dividido em faces** (centro + quatro lados). |

Dentes posteriores usam vista **oclusal** (centro = oclusal). Dentes anteriores usam vista **incisal** (centro = incisal). Arco superior: face palatina no lado lingual do esquema. Arco inferior: face lingual. A persistência continua aceitando o conjunto de faces já existente; a interface **mostra** a face adequada à posição do dente.

### 4.4 Seleção e cor

- Tocar uma **face** na vista oclusal/incisal seleciona **aquele dente + aquela face**.
- Tocar a vista de raiz ou de coroa seleciona o **dente** (a face pode permanecer a última escolhida na oclusal, ou o clínico escolhe a face no painel, como hoje).
- Cada **face** mostra a cor da condição vigente daquele par dente+face. Face sem achado: cor neutra (sem condição).
- Dente selecionado: destaque visível (anel ou equivalente), sem depender só da cor da condição.
- Paleta e painel de condição: os mesmos rótulos da Fase 3. Confirmar grava como hoje.

Não é obrigatório pintar a raiz com a mesma regra da face; o essencial é a **face oclusal/incisal** refletir o achado daquela face.

### 4.5 Mesa e celular

| Superfície | Comportamento |
| ---------- | ------------- |
| Mesa | Cruz completa visível (ou com rolagem leve se a janela for baixa). Faces clicáveis. |
| Celular | **Mesmo domínio visual** (cruz, três vistas, FDI). **Zoom** e **rolagem** (pan). Não esmagar as faces. Alvo de toque de cada face **≥ 44 px** no nível de zoom de trabalho (zoom inicial ou controles +/− já existentes na Fase 3). Painel de face/condição permanece acessível ao polegar (inferior). |

Quem só lê (sem escrita): vê a cruz e as cores; **não** confirma achado.

---

## 5. Matriz de acesso

Igual à Fase 3 para odontograma.

| Ação                                      | admin | dentist | reception | viewer | auxiliar |
| ----------------------------------------- | :---: | :-----: | :-------: | :----: | :------: |
| Ver o odontograma em cruz e as cores      |  Sim  |   Sim   |    Sim    |  Não   |   Não    |
| Selecionar dente/face e confirmar achado  |  Sim  |   Sim   |    Sim    |  Não   |   Não    |

A recusa vale na interface **e** no servidor. Falha segura: visualizador não recebe achados; papel sem escrita não grava.

Auditoria de **leitura** da ficha já existe. Confirmar achado continua gerando **escrita** como hoje (identificadores de paciente, dente e face; **sem** narrativa clínica extra).

---

## 6. Escopo funcional

### 6.1 Aba Odontograma

Na ficha, a aba **Odontograma** deixa de mostrar a grade de botões e passa a mostrar a cruz §4.2–§4.3.

Título visível em pt-BR (ex.: `Odontograma`). Sem travessão.

Abaixo ou junto da cruz, o painel já conhecido:

- dente selecionado (número FDI);
- face selecionada;
- condição;
- botão **Confirmar achado** (mínimo 44×44 px) para quem escreve.

Copy de espera quando nada está selecionado: no sentido de tocar um dente ou uma face.

### 6.2 Gravar

1. Clínico toca a face (ou o dente e depois a face).
2. Escolhe a condição.
3. Aciona **Confirmar achado**.
4. Sistema valida permissão, dente FDI e face, como hoje.
5. Persiste o achado daquele par dente+face (cria ou atualiza).
6. A cruz **atualiza a cor da face** sem perder o restante do mapa.
7. Recarregar a ficha: os achados anteriores e o novo permanecem, agora no desenho em cruz.

### 6.3 Achados já existentes

Paciente que já tem achados na grade antiga: ao abrir a cruz, cada par dente+face aparece na face correspondente. Nenhum dado é apagado ou migrado para outro formato.

### 6.4 Copy (pt-BR)

Exemplos aceitos (sem travessão):

- Título: `Odontograma`
- Espera: `Toque um dente ou uma face para registrar o achado.`
- Painel: `Dente selecionado` / `Face` / `Condição`
- Botão: `Confirmar achado`
- Sucesso: `Achado odontológico salvo` (já existente; manter)
- Sem permissão de escrita: cruz visível, sem confirmar (comportamento atual)
- Dente inválido: `Dente inválido. Use numeração FDI (11 a 48).` (já existente)

Rótulos de face na interface em pt-BR (os mesmos termos clínicos já usados, ou equivalentes curtos na vista oclusal).

---

## 7. Fora de escopo

- F7-01 a F7-07, F7-09.
- Mudar persistência, códigos de condição ou conjunto de faces.
- Dentição decídua, implante como tipo novo, periodontograma, foto intraoral no mapa.
- Biblioteca nova de odontograma (desenhar no stack atual).
- Pixel-perfect fotorealista; o contrato é **reconhecível** versus o PNG.
- Apertar validação “face X só no dente Y” de modo a recusar achados antigos.
- Playwright.
- Fechamento documental da Fase 7 inteira.

---

## 8. Fluxos

### 8.1 Caminho feliz · Marcar face na cruz (mesa)

1. Dentista autentica, abre a ficha e a aba **Odontograma**.
2. Vê a cruz: superior/inferior, direita/esquerda do paciente, números 18–11, 21–28, 48–41, 31–38 na cruz, três vistas por dente.
3. Toca a face oclusal (ou a face escolhida) do **dente 24**.
4. Escolhe condição **Cárie** (ou outra da paleta) e aciona **Confirmar achado**.
5. Sistema confirma o salvamento. A face do 24 mostra a cor da condição.
6. Recarrega a ficha: o achado permanece na mesma face do 24.

**Pronto quando este fluxo passa** e a cruz é reconhecível frente a `docs/assets/odontograma-formato-cruz.png`.

### 8.2 Caminho feliz · Celular com zoom

1. Dentista abre a mesma aba no viewport estreito (ou celular).
2. A cruz não esmaga as faces: há zoom e rolagem.
3. Depois de aproximar, toca uma face (alvo ≥ 44 px no zoom de trabalho), confirma o achado.
4. O painel inferior continua alcançável com o polegar.

### 8.3 Caminho feliz · Achado antigo aparece na cruz

1. Paciente já tinha achado (ex.: restauração no 36, face oclusal) gravado na Fase 3.
2. Abre a aba: a face correspondente no 36 está na cor de restauração. Nada foi apagado.

### 8.4 Caminho feliz · Recepção escreve (como hoje)

1. Recepção com permissão de escrita da Fase 3 seleciona dente/face e confirma.
2. O achado grava. Visualizador **não** vê a aba.

### 8.5 Caminho feliz · Só leitura clínica

1. Papel que lê e **não** escreve (se no futuro houver; hoje recepção escreve): vê cores, não confirma.
2. Na prática atual: recepção, dentista e admin escrevem; visualizador não vê o mapa.

### 8.6 Caminho feliz · Trocar condição da mesma face

1. Face já com cárie.
2. Seleciona a mesma face, escolhe restauração, confirma.
3. A cor passa a restauração (atualiza o mesmo achado).

---

## 9. Erros, bordas e mitigações

| Situação | Comportamento esperado | Mitigação |
| -------- | ---------------------- | --------- |
| Visualizador tenta ver achados | Não recebe o mapa clínico | Matriz §5; fail secure |
| Papel sem escrita tenta confirmar | Recusa no servidor | Já existe na Fase 3 |
| Sessão expirada ao confirmar | Volta ao login; achado não grava | Comportamento atual |
| Dente fora de 11–48 | Recusa; mensagem já existente | Validação de domínio intacta |
| Face inválida | Recusa; mensagem já existente | Idem |
| Confirmar sem dente/face | Botão inativo ou recusa | Igual espírito da UI atual |
| Dois toques rápidos em faces diferentes | A seleção visível é a última; grava só ao confirmar | Não gravar no mero toque |
| Achado em face palatina num inferior (dado antigo) | Continua gravado; a nova UI privilegia lingual no inferior para **novos** toques | Não migrar nem apagar |
| Cruz ilegível no celular | Zoom + rolagem; alvos ≥ 44 px no zoom de trabalho | Risco do plano |
| Arquivo único passar de ~300 linhas | Extrair o desenho da cruz e as vistas do dente em arquivos do mesmo domínio | Risco do plano |
| Falha ao salvar | Mensagem amigável; seleção local permanece para nova tentativa | Não limpar a cruz |
| Logs / Sentry | Sem PHI além de identificadores já usados (paciente, dente, face) | Auditoria atual |
| Comparar com o PNG | Homologação visual: quadrantes, números, três vistas, raízes para fora | §10 qualidade |

---

## 10. Critérios de Done

### Obrigatórios (DoD)

- [ ] Caminho feliz §8.1: cruz visível; marcar face do dente 24; recarregar e o achado permanece.
- [ ] Caminho §8.2: viewport estreito com zoom/rolagem; face tocável no zoom de trabalho (≥ 44 px).
- [ ] Caminho §8.3: achados antigos aparecem nas faces certas, sem migration de dado.
- [ ] Caminho §8.6: atualizar condição da mesma face.
- [ ] Orientação §4.2: direita do paciente à esquerda da tela; sequências 18–11, 21–28, 48–41, 31–38.
- [ ] Três vistas por dente (raiz, coroa, oclusal/incisal) reconhecíveis versus o PNG.
- [ ] Persistência e paleta **iguais** à Fase 3; nenhuma migration de schema.
- [ ] Matriz §5 na interface e no servidor.
- [ ] Regra de domínio (Vitest) da **disposição da cruz**: quadrantes, ordem FDI, qual arco é palatina vs lingual e oclusal vs incisal (funções puras de layout). Validação FDI/face/condição existente permanece verde.
- [ ] Autorização de escrita revalidada; políticas de acesso intactas.
- [ ] `npm run lint`, `npm run format:check`, `npm run build`, `npm run test` passam.
- [ ] Checklist aplicável de `docs/SECURITY.md`: autorização no servidor, fail secure, sem PHI extra em logs, sem segredo no cliente.
- [ ] Copy pt-BR; sem travessão em textos novos.
- [ ] Nenhum arquivo fora do escopo §11.
- [ ] Arquivos novos ≤ ~300 linhas (cruz e vistas extraídas se o mapa crescer).
- [ ] `docs/state/PENDENCIAS.md`: item **F7-08** marcado como implementado; homologação em dispositivo real, se pendente, na seção de homologação.

### Qualidade

- [ ] Cruz reconhecível ao lado de `docs/assets/odontograma-formato-cruz.png` (mesa).
- [ ] Celular: não esmagar faces; zoom/pan da Fase 3 reaproveitados ou equivalentes.
- [ ] Painel de confirmação alcançável com o polegar.
- [ ] Dente selecionado distinguível das cores de condição.

### Explicitamente **não** exigido nesta spec

- Homologação `manual-report` completa.
- iPhone e Android reais (ficam no fechamento da Fase 7; viewport estreito nesta fatia basta, além da mesa).
- Desenho anatômico de livro-texto; silhuetas e esquema de faces bastam se a cruz bater com a referência.
- Docs `docs/implementation/F7-*.md` e capítulo `docs/manual-dev/` da Fase 7 inteira (só no fechamento da fase). Registro curto desta fatia é permitido se o fluxo de close-phase da fatia já estiver em uso, mas **não** fecha a Fase 7.
- Cobertura 80% global do repositório (domínio de layout + testes já existentes de FDI).

---

## 11. Escopo de arquivos permitidos

Implementação **somente** nos paths abaixo. Qualquer outro arquivo exige atualização desta spec.

### Criar

| Arquivo | Motivo |
| ------- | ------ |
| `specs/2026-08-25-f7-08-odontograma-cruz.md` | Esta spec |
| `src/features/records/domain/odontogram-cross.ts` | Layout puro: quadrantes, ordem FDI, arco, oclusal vs incisal, palatina vs lingual |
| `src/features/records/domain/odontogram-cross.test.ts` | Testes da disposição e da orientação (paciente vs tela) |
| `src/features/records/components/odontogram-cross.tsx` | Desenho compartilhado da cruz (mesa e celular) |
| `src/features/records/components/tooth-views.tsx` | Três vistas e faces tocáveis de um dente |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/features/records/components/odontogram.tsx` | Passar a usar a cruz no desktop; painel de confirmar permanece |
| `src/features/records/components/odontogram-mobile.tsx` | Mesma cruz + zoom/rolagem; alvos ≥ 44 px |
| `src/features/records/components/patient-chart.tsx` | Só se o encaixe da aba exigir ajuste mínimo de layout |
| `src/features/records/domain/tooth-fdi.ts` | **Somente** se um helper mínimo de face por dente for mais claro aqui do que em `odontogram-cross.ts`; sem apertar validação de achados antigos |
| `docs/state/PENDENCIAS.md` | Marcar F7-08 após o código (não nesta spec draft) |

### Proibido alterar nesta feature

- `src/features/records/actions.ts` e `schemas.ts`, **salvo** se o confirmar da cruz reutilizar a mesma escrita já existente sem mudar o contrato (dente, face, condição). Não criar nova action se a atual serve.
- Anamnese, evolução, busca (F7-02), card, cadastro, WhatsApp, estoque, fila, lembretes.
- `supabase/migrations/**` (nenhuma migration nova ou antiga).
- `.env.local`, secrets, `docs/SECURITY.md`.
- Spec pai da Fase 7, salvo pedido explícito.
- Arquivos de F7-01 a F7-07 e F7-09.
- Dependência nova de odontograma de terceiro.

---

## 12. Decisões fechadas nesta spec

| # | Decisão |
| - | ------- |
| 1 | Só muda **UI e área de toque**; persistência igual à Fase 3 |
| 2 | Cruz: horizontal = superior/inferior; vertical = direita/esquerda **do paciente** |
| 3 | Direita do paciente = esquerda da tela (vista de frente) |
| 4 | Quadrantes: 18–11, 21–28, 48–41, 31–38 na cruz |
| 5 | Três vistas empilhadas: raiz, coroa, oclusal/incisal |
| 6 | Face tocável na vista oclusal/incisal; cor por face |
| 7 | Paleta e “salvar ao confirmar” permanecem |
| 8 | Sem dente decíduo e sem novo código de condição |
| 9 | Sem migration; achados antigos só se reexibem |
| 10 | Mesa e celular compartilham o mesmo desenho de cruz |
| 11 | Celular: zoom/rolagem; faces ≥ 44 px no zoom de trabalho |
| 12 | Reconhecível vs o PNG; não fotorealista |
| 13 | Sem biblioteca nova de odontograma |
| 14 | Quem escreve = quem já altera odontograma (admin, dentista, recepção) |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Cruz ilegível no celular | Zoom/rolagem; alvos ≥ 44 px; §8.2 no DoD |
| Arquivo passar de 300 linhas | Extrair cruz e vistas §11 |
| Confundir esquerda/direita | Orientação do paciente na spec e teste de layout §4.2 |
| Apagar achados antigos ao redesenhar | Sem migration; §8.3 no DoD |
| Pintar o dente inteiro e esconder a face | Cor **por face** na oclusal/incisal §4.4 |
| Escopo inflar para periodontograma / decíduos | Fora de escopo §7 |
| Pixel-perfect atrasar a fatia | Contrato = reconhecível vs PNG, não vetor médico |

---

## 14. Referências

- Plano: `docs/plans/plano-F7.md` · Passo 3 · F7-08
- Spec pai: `specs/2026-08-25-fase-7-ajustes-demo-felipe.md` § F7-08
- Spec F3: `specs/2026-08-18-fase-3-pacientes-prontuario.md` §4.4 e §6.6 (achado FDI, mesa/celular)
- Imagem: `docs/assets/odontograma-formato-cruz.png`
- `docs/SECURITY.md` · PHI, auditoria, fail secure
- `docs/state/PENDENCIAS.md` · F7-08
- Ata vault: `10 Dev/Clientes/clinica-neo-roma-dev/Reunioes/2026-08-25-apresentacao-felipe-feedback.md`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Próximo passo após aprovação explícita desta spec:** implementar **somente F7-08** na branch `feature/fase-7-ajustes-demo-felipe`, sem F7-03 no mesmo passo até você pedir.
