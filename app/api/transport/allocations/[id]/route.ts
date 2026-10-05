import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";

const { GET, PUT, DELETE } = itemHandlers(prisma.transportAllocation, {
  include: { student: true, route: true },
  transformIn: (body) => ({ studentId: body.studentId, routeId: body.routeId }),
});
export { GET, PUT, DELETE };
