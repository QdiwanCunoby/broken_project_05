// BUG 1 (fix) — unica istanza di PrismaClient dell'intera app.
//
// Prima: `export const prisma = new PrismaClient()` a livello di modulo. Con `tsx watch` ogni
// salvataggio ri-esegue il modulo → nuovo client → nuovo pool di connessioni, mentre quello
// vecchio non viene mai chiuso. Con max_connections=100 bastano 20-30 reload per saturare PG
// ("sorry, too many clients already").
//
// Ora: il client è salvato su globalThis, che sopravvive al reload dei moduli in dev.
// Al reload troviamo l'istanza già creata e la riusiamo.
import { PrismaClient } from "@prisma/client";
import { env } from "./env";
import { logger } from "../utils/logger";

const SLOW_QUERY_MS = 200;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; shutdownRegistered?: boolean };

const createClient = () => {
  const client = new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "warn" },
      { emit: "event", level: "error" },
    ],
  });

  // Listener di diagnostica: in dev logga ogni query (utile per vedere N+1), altrove solo le lente
  client.$on("query", e => {
    if (env.nodeEnv === "development") {
      logger.debug({ sql: e.query, params: e.params, ms: e.duration }, "prisma query");
    } else if (e.duration >= SLOW_QUERY_MS) {
      logger.warn({ sql: e.query, ms: e.duration }, "Slow query Prisma");
    }
  });
  client.$on("warn", e => logger.warn({ target: e.target }, e.message));
  client.$on("error", e => logger.error({ target: e.target }, e.message));

  return client;
};

export const prisma = globalForPrisma.prisma ?? createClient();

// In produzione il modulo si carica una volta sola: il salvataggio su globalThis serve solo in dev
if (env.nodeEnv !== "production") globalForPrisma.prisma = prisma;

// Graceful shutdown: Docker invia SIGTERM prima del kill, Ctrl+C invia SIGINT.
// Chiudiamo il pool prima di uscire, così PG libera subito le connessioni.
// Il flag globale evita di registrare gli handler ad ogni hot-reload (leak di listener).
if (!globalForPrisma.shutdownRegistered) {
  globalForPrisma.shutdownRegistered = true;
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, async () => {
      logger.info({ signal }, "Shutdown: chiudo la connessione al database");
      await prisma.$disconnect();
      process.exit(0);
    });
  }
}
