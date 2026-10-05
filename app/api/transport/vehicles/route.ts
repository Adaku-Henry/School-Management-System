import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";

const { GET, POST } = collectionHandlers(prisma.vehicle, {
  orderBy: { plateNumber: "asc" },
  transformIn: (body) => ({
    plateNumber: body.plateNumber,
    capacity: Number(body.capacity) || 30,
    driverName: body.driverName || null,
  }),
});
export { GET, POST };
