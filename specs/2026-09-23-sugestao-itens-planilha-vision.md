# Spec · Sugestão de itens a partir da foto da planilha

| Campo            | Valor                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| **Status**       | draft                                                                 |
| **Data**         | 2026-09-23                                                            |
| **Slug**         | sugestao-itens-planilha-vision                                        |
| **Plano origem** | `docs/plans/plano-sugestao-itens-planilha-vision.md`                  |
| **Fase**         | Fatia sobre a Fase 5 (estoque). **Não** reabre nem fecha a fase.      |
| **Autonomia**    | medium                                                                |
| **Pré-requisito**| Registrar compra estável (foto histórica opcional + digitação + confirmação) |

---

## 1. Contexto

Em **Registrar compra**, a clínica fotografa a nota ou a planilha e digita cada linha. A foto histórica é só referência. O estoque, os pacotes e as etiquetas nascem somente quando a pessoa confirma a entrada.

Esta fatia acrescenta **Sugerir itens da foto**: o servidor lê a imagem, devolve linhas para o mesmo assistente e descarta o arquivo. A pessoa revisa. Só a confirmação da entrada cria insumo, pacote e etiqueta, com a regra que já existe.

A leitura **não** substitui a digitação. Se a foto não for lida, o caminho manual continua igual.

---

## 2. Objetivo

1. Quem já registra compra escolhe uma foto (JPEG, PNG ou WebP, até 10 MB) e aciona **Sugerir itens da foto**.
2. O servidor devolve linhas sugeridas (nome, quantidade por pacote, número de pacotes, lote, validade, unidade) e **não guarda** essa foto.
3. Cada linha é aproximada ao catálogo: confiança alta pré-seleciona um insumo existente; confiança baixa marca a linha como **novo**.
4. A pessoa edita, remove ou acrescenta linhas e só então confirma a entrada.
5. Pacotes e etiquetas seguem a regra atual: uma embalagem física = um pacote = uma etiqueta.
6. A confirmação deixa rastro de quem confirmou, quantas linhas vieram da leitura e quantas foram alteradas, e qual modelo leu a foto. Sem a imagem no rastro.

**Valor entregue:** menos digitação na entrada de material, com a pessoa no controle do que entra no estoque.

---

## 3. Atores

| Ator | Interesse |
| ---- | --------- |
| Administrador | Registrar compra, pedir sugestão, aceitar linha como insumo novo, confirmar entrada e gerar etiquetas |
| Auxiliar de sala | Registrar compra de insumo **já cadastrado**, pedir sugestão e confirmar entrada. Não cadastra insumo novo |
| Recepção | Vê saldos. Não registra compra e não pede sugestão |
| Dentista | Vê saldos. Não registra compra e não pede sugestão |
| Visualizador | Sem estoque |
| Paciente | Fora desta feature. A foto de compra não leva dado de paciente |

---

## 4. Modelo de domínio

### 4.1 Dois usos da foto

| Uso | O que a pessoa faz | O que o sistema faz com o arquivo |
| --- | ------------------ | --------------------------------- |
| Foto histórica (já existe) | Anexa a planilha como referência da compra, se quiser | Guarda a foto, como hoje. Passo opcional |
| Sugestão (novo) | Aciona **Sugerir itens da foto** | Lê a imagem, devolve linhas e descarta o arquivo. Não guarda em lugar nenhum nosso |

Escolher arquivo para sugerir **não** grava a foto histórica. Guardar referência continua sendo um passo próprio. A pessoa pode usar os dois, um só, ou nenhum. Compra sem foto histórica continua válida.

### 4.2 Linha sugerida

Cada linha devolvida pela leitura traz, quando a foto permitir:

| Campo | Significado |
| ----- | ----------- |
| Nome | Texto lido na nota ou planilha |
| Quantidade por pacote | Quanto cabe em uma embalagem |
| Número de pacotes | Quantas embalagens iguais entram. Cada uma vira um pacote e uma etiqueta |
| Lote | Opcional |
| Validade | Opcional. Só entra se for uma data reconhecível |
| Unidade sugerida | Uma das unidades do cadastro: unitário, caixa, rolo, frasco. Se não der para reconhecer, o campo fica para a pessoa escolher |

