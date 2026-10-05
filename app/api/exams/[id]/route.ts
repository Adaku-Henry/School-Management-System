import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";

const { GET, PUT, DELETE } = itemHandlers(prisma.exam, {
  include: { class: true },
  transformIn: (body) => ({
    name: body.name,
    type: body.type || "CAT",
    academicYear: body.academicYear,
    term: body.term,
    classId: body.classId || null,
    date: body.date ? new Date(body.date) : new Date(),
  }),
});

export { GET, PUT, DELETE };
