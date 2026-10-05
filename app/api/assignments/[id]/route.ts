import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";

const { GET, PUT, DELETE } = itemHandlers(prisma.assignment, {
  transformIn: (body) => ({
    title: body.title,
    description: body.description || null,
    subjectId: body.subjectId || null,
    classId: body.classId || null,
    dueDate: new Date(body.dueDate),
  }),
});
export { GET, PUT, DELETE };
