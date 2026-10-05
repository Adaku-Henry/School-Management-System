import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";

const { GET, POST } = collectionHandlers(prisma.schoolClass, {
  include: { streams: true, _count: { select: { students: true } } },
  orderBy: { order: "asc" },
  transformIn: (body) => ({
    name: body.name,
    order: body.order ? Number(body.order) : 0,
  }),
});

export { GET, POST };
