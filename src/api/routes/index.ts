import { Router } from "express";
import { getSeats, lockSeat, bookSeat } from "../controllers/booking.controller";
import { createSeat } from "../controllers/admin.controller";
import { adminAuth } from "../middlewares/adminAuth";

export const apiRouter = Router();

apiRouter.get("/seats", getSeats);
apiRouter.post("/lock-seat", lockSeat);
apiRouter.post("/book", bookSeat);
apiRouter.post("/admin/seats", adminAuth, createSeat);
