# Fase 0 · Fundação do repositório

| Status | Spec |
| ------ | ---- |
| concluída | `specs/2026-08-17-fase-0-fundacao.md` |

## O que esta fase entrega

Base do repositório para desenvolvimento local e navegação entre módulos **sem** lógica de negócio nem banco persistido.

### Funcionalidades

- **AppShell** responsivo: sidebar no desktop (`md+`), barra inferior no mobile (5 ícones; Scan QR acessível pela rota `/estoque/scan`).
- **Rotas placeholder** para todos os módulos do MVP.
- **Página pública da fila** em `/fila/resposta/[token]` (UI estática; integração na Fase 4).
- **Dev HTTPS** via `npm run dev` (`next dev --experimental-https`) para testar câmera/microfone no celular.
- **Middleware** com refresh de cookies Supabase (sem exigir login ainda).

### Arquivos-chave

| Arquivo | Papel |
| ------- | ----- |
| `src/components/app-shell.tsx` | Shell de navegação (evoluiu na F1 com filtro por papel) |
| `src/app/(app)/layout.tsx` | Envolve páginas autenticadas |
| `middleware.ts` | Refresh de sessão (F0); guarda de rota adicionada na F1 |
| `src/lib/supabase/client.ts` | Client browser |
| `src/lib/supabase/server.ts` | Client server (cookies) |
| `src/app/globals.css` | Tokens Neo Roma + padrões de toque |
| `supabase/config.toml` | Config Supabase CLI |

### Arquitetura de rotas (F0)

```text
/                    → redirect /hoje
/hoje, /agenda, …    → (app)/* com AppShell
/fila/resposta/[token] → público, sem shell
```

---

## Como validar

```bash
npm install
cp .env.example .env.local   # opcional na F0
npm run dev                  # https://localhost:3000
npm run lint && npm run build
```

No celular (mesma Wi‑Fi): `https://<IP-local>:3000` e confiar no certificado de dev.

---

## Limitações intencionais (corrigidas na F1)

- Sem login nem guarda por papel.
- Sem tabelas no Postgres.
- Sem pasta `src/features/` de negócio (só infra posterior).

Próximo passo: [03-fase-1-dados-auth-papeis.md](./03-fase-1-dados-auth-papeis.md).
