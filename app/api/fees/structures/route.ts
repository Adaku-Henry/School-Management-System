import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";

const { GET, POST } = collectionHandlers(prisma.feeStructure, {
  include: { class: true },
  orderBy: { academicYear: "desc" },
  transformIn: (body) => ({
    classId: body.classId,
    term: body.term,
    academicYear: body.academicYear,
    amount: Number(body.amount) || 0,
  }),
  transformOut: (row) => ({ ...row, className: row.class?.name }),
});
export { GET, POST };
