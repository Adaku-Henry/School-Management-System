import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";

const { GET, PUT, DELETE } = itemHandlers(prisma.inventoryItem, {
  transformIn: (body) => ({
    name: body.name,
    category: body.category,
    quantity: Number(body.quantity) || 0,
    condition: body.condition || "Good",
    location: body.location || null,
  }),
});
export { GET, PUT, DELETE };
