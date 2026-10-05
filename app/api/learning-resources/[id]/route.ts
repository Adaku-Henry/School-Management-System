import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";

const { GET, PUT, DELETE } = itemHandlers(prisma.learningResource, {
  transformIn: (body) => ({
    title: body.title,
    type: body.type,
    url: body.url || null,
    subjectId: body.subjectId || null,
  }),
});
export { GET, PUT, DELETE };
