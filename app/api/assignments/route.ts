import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";

const { GET, POST } = collectionHandlers(prisma.assignment, {
  include: { submissions: true },
  orderBy: { dueDate: "desc" },
  transformIn: (body) => ({
    title: body.title,
    description: body.description || null,
    subjectId: body.subjectId || null,
    classId: body.classId || null,
    dueDate: new Date(body.dueDate),
  }),
  transformOut: (row) => ({ ...row, submissionCount: row.submissions?.length || 0 }),
});
export { GET, POST };
