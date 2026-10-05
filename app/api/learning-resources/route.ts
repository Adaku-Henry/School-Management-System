import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";

const { GET, POST } = collectionHandlers(prisma.learningResource, {
  orderBy: { createdAt: "desc" },
  transformIn: (body) => ({
    title: body.title,
    type: body.type,
    url: body.url || null,
    subjectId: body.subjectId || null,
  }),
});
export { GET, POST };