O saldo mínimo de um insumo novo **não** é inventado pela leitura. Quem cadastra informa o mínimo na revisão, como hoje.

Quantidade avulsa (fora de pacote) não vem da leitura. A pessoa ainda pode preenchê-la à mão no assistente.

### 4.3 Aproximação ao catálogo

Para cada nome lido, compara com os insumos já cadastrados (maiúsculas, acentos e espaços repetidos não contam como diferença).

| Resultado | O que a pessoa vê |
| --------- | ----------------- |
| Confiança alta | Um insumo existente pré-selecionado. Dá para trocar |
| Confiança baixa | Linha marcada como **novo**, com o nome lido. Dá para trocar para um insumo existente |

Confiança alta só quando há um candidato claramente melhor que os demais:

- o nome normalizado é igual ao do cadastro, ou
- o nome é parecido com um único insumo e fica distante do segundo colocado.

Confiança baixa quando não há candidato, a semelhança é fraca, ou dois insumos empatam. Empate nunca escolhe sozinho.

A pessoa sempre pode trocar o insumo, passar de existente para novo (se for administrador) ou o contrário.

### 4.4 Revisão obrigatória

A sugestão só preenche o assistente. Não cria insumo, não muda saldo, não cria pacote e não gera etiqueta.

**Confirmar entrada** continua sendo o único passo que grava a compra. Vale para linha sugerida, linha editada e linha digitada à mão. Sem linhas válidas, a confirmação não grava nada.

### 4.5 Quem pode aceitar insumo novo

| Papel | Linha casada com insumo existente | Linha marcada como novo |
| ----- | --------------------------------- | ----------------------- |
| Administrador | Pode confirmar | Pode confirmar, e aí o insumo nasce na entrada, como hoje |
| Auxiliar de sala | Pode confirmar | Não confirma como cadastro novo. Escolhe um insumo existente ou remove a linha |

### 4.6 Rastro da confirmação

Quando a entrada confirmada usou sugestão, o rastro operacional guarda:

- quem confirmou
- quantas linhas a leitura devolveu
- quantas foram mantidas, editadas, descartadas ou incluídas à mão
- qual modelo leu a foto

Não guarda a imagem, o conteúdo bruto da leitura nem dado de paciente.

Contagem:

| Situação | Conta como |
| -------- | ---------- |
| Linha sugerida confirmada sem mudar insumo, quantidade, pacotes, lote, validade nem unidade | Mantida |
| Linha sugerida com qualquer desses campos alterado | Editada |
| Linha sugerida removida antes de confirmar | Descartada |
| Linha que a pessoa acrescentou | Manual |

Entrada sem ter pedido sugestão não ganha esses contadores.

### 4.7 Limites da leitura

- Formatos: JPEG, PNG, WebP.
- Tamanho máximo: 10 MB, o mesmo da foto histórica.
- No máximo 40 linhas sugeridas. Se a leitura trouxer mais, ficam as 40 primeiras e a pessoa vê que o restante precisa ser digitado.
- A leitura só acontece ao acionar o botão. Não roda ao abrir a tela nem ao apenas escolher o arquivo.
- Enquanto lê, o botão não dispara de novo.
- A chave do serviço de leitura fica só no servidor. É a mesma já usada na transcrição de áudio. Esta fatia não altera a transcrição.

---

## 5. Matriz de acesso

| Papel | Ver estoque | Registrar compra | Sugerir itens da foto | Cadastrar insumo novo na confirmação |
| ----- | ----------- | ---------------- | --------------------- | ------------------------------------ |
| Administrador | sim | sim | sim | sim |
| Auxiliar de sala | sim | sim | sim | não |
| Recepção | sim | não | não | não |
| Dentista | sim | não | não | não |
| Visualizador | não | não | não | não |

Quem não registra compra recebe recusa no servidor, mesmo que a tela seja contornada.

---

## 6. Escopo funcional

### 6.1 Pedir sugestão

