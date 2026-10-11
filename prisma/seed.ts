// Seed: 5 clienti, 1-2 conti ciascuno, transazioni distribuite tra gennaio e aprile 2026
import { AccountType, TransactionStatus } from "@prisma/client";
import { prisma } from "../src/config/prisma";   // unico client del progetto

const customers = [
  { fiscalCode: "RSSMRA80A01H501U", firstName: "Mario", lastName: "Rossi", email: "mario.rossi@example.com" },
  { fiscalCode: "VRDLGI85B02F205X", firstName: "Luigi", lastName: "Verdi", email: "luigi.verdi@example.com" },
  { fiscalCode: "BNCGNN90C03L219Z", firstName: "Gianna", lastName: "Bianchi", email: "gianna.bianchi@example.com" },
  { fiscalCode: "NREFNC75D04D612K", firstName: "Franca", lastName: "Neri", email: "franca.neri@example.com" },
  { fiscalCode: "GLLPLA95E05A944B", firstName: "Paola", lastName: "Gialli", email: "paola.gialli@example.com" },
];

const STATUSES = [
  TransactionStatus.COMPLETED,
  TransactionStatus.COMPLETED,
  TransactionStatus.PENDING,
  TransactionStatus.FAILED,
];

async function main() {
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.customer.deleteMany();

  let n = 0;
  for (const [i, c] of customers.entries()) {
    const customer = await prisma.customer.create({ data: c });
    const types = i % 2 === 0 ? [AccountType.CHECKING, AccountType.SAVINGS] : [AccountType.CHECKING];
    for (const type of types) {
      const account = await prisma.account.create({
        data: {
          iban: `IT60X0542811101${String(n + 1).padStart(12, "0")}`,   // 27 caratteri, univoco
          type,
          balance: (15420.5 + n * 1234.56).toFixed(2),
          customerId: customer.id,
        },
      });
      // 8 transazioni distribuite su gennaio–aprile 2026
      for (let t = 0; t < 8; t++) {
        await prisma.transaction.create({
          data: {
            accountId: account.id,
            amount: (100 + t * 75.25 + n * 10).toFixed(2),
            description: `Bonifico #${n}-${t}`,
            status: STATUSES[(t + n) % STATUSES.length],
            executedAt: new Date(Date.UTC(2026, t % 4, 5 + t * 3, 10, 0, 0)),
          },
        });
      }
      n++;
    }
  }
  console.log(`Seed completato: ${customers.length} clienti, ${n} conti, ${n * 8} transazioni`);
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
