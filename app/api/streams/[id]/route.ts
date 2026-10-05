import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";

const { GET, PUT, DELETE } = itemHandlers(prisma.stream, {
  include: { class: true },
  transformIn: (body) => ({
    name: body.name,
    classId: body.classId,
    teacherId: body.teacherId || null,
  }),
});

export { GET, PUT, DELETE };
