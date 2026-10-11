// BUG 1 (fix) — il refuso `const prisma = new PrismaClient()` è stato tolto:
// si riusa l'unico client di config/prisma.ts (new PrismaClient( compare una sola volta nel progetto).
import { prisma } from "../config/prisma";
import { logger } from "../utils/logger";

export class NotificationService {
  // Notifica di bonifico completato: qui solo log, la consegna reale non è in scope
  async notifyTransfer(accountId: string): Promise<void> {
    const account = await prisma.account.findUnique({ where: { id: accountId }, include: { customer: true } });
    if (!account) return;
    logger.info({ accountId, to: account.customer.email }, "Notifica bonifico inviata");
  }
}
