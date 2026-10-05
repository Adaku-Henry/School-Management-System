import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";

const { GET, PUT, DELETE } = itemHandlers(prisma.disciplineRecord, {
  include: { student: true },
  transformIn: (body) => ({
    studentId: body.studentId,
    type: body.type,
    description: body.description,
  }),
});
export { GET, PUT, DELETE };
