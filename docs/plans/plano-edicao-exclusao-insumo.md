# Plano · Editar e apagar insumo

> Fatia de estoque (extensão da Fase 5) · Autonomia: **medium**
> Status: **implementado · homologação manual pendente**
> Data: **2026-09-29**
> Origem: uso real da lista de insumos (agulha). Não havia como mudar o mínimo nem apagar um item que a clínica não compra mais.

**Pronto quando:** o administrador abre o insumo, edita nome, unidade, mínimo e saldo no mesmo formulário do cadastro, e pode apagar o item depois de ler que o histórico some. Colocar o mínimo em 0 continua sendo o caminho para parar o alerta sem apagar.

---

## Objetivo

Hoje o detalhe do insumo só tem **Editar nome**. O mínimo fica travado no valor do cadastro. Não existe exclusão do insumo: o banco recusa o delete quando há movimentação (`supply_movements.supply_id` com `ON DELETE RESTRICT`).

Esta fatia entrega:

1. **Editar insumo** com o formulário de criação em modo edição: nome, unidade, estoque mínimo e saldo.
2. **Deletar insumo** com confirmação que avisa a perda do histórico e indica o mínimo 0 para só parar o alerta.

Quem age: somente **administrador** (`stock: write`). Auxiliar continua podendo deletar pacote, não o insumo.

---

## Comportamento

### Editar

| Campo | O que grava |
| ----- | ----------- |
| Nome | `supplies.name` |
| Unidade | `supplies.unit` |
| Estoque mínimo | `supplies.minimum_quantity` |
| Saldo | Ajuste em `supply_movements` só se o número mudou em relação ao valor aberto na tela |

O saldo não é escrito direto em `current_quantity`. O gatilho `apply_supply_movement` continua sendo a única via. A observação do ajuste é fixa: "Correção pelo cadastro do insumo".

Se o campo de saldo não foi alterado, nenhuma movimentação é criada, mesmo que uma retirada tenha ocorrido com o formulário aberto.

Nome, unidade, mínimo e saldo salvam juntos. O aviso ao financeiro compara o snapshot de antes com o estado final, uma vez.

Mínimo **0** tira o item da reposição (`needsReplenishment` exige mínimo maior que 0). O item permanece na lista.

A aba **Ajuste de saldo** permanece para correção com observação livre.

### Deletar

Confirmação, com o nome do item:

> Apagar agulha remove o item, as etiquetas QR e o histórico de entradas e saídas. Essa ação não volta atrás.
>
> Se a ideia é só parar o alerta de reposição, cancele e use Editar insumo para colocar o estoque mínimo em 0.

Ao confirmar, apaga `supplies`. Em cascata saem pacotes, movimentações e alertas financeiros daquele item. Etiqueta antiga deixa de ser encontrada no scan.

---

## Banco

Migration `030_supply_delete_cascade.sql`:

- `supply_movements.supply_id` passa de `ON DELETE RESTRICT` para `ON DELETE CASCADE`
- Policy `DELETE` em `supply_movements` só para `admin`
- `GRANT DELETE` em `supply_movements` para `authenticated` (a policy restringe o papel)

Pacotes e `stock_finance_alerts` já usam `ON DELETE CASCADE`.

---

## Impacto

| Situação | Efeito |
| -------- | ------ |
| Mínimo 0 com saldo zerado | Para o alerta. O item continua na lista. |
| Saldo editado com etiqueta ativa | O total muda. A etiqueta não. O scan pode falhar se o saldo ficar menor que o restante do QR. |
| Troca de unidade | O número não converte. 50 unitários passam a significar 50 na unidade nova. |
| Delete | Irreversível. Histórico, QR e alerta daquele item somem. |
| Outros papéis | Não veem editar nem deletar insumo. |

---

## Fora deste corte

- Arquivar insumo sem apagar (esconder da lista e manter histórico)
- Converter saldo ao trocar unidade
- Recalcular etiquetas QR quando o saldo do cadastro muda
- Exclusão pela auxiliar de sala

---

## Verificação

- Teste de domínio: planejar o ajuste de saldo (sem mudança, aumento, redução, saldo já igual ao desejado)
- Roteiro manual: `docs/fixtures/ROTEIRO-editar-deletar-insumo.md`
