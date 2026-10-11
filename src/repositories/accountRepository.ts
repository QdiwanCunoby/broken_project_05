import { PrismaClient } from "@prisma/client";

export class AccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string) {
    return this.prisma.account.findFirst({ where: { id, deletedAt: null } });
  }
}
