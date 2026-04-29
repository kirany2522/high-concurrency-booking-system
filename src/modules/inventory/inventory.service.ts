import { prisma } from "../../infra/db/prisma";
import { SeatStatus } from "@prisma/client";
import { AppError } from "../../utils/errors";
import { logger } from "../../utils/logger";

export const inventoryService = {
  async getAllSeats() {
    return prisma.seat.findMany({
      orderBy: {
        id: "asc",
      },
    });
  },

  async createSeats(input: { price: number; count?: number; status?: SeatStatus }) {
    const count = input.count ?? 1;
    const status = input.status ?? SeatStatus.AVAILABLE;

    logger.info("Creating seats in bulk", {
      price: input.price,
      count,
      status,
    });

    try {
      const result = await prisma.seat.createMany({
        data: Array.from({ length: count }, () => ({
          price: input.price,
          status,
        })),
      });

      return {
        createdCount: result.count,
        price: input.price,
        status,
      };
    } catch (error) {
      logger.error("Bulk seat insert failed", {
        price: input.price,
        count,
        status,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new AppError(500, "Failed to create seats", "BULK_SEAT_CREATE_FAILED");
    }
  },
};
