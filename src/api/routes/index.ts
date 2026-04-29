import { Router } from "express";
import { getSeats, lockSeat, bookSeat } from "../controllers/booking.controller";
import {
  createSeat,
  updateSeat,
  deleteSeat,
  bulkUpdateSeats,
  bulkDeleteSeats,
} from "../controllers/admin.controller";
import { adminAuth } from "../middlewares/adminAuth";

export const apiRouter = Router();

apiRouter.get("/seats", getSeats);
apiRouter.post("/lock-seat", lockSeat);
apiRouter.post("/book", bookSeat);
apiRouter.post("/admin/seats", adminAuth, createSeat);
apiRouter.patch("/admin/seats/bulk", adminAuth, bulkUpdateSeats);
apiRouter.delete("/admin/seats/bulk", adminAuth, bulkDeleteSeats);
apiRouter.patch("/admin/seats/:seatId", adminAuth, updateSeat);
apiRouter.delete("/admin/seats/:seatId", adminAuth, deleteSeat);