- No assistente **Registrar compra**, botão **Sugerir itens da foto**, utilizável no celular (alvo de toque grande, estado de espera visível).
- A pessoa escolhe a foto e aciona o botão. O arquivo vai ao servidor só para a leitura.
- Sucesso: as linhas do assistente são preenchidas com a sugestão e a confiança (alta com insumo pré-selecionado, ou baixa como novo). A pessoa segue para revisar.
- A foto desse pedido não é guardada. Ao terminar a leitura, o arquivo deixa de existir para o sistema.
- O passo **Foto da planilha (opcional)** permanece para quem quiser guardar referência. O texto deixa de dizer que não há leitura nenhuma: a sugestão existe, a confirmação humana continua obrigatória.

### 6.2 Revisar

- A pessoa edita qualquer campo, remove linha, troca existente/novo e acrescenta linha, como hoje.
- A revisão mostra quantos pacotes e quantas etiquetas a confirmação vai gerar.
- **Confirmar entrada** só grava depois dessa revisão.
- Auxiliar não conclui linha que ainda esteja como insumo novo.

### 6.3 Confirmar entrada

- Reutiliza a entrada atual: insumos (quando o administrador aceita novo), pacotes, etiquetas e saldo.
- Uma embalagem = um pacote = uma etiqueta.
- Falha na confirmação não grava entrada parcial sem o comportamento que a entrada já tem hoje.
- Rastro da seção 4.6 quando houve sugestão.

### 6.4 Quando a leitura não serve

- Arquivo grande, formato errado, leitura vazia, leitura incompreensível, demora excessiva ou falha do serviço: mensagem clara e o assistente segue vazio (ou como a pessoa já tinha digitado, se já havia linhas).
- Texto de falha, em pt-BR e sem travessão: **Não consegui ler a foto. Digite os itens manualmente.**
- Se a leitura trouxer mais de 40 linhas: usa as 40 primeiras e avisa que o restante é manual.
- Data, quantidade ou unidade inválidas não são inventadas: o campo fica para a pessoa preencher. A confirmação só aceita linha válida, como hoje.

### 6.5 Regras testáveis sem chamar o serviço de leitura

- Aproximação de nome: igualdade, um candidato claro, empate, sem candidato.
- Validação da leitura: descarta campo inválido, limita a 40 linhas, não aceita arquivo fora do tipo ou acima de 10 MB.
- A sugestão não grava estoque nem guarda a foto.
- Auxiliar não confirma insumo novo.

### 6.6 Documentação ao fechar a fatia

- Registro em `docs/implementation/`.
- Capítulo em `docs/manual-dev/`.
- Trecho de **Registrar compra** no manual do usuário (guia do módulo e o manual completo, se o mesmo passo estiver duplicado).
- `docs/state/PENDENCIAS.md`: plano deixa de estar “a aprovar”; homologação manual desta fatia listada se ainda estiver aberta.
- Índices de implementation e manual-dev.
- Roteiro da fixture atualizado: a foto de teste serve para sugerir, e a entrada ainda depende da revisão.
- Exemplo de ambiente: nome do modelo de leitura, reusando a chave que já existe. Sem criar segredo novo e sem alterar o arquivo secreto local.

### 6.7 Homologação sugerida

Com a fixture `docs/fixtures/planilha-compra-teste-clinroma.png` (roteiro atual: luva, gaze, anestésico):

- Pedir sugestão, revisar e confirmar gera os pacotes e as etiquetas **do que foi confirmado**, não do que a leitura errou.
- A foto usada só na sugestão não aparece como planilha histórica.
- Quem quiser, ainda anexa a foto histórica à parte.
- Papel sem permissão não sugere.
- Celular: botão e espera visíveis sem depender de passar o mouse.

O caso manual entra no relatório de testes (fluxo de estoque) quando o relatório for atualizado. Não substitui os testes automatizados da seção 6.5.

---

## 7. Fora de escopo

- Gravar estoque, pacote ou etiqueta só com a leitura, sem **Confirmar entrada**.
- Guardar a foto da sugestão (arquivo, histórico de compra ou rastro).
- Ler receita, prontuário, documento de identidade ou outro papel que não seja nota/planilha de compra.
- XML de nota fiscal, fornecedor ou sistema externo de compras.
- Trocar ou retreinar a transcrição de áudio.
- Modelo próprio ou outro fornecedor de leitura além do serviço já contratado para o áudio.
- Aplicativo nativo ou fila offline da sugestão.
- Mudar retirada por QR, saldo, alerta de estoque baixo ou a regra de uma embalagem por etiqueta.
- Fechar de novo a Fase 5.

