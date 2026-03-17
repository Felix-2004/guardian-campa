import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import contactsRouter from "./contacts.js";
import locationsRouter from "./locations.js";
import alertsRouter from "./alerts.js";
import trackingRouter from "./tracking.js";
import safetyRouter from "./safety.js";
import familyRouter from "./family.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/contacts", contactsRouter);
router.use("/locations", locationsRouter);
router.use("/alerts", alertsRouter);
router.use("/tracking", trackingRouter);
router.use("/safety", safetyRouter);
router.use("/family", familyRouter);

export default router;
