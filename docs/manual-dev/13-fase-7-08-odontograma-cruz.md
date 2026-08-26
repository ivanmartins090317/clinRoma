# Fase 7 · Fatia F7-08 · Odontograma em cruz

| Status                  | Spec                                           |
| ----------------------- | ---------------------------------------------- |
| código entregue (F7-08) | `specs/2026-08-25-f7-08-odontograma-cruz.md`   |

A Fase 7 inteira **ainda está aberta**. Este capítulo cobre só a troca da grade FDI pelo mapa em cruz na aba Odontograma.

## O que esta fatia entrega

- Cruz com arco superior/inferior e direita/esquerda **do paciente** (direita do paciente à esquerda da tela)
- Números FDI 18–11, 21–28, 48–41, 31–38 colados na cruz
- Três vistas empilhadas por dente: raiz (para fora da cruz), coroa, oclusal/incisal com faces tocáveis
- Cor por face a partir dos achados já gravados; paleta e **Confirmar achado** iguais à Fase 3
- Mesa: cruz compacta. Celular: mesma cruz, zoom +/− e rolagem; faces ≥ 44 px no zoom de trabalho
- Painel inferior no celular (dente, face, condição, confirmar) alcançável com o polegar

**Não entrega:** dente decíduo, novo código de condição, migration, periodontograma, busca, anamnese papel, WhatsApp, fechamento da Fase 7.

---

## Árvore tocada

```text
src/features/records/
├── domain/odontogram-cross.ts (+ .test.ts)
└── components/
    ├── odontogram-cross.tsx
    ├── tooth-views.tsx
    ├── odontogram.tsx
    └── odontogram-mobile.tsx
```

---

## Fluxo principal

1. Login como dentista (`dentist@clinroma.dev`)
2. Abrir ficha de **Maria Silva** → aba **Odontograma**
3. Ver a cruz (não a grade de botões). O 36, face oclusal, já está na cor de restauração (seed da Fase 3)
4. Tocar a face oclusal do **dente 24**, escolher **Cárie**, acionar **Confirmar achado**
5. Ver o toast `Achado odontológico salvo` e a face do 24 na cor de cárie
6. Recarregar a ficha: o achado permanece na mesma face

Viewport estreito: usar − para ver a cruz inteira, + para o zoom de trabalho, arrastar para rolar. O painel de confirmar fica fixo embaixo.

---

## Matriz

| Ação                                      | admin | dentist | reception | viewer | auxiliar |
| ----------------------------------------- | :---: | :-----: | :-------: | :----: | :------: |
| Ver o odontograma em cruz e as cores      |  Sim  |   Sim   |    Sim    |  Não   |   Não    |
| Selecionar dente/face e confirmar achado  |  Sim  |   Sim   |    Sim    |  Não   |   Não    |

---

## Contas de teste

Senha comum de dev: `ClinRomaDev2026!`

| Papel        | E-mail                 | Uso nesta fatia                         |
| ------------ | ---------------------- | --------------------------------------- |
| Dentista     | dentist@clinroma.dev   | Marcar face do 24; ver seed do 36       |
| Recepção     | reception@clinroma.dev | Mesma escrita da Fase 3                 |
| Visualizador | viewer@clinroma.dev    | Sem aba Odontograma                     |
| Admin        | admin@clinroma.dev     | Mesma leitura e escrita clínica         |

Paciente seed: **Maria Silva** (`c1000001-0000-4000-8000-000000000001`). Achado seed: dente 36, face oclusal, restauração.

Referência visual: `docs/assets/odontograma-formato-cruz.png`.

---

## Homologação

Viewport estreito nesta fatia (zoom/pan, alvos ≥ 44 px). iPhone e Android reais ficam no fechamento da Fase 7.

---

## Referências

- Entrega técnica: [`docs/implementation/F7-08-odontograma-cruz.md`](../implementation/F7-08-odontograma-cruz.md)
- Pendências: [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md)
- Próximos itens: F7-03, F7-04/F7-05, F7-06