---

## 8. Caminhos felizes

### 8.1 Administrador sugere, revisa e confirma

1. Abre Estoque e **Registrar compra**.
2. Escolhe a foto e aciona **Sugerir itens da foto**.
3. Vê espera e, em seguida, as linhas: existentes pré-selecionados quando a confiança é alta, novos quando é baixa.
4. Corrige o que precisar, inclusive mínimo do insumo novo.
5. Na revisão, confere a quantidade de pacotes e etiquetas.
6. Aciona **Confirmar entrada**.
7. O estoque muda só nessa confirmação. A folha de etiquetas abre como hoje.
8. A foto da sugestão não fica guardada. O rastro mostra quem confirmou e as contagens da seção 4.6.

### 8.2 Auxiliar confirma só insumos existentes

1. Auxiliar pede sugestão.
2. Linha de confiança alta vem com o insumo certo. Ele ajusta lote ou quantidade se precisar e confirma.
3. Linha marcada como novo: escolhe um insumo já cadastrado ou remove a linha.
4. A entrada gera pacotes só dos insumos existentes que ele confirmou.

### 8.3 Sugestão e foto histórica no mesmo registro

1. A pessoa guarda a foto da planilha no passo opcional de referência.
2. Em separado, pede sugestão (pode ser o mesmo arquivo de novo).
3. Revisa e confirma.
4. A referência histórica existe porque ela usou esse passo. A leitura da sugestão, por si, não criou essa referência.

### 8.4 Leitura falha e a digitação manual salva a compra

1. A pessoa pede sugestão e recebe **Não consegui ler a foto. Digite os itens manualmente.**
2. Digita as linhas como hoje e confirma.
3. Estoque e etiquetas seguem a confirmação. Nada foi gravado na tentativa de leitura.

### 8.5 Compra sem sugestão

1. A pessoa ignora **Sugerir itens da foto**.
2. Digita e confirma como hoje.
3. A entrada não ganha contadores de leitura.

---

## 9. Erros, bordas e mitigações

| Situação | Comportamento esperado | Mitigação |
| -------- | ---------------------- | --------- |
| Leitura inventa linha | A linha aparece na revisão; estoque não muda até confirmar | Confirmação humana obrigatória |
| Nome da nota diferente do cadastro | Confiança baixa, linha como novo; a pessoa troca | Aproximação + troca manual |
| Dois insumos com nome parecido | Confiança baixa; ninguém é escolhido no empate | Regra da seção 4.3 |
| Auxiliar deixa linha como insumo novo | Confirmação recusada; nada é cadastrado | Tela e servidor |
| Recepção, dentista ou visualizador pede sugestão | Recusa. Sem leitura e sem estoque | Matriz da seção 5 |
| Arquivo acima de 10 MB ou formato inválido | Recusa antes da leitura. Mensagem clara | Mesmo teto da foto histórica |
| Leitura vazia, timeout ou falha do serviço | Mensagem da seção 6.4. Assistente utilizável para digitar | Fallback manual |
| Data, quantidade ou unidade irreconhecível | Campo vazio para a pessoa. Sem número inventado | Validação na confirmação |
| Mais de 40 linhas | Primeiras 40 e aviso para digitar o resto | Teto da seção 4.7 |
| Pessoa dispara a sugestão duas vezes | Segunda espera a primeira acabar | Botão bloqueado durante a espera |
| Foto da sugestão parar em histórico ou rastro | Não acontece | Leitura sem guarda de arquivo |
| Confirmar sem nenhuma linha válida | Entrada não grava | Regra atual da confirmação |
| Custo da leitura | Só no botão, com teto de tamanho | Sem leitura automática |
| Dado de paciente na chamada de leitura | Fora. Só a imagem de compra | Sem prontuário neste fluxo |

---

## 10. Critérios de Done

### Obrigatórios

