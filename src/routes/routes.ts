import { Router } from "express";
import { CustomerController } from "../controllers/customerController";
import { AccountController } from "../controllers/accountController";
import { TransactionController } from "../controllers/transactionController";
import { validate } from "../middleware/validate";
import { idParamSchema, paginationQuerySchema, periodQuerySchema } from "../schemas/schemas";

export const createCustomerRoutes = (c: CustomerController): Router => {
  const router = Router();
  router.get("/", validate(paginationQuerySchema, "query"), c.list);
  return router;
};

export const createAccountRoutes = (c: AccountController): Router => {
  const router = Router();
  router.get("/:id", validate(idParamSchema, "params"), c.getById);
  return router;
};

export const createTransactionRoutes = (c: TransactionController): Router => {
  const router = Router();
  router.get("/report", validate(periodQuerySchema, "query"), c.report);
  return router;
};
