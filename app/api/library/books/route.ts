import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";

const { GET, POST } = collectionHandlers(prisma.book, {
  orderBy: { title: "asc" },
  transformIn: (body) => ({
    title: body.title,
    author: body.author,
    isbn: body.isbn,
    copies: Number(body.copies) || 1,
    available: body.available !== undefined ? Number(body.available) : Number(body.copies) || 1,
  }),
});
export { GET, POST };
