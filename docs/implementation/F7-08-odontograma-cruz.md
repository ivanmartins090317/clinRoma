# F7-08 · Odontograma em formato de cruz

| Campo      | Valor                                              |
| ---------- | -------------------------------------------------- |
| **Status** | concluída (código) · homologação na Fase 7         |
| **Plano**  | `docs/plans/plano-F7.md` · Passo 3                 |
| **Spec**   | `specs/2026-08-25-f7-08-odontograma-cruz.md`       |
| **Fase**   | 7 de `docs/PLANO.md` (fase ainda aberta)           |

## Objetivo

Substituir a grade de botões FDI pelo **odontograma em cruz** da referência da clínica (arco superior/inferior, direita/esquerda do paciente, três vistas por dente). Persistência e paleta permanecem as da Fase 3.

## Entregue

### Domínio

| Arquivo                                                | Função                                                                 |
| ------------------------------------------------------ | ---------------------------------------------------------------------- |
| `src/features/records/domain/odontogram-cross.ts`      | Layout puro: quadrantes, ordem FDI, arco, oclusal vs incisal, palatina vs lingual |
| `src/features/records/domain/odontogram-cross.test.ts` | Vitest: orientação paciente vs tela, faces, empilhamento, 32 dentes    |

### UI

| Arquivo                                                  | Função                                              |
| -------------------------------------------------------- | --------------------------------------------------- |
| `src/features/records/components/odontogram-cross.tsx`   | Desenho compartilhado da cruz (mesa e celular)      |
| `src/features/records/components/tooth-views.tsx`        | Três vistas e faces tocáveis de um dente            |
| `src/features/records/components/odontogram.tsx`         | Cruz compacta no desktop; painel de confirmar       |
| `src/features/records/components/odontogram-mobile.tsx`  | Mesma cruz + zoom/rolagem; alvos 44 px no zoom de trabalho |

Sem migration. Achados já gravados (ex.: restauração oclusal no 36 da Maria) reaparecem na face correspondente. `actions.ts`, `schemas.ts` e `tooth-fdi.ts` intactos.

## Testes automatizados

- Quadrantes 18–11, 21–28, 48–41, 31–38; 11/21/41/31 colados na linha vertical.
- Direita do paciente à esquerda da tela.
- Palatina no arco superior; lingual no inferior.
- Incisal nos anteriores; oclusal nos posteriores.
- Faces da vista oclusal orientadas em relação à cruz (mesial para a linha média).
- Raízes para fora; empilhamento raiz → coroa → oclusal (superior) e o inverso (inferior).
- 32 dentes permanentes exatamente uma vez; alvo de toque 44 px no zoom de trabalho.
- Validação FDI/face/condição existente permanece verde.

## Evidências de Done

| Comando                | Resultado                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `npm run test`         | OK · 192 passed, 15 skipped                                                                                              |
| `npm run lint`         | Arquivos da fatia: 0 erros. Repo: 1 erro + 1 warning pré-existentes fora do escopo (`password-input.tsx`, `env.test.ts`) |
| `npx prettier --check` | Arquivos da fatia: OK. `format:check` do repo falha em arquivos legados (fora desta fatia)                               |
| `npm run build`        | OK · Next.js 16.3.1                                                                                                      |
| `npm run db:push`      | Não aplicável (sem migration)                                                                                            |
| `npm run db:types`     | Não aplicável (sem mudança de schema)                                                                                    |

## Pendências

- Homologação visual ao lado de `docs/assets/odontograma-formato-cruz.png` (mesa) e viewport estreito: fechamento da Fase 7.
- iPhone e Android reais: fechamento da Fase 7.

## Segurança (checklist aplicável)

- Autorização de escrita inalterada (`upsertToothFindingAction` + `validateToothFinding`).
- Fail secure: visualizador continua sem aba clínica e sem achados.
- Papel sem escrita vê a cruz e as cores; não confirma.
- Logs/auditoria: mesmos identificadores (paciente, dente, face); sem PHI extra.
- Sem segredo no cliente. Sem schema/RLS novo.
