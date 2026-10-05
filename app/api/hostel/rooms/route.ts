import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";

const { GET, POST } = collectionHandlers(prisma.hostelRoom, {
  include: { allocations: true },
  orderBy: { name: "asc" },
  transformIn: (body) => ({ name: body.name, capacity: Number(body.capacity) || 4 }),
  transformOut: (row) => ({ ...row, occupied: row.allocations?.length || 0 }),
});
export { GET, POST };
