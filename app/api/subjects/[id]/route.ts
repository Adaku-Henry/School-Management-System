import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";

const { GET, PUT, DELETE } = itemHandlers(prisma.subject, {
  transformIn: (body) => ({
    name: body.name,
    code: body.code,
    creditUnits: body.creditUnits ? Number(body.creditUnits) : 1,
  }),
});

export { GET, PUT, DELETE };
