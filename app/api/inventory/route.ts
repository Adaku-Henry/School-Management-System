import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";

const { GET, POST } = collectionHandlers(prisma.inventoryItem, {
  orderBy: { name: "asc" },
  transformIn: (body) => ({
    name: body.name,
    category: body.category,
    quantity: Number(body.quantity) || 0,
    condition: body.condition || "Good",
    location: body.location || null,
  }),
});
export { GET, POST };
