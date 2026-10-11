# LipariBank — Broken Project Giorno 5 (risolto)

## Avvio

```bash
docker compose up -d postgres      # Postgres 16 su localhost:5433 (5432 è usata da liparibank-db di G3/G4)
npm install
npx prisma migrate dev             # applica la migration init (include l'indice composto)
npm run db:seed                    # 5 clienti, 8 conti, 64 transazioni
npx tsx src/index.ts               # oppure: npm run dev (hot-reload)
```

Richieste di prova: [requests/liparibank.http](requests/liparibank.http).

## Cosa è stato risolto

| # | Problema | Fix | File |
|---|----------|-----|------|
| 1 | `PrismaClient` duplicato → "too many clients" | Singleton su `globalThis`, `new PrismaClient(` una sola volta, `$disconnect()` su SIGTERM/SIGINT | `src/config/prisma.ts`, `src/services/notificationService.ts`, `prisma/seed.ts` |
| 2 | N+1 su `GET /api/customers` | `include: { accounts: { where: { deletedAt: null } } }` nel repository (2 query batchate con `IN`), indice `@@index([customerId, deletedAt])` | `src/repositories/customerRepository.ts`, `prisma/schema.prisma` |
| 3 | `Decimal` serializzato come `{ d, e, s }` | Opzione A: `serializeDecimals()` applicato nei controller | `src/utils/decimalSerializer.ts` |
| + | Feature: `GET /api/transactions/report?from=&to=` | Zod con `z.coerce.date()` + `groupBy` per stato + raw query per mese | `src/schemas/schemas.ts`, `src/repositories/transactionRepository.ts` |

## Verifica connessioni (Bug 1)

```bash
docker exec liparibank-postgres psql -U postgres -d liparibank -c "SELECT count(*) FROM pg_stat_activity WHERE usename='postgres'"
```

## Perché `include` non fa N query (Bug 2)

Prisma risolve le relazioni in modo batchato: una query per i customer, una per tutti i loro account con
`WHERE customer_id IN (...)`, poi unisce i risultati in memoria. Il numero di query non dipende dal numero di clienti.

## Opzioni per Decimal (Bug 3, da discutere col tutor)

- **A (scelta)**: esplicita e centralizzata in una funzione, ma va ricordata a ogni `res.json`.
- **B** `$extends`: tipizzata e a monte del controller, ma limitata ai model/campi dichiarati.
- **C** `toJSON` sul prototype: copre tutto, ma è un monkey-patch globale invisibile a chi legge il codice.
