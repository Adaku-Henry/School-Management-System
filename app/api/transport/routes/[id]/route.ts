import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";

const { GET, PUT, DELETE } = itemHandlers(prisma.transportRoute, {
  include: { vehicle: true },
  transformIn: (body) => ({ name: body.name, vehicleId: body.vehicleId || null }),
});
export { GET, PUT, DELETE };
