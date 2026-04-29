import { prisma } from "../../infra/db/prisma";

export const inventoryService = {
  async getAllSeats() {
    return prisma.seat.findMany({
      orderBy: {
        id: "asc",
      },
    });
  },
};

