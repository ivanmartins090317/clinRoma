# Roteiro · Editar e apagar insumo

Cobre o ajuste de 29/09/2026: editar nome, unidade, mínimo e saldo, e apagar o insumo com aviso de histórico.

Plano: [`docs/plans/plano-edicao-exclusao-insumo.md`](../plans/plano-edicao-exclusao-insumo.md)

---

## Ajuste · 29/09/2026

Sintoma: na lista e no detalhe (exemplo **agulha**) não dava para mudar o mínimo nem remover um item que a clínica não compra mais. **Editar nome** só alterava o nome. Apagar existia só na etiqueta QR.

| Antes | Depois |
| ----- | ------ |
| Botão **Editar nome** | Botão **Editar insumo** (nome, unidade, mínimo e saldo) |
| Mínimo travado depois do cadastro | Mínimo editável. **0** para o alerta de reposição |
| Sem exclusão do insumo | **Deletar** com confirmação de perda de histórico |
| Histórico impede o delete (`ON DELETE RESTRICT`) | Migration `030`: histórico cai junto com o insumo |

Quem testa: administrador (`admin@clinroma.dev`). Auxiliar, dentista e recepção não veem os dois botões.

O que **não** muda: aba **Ajuste de saldo**, **Deletar** de pacote, Scan QR e entrada de compra.

---

## Pré-condição

1. Login admin: `admin@clinroma.dev` / `ClinRomaDev2026!`
2. Código deste ajuste no ambiente
3. Migration `030_supply_delete_cascade.sql` aplicada (`npm run db:push`)
4. Abrir `/estoque` e um insumo que já tenha movimentação (ex.: **agulha**)

---

## TC-A · mudar o mínimo sem apagar

1. Abra **agulha** (ou outro item com mínimo maior que 0)
2. **Editar insumo**
3. Coloque **Estoque mínimo** em `0`
4. Não altere o saldo
5. **Salvar**

Esperado:

- Volta ao detalhe com "mínimo 0"
- Situação não fica **Abaixo do mínimo** por causa desse item
- O item continua na lista
- Movimentações recentes não ganham linha nova se o saldo não mudou

---

## TC-B · mudar o saldo pelo cadastro

1. Anote o saldo atual
2. **Editar insumo** e informe um saldo diferente
3. **Salvar**

Esperado:

- O saldo do topo é o número informado
- Movimentações recentes ganham uma linha **Ajuste** com a diferença e a observação "Correção pelo cadastro do insumo"
- Pacotes e etiquetas QR **não** mudam de quantidade

Se existir etiqueta ativa, o restante dela pode ficar diferente do saldo. O Scan continua limitado à etiqueta.

---

## TC-C · apagar e o aviso

1. **Deletar**
2. Leia o texto: some item, etiquetas e histórico, e a ação não volta atrás
3. O texto indica cancelar e usar mínimo 0 se a ideia for só parar o alerta
4. **Não, manter**: o item continua
5. **Deletar** de novo e **Sim, deletar**

Esperado:

- Volta para a lista
- O nome não aparece na busca
- Um QR antigo desse item não é encontrado no Scan

Use um insumo de teste, não um item que a clínica ainda compra.

---

## TC-D · outros papéis

1. Login `assistant@clinroma.dev` (mesma senha de dev)
2. Abra um insumo

Esperado: sem **Editar insumo** e sem **Deletar** do insumo. **Deletar** de pacote continua visível para a auxiliar.
