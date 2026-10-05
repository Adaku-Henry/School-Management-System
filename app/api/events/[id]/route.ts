import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";

const { GET, PUT, DELETE } = itemHandlers(prisma.schoolEvent, {
  transformIn: (body) => ({
    title: body.title,
    category: body.category,
    date: new Date(body.date),
    description: body.description || null,
  }),
});
export { GET, PUT, DELETE };
