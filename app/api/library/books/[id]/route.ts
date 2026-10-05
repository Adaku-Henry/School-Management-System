import { prisma } from "@/lib/prisma";
import { itemHandlers } from "@/lib/crud";

const { GET, PUT, DELETE } = itemHandlers(prisma.book, {
  transformIn: (body) => ({
    title: body.title,
    author: body.author,
    isbn: body.isbn,
    copies: Number(body.copies) || 1,
    available: body.available !== undefined ? Number(body.available) : Number(body.copies) || 1,
  }),
});
export { GET, PUT, DELETE };
