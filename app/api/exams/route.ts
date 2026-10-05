import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";

const { GET, POST } = collectionHandlers(prisma.exam, {
  include: { class: true, _count: { select: { results: true } } },
  orderBy: { date: "desc" },
  transformIn: (body) => ({
    name: body.name,
    type: body.type || "CAT",
    academicYear: body.academicYear,
    term: body.term,
    classId: body.classId || null,
    date: body.date ? new Date(body.date) : new Date(),
  }),
  transformOut: (row: any) => ({ ...row, className: row.class?.name, resultsCount: row._count?.results ?? 0 }),
});

export { GET, POST };