- [ ] Caminho §8.1: sugestão preenche o assistente; estoque, pacote e etiqueta só nascem em **Confirmar entrada**.
- [ ] Caminho §8.2: auxiliar confirma insumo existente e não cadastra insumo novo.
- [ ] Caminho §8.3: foto histórica só existe se a pessoa usar o passo de referência. Sugestão não guarda arquivo.
- [ ] Caminho §8.4: falha de leitura deixa digitar e confirmar como hoje.
- [ ] Caminho §8.5: compra sem sugestão permanece igual à atual, sem contadores de leitura.
- [ ] Matriz §5 na interface e no servidor.
- [ ] Aproximação de nome cobre igualdade, candidato único, empate e ausência de candidato (§4.3), com teste automatizado.
- [ ] Leitura inválida, arquivo inválido e teto de 40 linhas cobertos por teste, sem chamar o serviço externo.
- [ ] Rastro da §4.6 na confirmação que usou sugestão, sem imagem.
- [ ] Autorização recusada para quem não registra compra. Checklist aplicável de `docs/SECURITY.md`: revisão humana obrigatória, segredo só no servidor, sem gravar a foto da sugestão.
- [ ] `npm run lint`, `npm run format:check`, `npm run build` e `npm run test` passam.
- [ ] Copy pt-BR, sem travessão nos textos novos.
- [ ] Nenhum arquivo fora do §11, salvo esta spec se o escopo mudar com nova aprovação.
- [ ] Arquivo novo até cerca de 300 linhas. O assistente de compra já é longo: a sugestão entra em componente próprio, ligado por ele.
- [ ] Docs do §6.6 ao fechar a fatia.

### Qualidade

- [ ] Botão e espera utilizáveis no celular.
- [ ] Revisão mostra quantos pacotes e etiquetas serão gerados.
- [ ] Unidade fora de unitário, caixa, rolo e frasco não é chutada.

### Explicitamente não exigido nesta spec

- Fechar a Fase 5 de novo.
- Homologação manual completa de todo o estoque. O caso da fixture (§6.7) entra no relatório quando ele for atualizado; os testes automatizados não dependem de chamada real ao serviço de leitura.
- Cobertura global de 80% do repositório. Basta o domínio da aproximação, a validação da leitura e a recusa de insumo novo para o auxiliar.
- Persistir foto da sugestão “por segurança”.

---

## 11. Escopo de arquivos permitidos

Implementação **somente** nos caminhos abaixo. Qualquer outro arquivo exige atualizar esta spec e nova aprovação.

### Criar

| Arquivo | Motivo |
| ------- | ------ |
| `specs/2026-09-23-sugestao-itens-planilha-vision.md` | Esta spec |
| `src/lib/stock/extract-purchase-sheet.ts` | Leitura da imagem no servidor, validação do resultado, descarte do arquivo |
| `src/features/stock/domain/supply-name-match.ts` | Aproximação do nome ao catálogo |
| `src/features/stock/domain/supply-name-match.test.ts` | Casos da seção 4.3 |
| `src/features/stock/components/suggest-purchase-items.tsx` | Botão, espera, erro e preenchimento das linhas |
| Testes da validação da leitura e da recusa de insumo novo, em `src/features/stock/**` ou `src/lib/stock/**` | Seção 6.5 |
| `docs/implementation/F5-sugestao-planilha-vision.md` | Registro ao fechar (nome ajustável no índice) |
| `docs/manual-dev/22-sugestao-itens-planilha.md` | Como funciona (número ajustável se o índice exigir) |

### Alterar

| Arquivo | Motivo |
| ------- | ------ |
| `src/features/stock/components/stock-purchase-wizard.tsx` | Ligar o componente de sugestão e separar foto histórica de leitura |
| `src/features/stock/actions.ts` | Pedido de sugestão autenticado; contadores no rastro da confirmação |
| `src/features/stock/schemas.ts` | Formato aceito da leitura e da sugestão, sem gravar compra |
| `.env.example` | Nome do modelo de leitura, reusando a chave já documentada |
| `docs/state/PENDENCIAS.md` | Tirar o plano de “a aprovar”; listar homologação se ficar aberta |
| `docs/implementation/README.md` | Índice ao fechar |
| `docs/manual-dev/README.md` | Índice ao fechar |
| `docs/manual-usuario/03-guia-dos-modulos.md` | Passo Registrar compra |
| `docs/manual-usuario/MANUAL-COMPLETO.md` | O mesmo passo, se continuar duplicado |
| `docs/fixtures/ROTEIRO-registrar-compra.md` | Fixture passa a incluir sugestão com revisão |
| `docs/relatorio-testes-manuais.html` | Caso novo no fluxo de estoque, se o relatório for atualizado nesta fatia |
| `docs/SECURITY.md` | Opcional: uma frase de que a sugestão exige revisão e não guarda a foto |
| `docs/plans/plano-sugestao-itens-planilha-vision.md` | Opcional: marcar o plano alinhado a esta spec |

