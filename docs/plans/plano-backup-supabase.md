# Plano · Backup próprio do Supabase (3-2-1)

> Fatia operacional · Autonomia: **tight** (secrets, PHI, VPS)
> Status: **rascunho · aguardando aprovação**
> Data: **2026-09-11**
> Origem: nota no segundo-cérebro `10 Dev/Clientes/clinica-neo-roma-dev/Projetos/operacional/2026-09-11-backup-supabase-321.md`

**Pronto quando:** dump diário criptografado do Postgres está fora do Supabase; Storage tem sync incremental; falha do job alerta alguém; restore foi testado uma vez.

---

## Por que este projeto

O ClinRoma guarda dado de saúde do piloto (pacientes, prontuário, fotos, áudios, agenda, estoque). Backup só do Dashboard do Supabase é ponto único de falha. E-mail não é cofre.

`pg_dump` **não** copia o Storage.

---

## Encaixe na arquitetura atual

| Papel | Quem |
| ----- | ---- |
| Produção (cópia 1) | Supabase ao vivo + backup diário do vendor (Pro, se ainda estiver no Free) |
| Relógio do job | VPS Campinas (crontab já existe para `/api/cron/*`) — **não** GitHub Actions |
| Cofre offsite (cópia 2) | Cloudflare R2 (ou S3), arquivo criptografado |
| Storage | `rclone` incremental (fotos/áudios de evolução) |
| Alerta | Só status de falha. Nunca anexar o dump |

Conexão do dump: porta **5432** (direta), não pooler `6543`. Secret só na VPS.

---

## Escopo desta fatia

1. Script diário (madrugada) na VPS: `pg_dump -Fc` → criptografar → upload R2.
2. Sync incremental dos buckets de Storage.
3. Retenção: 7 diários + 4 semanais + 3 mensais.
4. Runbook de restore (1 página) + 1 teste real (paciente + evolução + 1 arquivo).

Fora: Lambda, Glacier, segunda nuvem no dia 1, senha no git.

---

## Como usar

1. Aprovar este plano.
2. Spec curta em `specs/` (secrets, retenção, o que entra no dump).
3. Implementar job + docs; **não** commitar `.env` nem dump.
