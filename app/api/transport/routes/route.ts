import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";

const { GET, POST } = collectionHandlers(prisma.transportRoute, {
  include: { vehicle: true },
  orderBy: { name: "asc" },
  transformIn: (body) => ({ name: body.name, vehicleId: body.vehicleId || null }),
  transformOut: (row) => ({ ...row, vehiclePlate: row.vehicle?.plateNumber }),
});
export { GET, POST };