### Proibido nesta feature

- Nova migration, salvo se o rastro operacional atual não couber os contadores da seção 4.6. Nesse caso, parar e pedir aprovação antes de criar persistência nova.
- Endereço público novo para a leitura. O pedido entra pela mesma via de servidor já usada na compra.
- Guardar a foto da sugestão.
- Transcrição de áudio, agenda, prontuário, fila, scan de retirada, alerta financeiro.
- Dependência de outro fornecedor de leitura.
- Alterar `.env` ou segredo local sem confirmação explícita.
- Specs de outras fatias.

**Branch sugerida (após aprovação desta spec):** `feature/sugestao-itens-planilha-vision`.

---

## 12. Decisões fechadas nesta spec

Estas decisões interpretam o plano aprovado, inclusive as perguntas que o plano ainda listava em aberto. A aprovação desta spec as confirma.

| # | Decisão |
| - | ------- |
| 1 | A fatia entra no piloto. A leitura usa o serviço já contratado e a mesma chave da transcrição, só quando a pessoa pede |
| 2 | Quem sugere é quem já registra compra: administrador e auxiliar de sala |
| 3 | Insumo novo continua só com o administrador, na confirmação da entrada. A leitura nunca cadastra sozinha |
| 4 | Estoque, pacote e etiqueta só em **Confirmar entrada** |
| 5 | A foto da sugestão não é armazenada. A foto histórica opcional permanece |
| 6 | Confiança alta pré-seleciona; empate ou semelhança fraca marca como novo |
| 7 | Teto de 40 linhas sugeridas. Acima disso, a pessoa digita o restante |
| 8 | Rastro só com contagens, autor e modelo. Sem imagem |
| 9 | Sem migration nesta fatia, enquanto o rastro atual comportar os contadores |
| 10 | A fatia não fecha a Fase 5 |

---

## 13. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Confiar na leitura e pular a revisão | Estoque só na confirmação. A tela não oferece atalho |
| Auxiliar criar insumo sem querer | Linha nova bloqueada para esse papel |
| Nota com layout estranho | Mensagem para digitar. Compra manual intacta |
| Custo e demora | Só no botão, arquivo até 10 MB, espera com botão bloqueado |
| Foto de compra vazar em histórico ou log | Leitura sem guarda de arquivo e rastro sem imagem |
| Gerar etiqueta a mais | Revisão mostra a contagem. Uma embalagem, uma etiqueta |
| Assistente de compra crescer demais | Componente próprio de sugestão |

---

## 14. Referências

- Plano: `docs/plans/plano-sugestao-itens-planilha-vision.md`
- Estoque entregue: `docs/implementation/F5-insumos-estoque.md`
- Manual do dev: `docs/manual-dev/07-fase-5-insumos-estoque.md`
- Roteiro da foto de teste: `docs/fixtures/ROTEIRO-registrar-compra.md`
- Fixture: `docs/fixtures/planilha-compra-teste-clinroma.png`
- Segurança: `docs/SECURITY.md` (leitura de planilha sem revisão humana está fora)
- Pendências: `docs/state/PENDENCIAS.md`
- Fechamento: `.cursor/skills/close-phase/SKILL.md`

---

## 15. Aprovação

| Papel          | Nome | Data | Aprovado |
| -------------- | ---- | ---- | -------- |
| Mantenedor     |      |      | ☐        |
| Produto / Ivan |      |      | ☐        |

**Status atual:** `draft`.

**Não há implementação enquanto esta spec estiver em draft.** O próximo passo, depois da aprovação explícita no chat, é criar a branch `feature/sugestao-itens-planilha-vision` e implementar somente o que esta spec permite.
