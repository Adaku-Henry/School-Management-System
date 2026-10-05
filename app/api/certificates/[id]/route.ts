import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";

const { GET, PUT, DELETE } = itemHandlers(prisma.certificate, {
  include: { student: true },
  transformIn: (body) => ({ studentId: body.studentId, type: body.type }),
});
export { GET, PUT, DELETE };
