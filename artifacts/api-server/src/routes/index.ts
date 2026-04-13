import { Router, type IRouter } from "express";
import healthRouter from "./health";
import guardianRouter from "./guardian";
import patientRouter from "./patient";
import pillsRouter from "./pills";
import adherenceRouter from "./adherence";
import alertRouter from "./alert";
import medicineTriggerRouter from "./medicine-trigger";
import esp32Router from "./esp32";

const router: IRouter = Router();

router.use(healthRouter);
router.use(guardianRouter);
router.use(patientRouter);
router.use(pillsRouter);
router.use(adherenceRouter);
router.use(alertRouter);
router.use(medicineTriggerRouter);
router.use(esp32Router);

export default router;
