import { Prisma, PrismaClient } from "@prisma/client";

export class TransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Totale e conteggio per stato nel periodo (groupBy di Prisma)
  findTransactionsByPeriod(from: Date, to: Date) {
    return this.prisma.transaction.groupBy({
      by: ["status"],
      where: { executedAt: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { status: "asc" },
    });
  }

  // Versione "per mese e stato": groupBy di Prisma non sa troncare una data al mese,
  // quindi il raggruppamento lo fa il database con una raw query (parametri sempre bindati).
  findMonthlyReport(from: Date, to: Date) {
    return this.prisma.$queryRaw<
      { month: Date; status: string; total: Prisma.Decimal; count: number }[]
    >`
      SELECT date_trunc('month', executed_at) AS month,
             status::text                      AS status,
             SUM(amount)                       AS total,
             COUNT(*)::int                     AS count
      FROM transactions
      WHERE executed_at >= ${from} AND executed_at <= ${to}
      GROUP BY 1, 2
      ORDER BY 1, 2`;
  }
}
