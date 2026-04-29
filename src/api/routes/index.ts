import { Router } from "express";
import { getSeats, lockSeat, bookSeat } from "../controllers/booking.controller";

export const apiRouter = Router();

apiRouter.get("/seats", getSeats);
apiRouter.post("/lock-seat", lockSeat);
apiRouter.post("/book", bookSeat);

