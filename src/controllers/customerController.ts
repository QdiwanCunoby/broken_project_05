import { Request, Response } from "express";
import { CustomerRepository } from "../repositories/customerRepository";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/apiResponse";
import { serializeDecimals } from "../utils/decimalSerializer";
import { PaginationQuery } from "../schemas/schemas";

export class CustomerController {
  constructor(private readonly customerRepo: CustomerRepository) {}

  // Nessun loop: i conti arrivano già annidati da customerRepo.findAll (include)
  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as PaginationQuery;   // già coerced da validate()
    const result = await this.customerRepo.findAll(page, limit);
    res.json(ok(serializeDecimals(result)));   // i balance dei conti sono Decimal
  });
}
