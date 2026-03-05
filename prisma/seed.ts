import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const appointmentCount = await prisma.appointment.count();

  if (appointmentCount === 0) {
    await prisma.appointment.createMany({
      data: [
        {
          locationSlug: "partridge-creek",
          serviceType: "Personal Styling Session",
          preferredDate: new Date("2026-03-18T00:00:00.000Z"),
          preferredTimeWindow: "10:00 AM - 10:30 AM",
          name: "Sample Client",
          email: "sample@example.com",
          phone: "555-0101",
          notes: "Sample seeded appointment",
        },
      ],
    });
  }

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
