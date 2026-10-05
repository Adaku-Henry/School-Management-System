import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";

const { GET, POST } = collectionHandlers(prisma.schoolEvent, {
  orderBy: { date: "asc" },
  transformIn: (body) => ({
    title: body.title,
    category: body.category,
    date: new Date(body.date),
    description: body.description || null,
  }),
});
export { GET, POST };
