# Fase 7 · Fatia F7-02 · Busca no histórico

| Status                  | Spec                                           |
| ----------------------- | ---------------------------------------------- |
| código entregue (F7-02) | `specs/2026-08-25-f7-02-busca-historico.md`    |

A Fase 7 inteira **ainda está aberta**. Este capítulo cobre só o filtro do histórico na aba Evoluções.

## O que esta fatia entrega

- Campo **Buscar no histórico** acima da timeline, quando o paciente já tem evolução
- Filtro ao digitar no **corpo** da evolução e na **transcrição concluída** (texto vigente, inclusive após F7-01)
- Indiferente a maiúsculas; substring exata; espaços nas pontas ignorados
- Termo vazio devolve a lista completa; sem casamento mostra `Nenhuma evolução encontrada para esta busca.`
- Seed: duas evoluções de texto da **Maria Silva** (uma com `dente 24`, outra profilaxia)

**Não entrega:** busca na clínica inteira, destaque do trecho, persistência do termo na URL, busca por data/dentista/foto, odontograma cruz, anamnese papel, WhatsApp.

---

## Árvore tocada

```text
src/features/records/
├── domain/evolution-search.ts (+ .test.ts)
└── components/
    ├── evolution-search.tsx
    └── evolution-list.tsx

supabase/migrations/021_seed_busca_historico_f7.sql
```

---

## Fluxo principal

1. Login como dentista (`dentist@clinroma.dev`)
2. Abrir ficha de **Maria Silva** → aba **Evoluções**
3. Ver as duas evoluções do seed (profilaxia mais recente; extração do dente 24 mais antiga)
4. No campo **Buscar no histórico**, digitar `dente 24`
5. A lista mostra **somente** a extração
6. **Limpar busca**: as duas voltam
7. `DENTE 24` produz o mesmo recorte

Paciente sem evolução: permanece `Nenhuma evolução registrada ainda.` (campo oculto).

---

## Matriz

| Ação                                      | admin | dentist | reception | viewer | auxiliar |
| ----------------------------------------- | :---: | :-----: | :-------: | :----: | :------: |
| Ver evoluções e filtrar o histórico       |  Sim  |   Sim   |    Sim    |  Não   |   Não    |
| Registrar nova evolução                   |  Sim  |   Sim   |    Não    |  Não   |   Não    |
| A busca escrever no prontuário            |  Não  |   Não   |    Não    |  Não   |   Não    |

---

## Contas de teste

Senha comum de dev: `ClinRomaDev2026!`

| Papel        | E-mail                 | Uso nesta fatia                         |
| ------------ | ---------------------- | --------------------------------------- |
| Dentista     | dentist@clinroma.dev   | Buscar `dente 24` e limpar              |
| Recepção     | reception@clinroma.dev | Filtra; sem formulário de nova evolução |
| Visualizador | viewer@clinroma.dev    | Sem aba Evoluções nem campo             |
| Admin        | admin@clinroma.dev     | Mesma leitura clínica                   |

Paciente seed: **Maria Silva** (`c1000001-0000-4000-8000-000000000001`). Após `npm run db:push`.

---

## Homologação

Viewport estreito nesta fatia (campo 16 px, alvo ≥ 44 px). iPhone e Android reais ficam no fechamento da Fase 7.

Casamento por transcrição: coberto nos testes de domínio; o seed não inclui áudio.

---

## Referências

- Entrega técnica: [`docs/implementation/F7-02-busca-historico.md`](../implementation/F7-02-busca-historico.md)
- Pendências: [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md)
- Próximos itens: F7-08, F7-03, F7-04/F7-05, F7-06
