import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";

const { GET, POST } = collectionHandlers(prisma.subject, {
  orderBy: { name: "asc" },
  transformIn: (body) => ({
    name: body.name,
    code: body.code,
    creditUnits: body.creditUnits ? Number(body.creditUnits) : 1,
  }),
});

export { GET, POST };
