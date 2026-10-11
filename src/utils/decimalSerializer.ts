// BUG 3 (fix, Opzione A) — trasformatore a livello di response.
//
// JSON.stringify di un Prisma.Decimal espone la struttura interna di decimal.js ({ d, e, s }),
// quindi il frontend riceveva un oggetto e `balance.toFixed(2)` dava NaN.
// Convertiamo ricorsivamente ogni Decimal in string con 2 decimali.
// String e non number: un number JS perde cifre oltre 2^53, un importo bancario non deve mai
// passare per un float.
//
// Trade-off: A è esplicita (si vede nel controller dove avviene la conversione) ma va
// ricordata a ogni res.json; B (Prisma $extends) è tipizzata ma limitata ai model dichiarati;
// C (toJSON sul prototype) è globale ma è un monkey-patch invisibile a chi legge il codice.
import { Prisma } from "@prisma/client";

export function serializeDecimals<T>(value: T): T {
  if (value instanceof Prisma.Decimal) return value.toFixed(2) as unknown as T;
  if (value instanceof Date) return value;   // le Date hanno già un toJSON corretto: non vanno "aperte"
  if (Array.isArray(value)) return value.map(serializeDecimals) as unknown as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, serializeDecimals(v)]),
    ) as T;
  }
  return value;
}
