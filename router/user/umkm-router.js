import express from "express";
import { createUmkm, getUmkm, renewSubscription, deactivateSubscription } from "../../controllers/user/umkm-controller.js";

const router = express.Router();

router.post("/create", createUmkm);
router.get("/getall", getUmkm)
router.post("/renew-subscription", renewSubscription)
router.post("/deactivate-subscription", deactivateSubscription)

export default router;