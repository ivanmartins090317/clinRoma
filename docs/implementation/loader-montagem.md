# Fatia · Loader da marca e montagem da Hoje

| Campo        | Valor                                                                 |
| ------------ | --------------------------------------------------------------------- |
| **Status**   | em código · **não** fecha fase do `docs/PLANO.md`                     |
| **Data**     | 2026-09-29                                                            |
| **Spec**     | `specs/2026-09-29-loader-montagem.md`                                 |
| **Plano**    | `docs/plans/plano-loader-montagem.md`                                 |
| **Branch**   | `feature/loader-montagem`                                             |

A espera das telas autenticadas deixa de ser miolo em branco. O menu aparece com a sessão. O símbolo dourado ocupa só o conteúdo. Na Hoje, a saudação sai com os lugares reservados e cada bloco entra quando o dado daquele bloco chega.

## Entregue

| Arquivo | Função |
| ------- | ------ |
| `src/components/layout/page-loader.tsx` | Símbolo `public/brand/icon-192.png`, texto alternativo **Carregando** |
| `src/app/(app)/loading.tsx` | Espera de toda tela autenticada, dentro do menu |
| `src/components/layout/menu-chips-ao-vivo.tsx` | Contagem de dentistas e chip de WhatsApp depois do menu |
| `src/app/(app)/layout.tsx` | Guarda de sessão e permissão antes do menu. Dentistas e WhatsApp não seguram o miolo |
| `src/components/app-shell.tsx` | Menu usável. Os chips entram no lugar |
| `src/app/(app)/hoje/page.tsx` | Saudação e lugares, sem esperar todos os dados |
| `src/app/(app)/hoje/lugar-reservado.tsx` | Lugar do bloco, aviso de falha e entrada |
| `src/app/(app)/hoje/numeros-do-dia.tsx` | Quatro números |
| `src/app/(app)/hoje/whatsapp-do-dia.tsx` | Card de WhatsApp, se o papel já vê |
| `src/app/(app)/hoje/consultas-do-dia.tsx` | Consultas e lembretes daqueles horários |
| `src/app/(app)/hoje/falhas-de-lembrete.tsx` | Só administrador |
| `src/app/(app)/hoje/fila-aguardando.tsx` | Resumo da fila |
| `src/app/(app)/hoje/estoque-abaixo-do-minimo.tsx` | Alertas de estoque |
| `src/app/globals.css` | Giro, crescimento, entrada do bloco e menos movimento |
| `src/lib/auth/session.ts` | `React.cache` em `getAuthSession` |
| `src/features/agenda/queries.ts` | `React.cache` em `getActiveDentists` |
| `src/features/whatsapp/queries.ts` | `React.cache` em `getClinicWhatsAppSessionStatus` |

Não há migration. Consulta, fila, estoque e lembrete não ficam guardados entre visitas.

## Testes

| Arquivo | O que cobre |
| ------- | ----------- |
| `src/app/(app)/hoje/montagem.test.ts` | Ordem dos blocos por papel, atraso de 50 ms, frase de falha |
| `src/components/layout/menu-chips-ao-vivo.test.ts` | Contagem sem zero provisório; chip só para admin e recepção |

Não há teste automatizado de animação. A evidência do movimento é o navegador.

## Navegador (2026-09-29, `http://localhost:3000`)

| Caminho | O que se viu |
| ------- | ------------ |
| Admin na Hoje | Menu, saudação, quatro números, card de WhatsApp, consultas com lembrete, falhas, fila e estoque. Chips: PILOTO, 5 dentistas ativos, SLA, QR, WhatsApp ligado |
| Troca para Fila e para Equipe | Sidebar permanece. O miolo monta `.page-loader` com `alt` Carregando e giro `page-loader-girar` |
| CSS do símbolo | Atraso 0,15 s, giro 2,6 s linear, crescimento 1,1 s ease-out, tamanho computado 72 px |
| Menos movimento | Giro e crescimento `none`, bloco sem subida, atraso de 0,15 s do símbolo permanece |
| Celular 390×844 | Sidebar oculta. Base do símbolo em 395 px; dock começa em 772 px |
| Login | Sem shell e sem este símbolo |
| Visualizador | Saudação, consultas, fila e estoque. Sem card de WhatsApp, sem falhas e sem chip de WhatsApp. Contagem de dentistas presente |

A conta `dentist@clinroma.dev` recusou a senha de desenvolvimento desta máquina. O card para o dentista e a ausência do chip estão cobertos pelo teste de papéis.

## Fora desta fatia

Agenda, Fila, prontuário e Estoque não montam bloco a bloco. Login, senha, link da fila e anamnese não usam o símbolo. Nenhum capítulo novo de manual e nenhuma fase do plano do produto foi fechada.
