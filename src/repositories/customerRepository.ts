import { PrismaClient } from "@prisma/client";

export class CustomerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // BUG 2 (fix) — niente più loop con una query per cliente.
  //
  // `include` fa risolvere la relazione a Prisma in modo batchato: esegue UNA query per i customer
  // e UNA sola query per tutti i loro account con `WHERE customer_id IN ($1, $2, ...)`, poi
  // riassembla l'albero in memoria. Sono 2 query a prescindere da quanti clienti ci sono
  // (non N+1). Con `relationLoadStrategy: "join"` (preview feature) diventerebbe un unico
  // LEFT JOIN LATERAL. Il filtro `deletedAt: null` va dentro l'include, così il soft-delete
  // viene applicato in SQL e non dopo.
  async findAll(page: number, limit: number) {
    const where = { deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: { accounts: { where: { deletedAt: null } } },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);
    return { data, total, page, limit };
  }
}
