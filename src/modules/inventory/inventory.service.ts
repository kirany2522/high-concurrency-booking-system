import { prisma } from "../../infra/db/prisma";
import { SeatStatus } from "@prisma/client";

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
  },
};
