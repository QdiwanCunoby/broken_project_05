import { Request, Response } from "express";
import { AccountRepository } from "../repositories/accountRepository";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { NotFoundError } from "../utils/errors";
import { serializeDecimals } from "../utils/decimalSerializer";

export class AccountController {
  constructor(private readonly repo: AccountRepository) {}

  getById = asyncHandler(async (req: Request, res: Response) => {
    const account = await this.repo.findById(req.params.id);
    if (!account) throw new NotFoundError(`Account con id ${req.params.id} non trovato`);
    // BUG 3 (fix): balance è un Prisma.Decimal → senza serializeDecimals finirebbe come { d, e, s }
    res.json(ok(serializeDecimals(account)));
  });
}
