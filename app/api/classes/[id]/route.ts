import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";

const { GET, PUT, DELETE } = itemHandlers(prisma.schoolClass, {
  include: { streams: true },
  transformIn: (body) => ({
    name: body.name,
    order: body.order ? Number(body.order) : 0,
  }),
});

export { GET, PUT, DELETE };
