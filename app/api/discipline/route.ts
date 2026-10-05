import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";

const { GET, POST } = collectionHandlers(prisma.disciplineRecord, {
  include: { student: true },
  orderBy: { date: "desc" },
  transformIn: (body) => ({
    studentId: body.studentId,
    type: body.type,
    description: body.description,
  }),
  transformOut: (row) => ({
    ...row,
    studentName: row.student ? `${row.student.firstName} ${row.student.lastName}` : "",
  }),
});
export { GET, POST };
