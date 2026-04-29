const { PrismaClient, SeatStatus } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.seat.count();

  if (count > 0) {
    return;
  }

  const seats = Array.from({ length: 20 }, (_, index) => ({
    id: `seat-${index + 1}`,
    status: SeatStatus.AVAILABLE,
    price: String(100 + index * 10),
  }));

  await prisma.seat.createMany({
    data: seats,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
