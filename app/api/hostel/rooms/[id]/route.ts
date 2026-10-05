import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";

const { GET, PUT, DELETE } = itemHandlers(prisma.hostelRoom, {
  transformIn: (body) => ({ name: body.name, capacity: Number(body.capacity) || 4 }),
});
export { GET, PUT, DELETE };
