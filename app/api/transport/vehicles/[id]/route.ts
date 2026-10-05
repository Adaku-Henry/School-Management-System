import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";

const { GET, PUT, DELETE } = itemHandlers(prisma.vehicle, {
  transformIn: (body) => ({
    plateNumber: body.plateNumber,
    capacity: Number(body.capacity) || 30,
    driverName: body.driverName || null,
  }),
});
export { GET, PUT, DELETE };
