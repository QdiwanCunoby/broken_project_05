import { z } from "zod";

// Le query string sono sempre string: coerce le converte in numeri/Date prima della validazione
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({ id: z.uuid({ message: "id deve essere un UUID" }) });

// Feature opzionale: report transazioni per periodo
export const periodQuerySchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .refine(d => d.from < d.to, { message: "from deve precedere to", path: ["from"] });

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type PeriodQuery = z.infer<typeof periodQuerySchema>;
