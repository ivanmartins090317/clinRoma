# Fase 5 · Insumos e estoque

Controle de insumos com QR por pacote, retirada mobile e alertas operacionais.

**Registro técnico:** [`docs/implementation/F5-insumos-estoque.md`](../implementation/F5-insumos-estoque.md)

---

## O que esta fase entrega

- Lista de insumos com busca, situação (OK / Abaixo do mínimo / Zerado)
- Cadastro e edição de insumo (admin)
- Wizard **Registrar compra**: foto opcional da planilha + digitação manual (**sem OCR**)
- Pacotes com QR único (`CR-` + 12 caracteres) e folha imprimível de etiquetas
- Scan QR mobile com câmera traseira, viewfinder, BarcodeDetector nativo + fallback `zxing-wasm`
- Retirada parcial ou total, modo contínuo, feedback sonoro e vibração
- Alertas de estoque na **Hoje**
- PWA instalável com atalho **Scan estoque**

## O que não entrega

- OCR de planilha
- Service worker offline
- Impressora térmica
- Notificação push de estoque baixo. E-mail ao financeiro: F7-06.

---

## Árvore da feature

```text
src/features/stock/
  domain/          regras puras + testes
  lib/             transações server-side
  components/      UI (lista, detalhe, wizard, scan, etiquetas)
  actions.ts       Server Actions
  queries.ts       leituras RSC
  schemas.ts       Zod
```

---

## Contas de teste

Senha comum de dev: `ClinRomaDev2026!`

| Papel    | E-mail                   | Estoque                                  |
| -------- | ------------------------ | ---------------------------------------- |
| Admin    | `admin@clinroma.dev`     | CRUD, compra, scan, ajuste               |
| Auxiliar | `assistant@clinroma.dev` | Pacotes/entrada, scan; sem cadastro base |
| Recepção | `reception@clinroma.dev` | Leitura + alertas Hoje; sem scan         |
| Dentista | `dentist@clinroma.dev`   | Somente leitura                          |

---

## QR codes de desenvolvimento (seed)

| QR          | Insumo           | Qtd. pacote |
| ----------- | ---------------- | ----------- |
| `CR-DEV001` | Luva nitrílica M | 100 un      |
| `CR-DEV002` | Luva nitrílica M | 100 un      |
| `CR-DEV003` | Alginato         | 500 caixas  |

Insumo **Anestésico** fica com saldo 2 e mínimo 5 para testar alerta na Hoje.

---

## Fluxos de homologação

### Desktop · admin

1. `npm run dev` (HTTPS em `https://localhost:3000`)
2. Login `admin@clinroma.dev` → `/estoque`
3. **Novo insumo** ou **Registrar compra** com linhas manuais
4. Selecionar pacotes → **Imprimir etiquetas**
5. Abrir `/hoje` e validar seção estoque (Anestésico abaixo do mínimo)

### Mobile · auxiliar (obrigatório iPhone + Android)

1. Acessar dev via HTTPS no celular (IP da máquina ou deploy)
2. Login `assistant@clinroma.dev`
3. `/estoque/scan` ou atalho PWA **Scan estoque**
4. Escanear `CR-DEV001` → confirmar retirada → toast + saldo
5. Modo contínuo: escanear `CR-DEV002` e `CR-DEV003` em sequência
6. Duplo scan do mesmo QR em &lt; 3 s deve ignorar ou avisar

### Permissões negativas

- Recepção em `/estoque/scan` → 403
- Dentista sem botões de cadastro/scan na UI

---

## PWA

1. No Safari/Chrome mobile: **Adicionar à Tela de Início**
2. Atalho **Scan estoque** abre `/estoque/scan`
3. `start_url` padrão continua `/hoje`

Ícones em `public/icons/icon-192.png` e `icon-512.png`.

---

## Comandos úteis

```bash
npm run dev          # HTTPS (--experimental-https)
npm run db:push      # migrations 016 + 017
npm run test         # domínio stock/
npm run build
```

---

## Próxima fase

Fase 6 · Lembrete pós-consulta e piloto. Ver [`docs/state/PENDENCIAS.md`](../state/PENDENCIAS.md).
