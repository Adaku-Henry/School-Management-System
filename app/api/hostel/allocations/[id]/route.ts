import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";

const { GET, PUT, DELETE } = itemHandlers(prisma.hostelAllocation, {
  include: { student: true, room: true },
  transformIn: (body) => ({ studentId: body.studentId, roomId: body.roomId }),
});
export { GET, PUT, DELETE };
