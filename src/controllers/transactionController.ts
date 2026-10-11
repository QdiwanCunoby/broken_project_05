import { Request, Response } from "express";
import { TransactionRepository } from "../repositories/transactionRepository";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { serializeDecimals } from "../utils/decimalSerializer";
import { PeriodQuery } from "../schemas/schemas";

export class TransactionController {
  constructor(private readonly repo: TransactionRepository) {}

  report = asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = req.query as unknown as PeriodQuery;   // già coerced a Date da validate()
    const [byStatus, byMonth] = await Promise.all([
      this.repo.findTransactionsByPeriod(from, to),
      this.repo.findMonthlyReport(from, to),
    ]);
    // _sum.amount e total sono ancora Decimal → serializeDecimals
    res.json(ok(serializeDecimals({ from, to, byStatus, byMonth })));
  });
}
