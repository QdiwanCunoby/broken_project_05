import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { requestId } from "./middleware/requestId";
import { requestLogger } from "./middleware/requestLogger";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { errorHandler } from "./middleware/errorHandler";
import { CustomerRepository } from "./repositories/customerRepository";
import { AccountRepository } from "./repositories/accountRepository";
import { TransactionRepository } from "./repositories/transactionRepository";
import { CustomerController } from "./controllers/customerController";
import { AccountController } from "./controllers/accountController";
import { TransactionController } from "./controllers/transactionController";
import { createCustomerRoutes, createAccountRoutes, createTransactionRoutes } from "./routes/routes";

// Composition root: un solo PrismaClient iniettato in tutti i repository
const customerRoutes = createCustomerRoutes(new CustomerController(new CustomerRepository(prisma)));
const accountRoutes = createAccountRoutes(new AccountController(new AccountRepository(prisma)));
const transactionRoutes = createTransactionRoutes(new TransactionController(new TransactionRepository(prisma)));

const app = express();

app.use(requestId);
app.use(requestLogger);
app.use(helmet());
app.use(cors({ origin: env.corsOrigin.split(","), credentials: true, exposedHeaders: ["X-Request-Id"] }));
app.use(express.json({ limit: "100kb" }));

app.use("/api/customers", customerRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);

app.get("/health", (_req, res) => {
  res.json({ data: { status: "ok", timestamp: new Date().toISOString() } });
});

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
