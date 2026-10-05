import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";

const { GET, POST } = collectionHandlers(prisma.certificate, {
  include: { student: true },
  orderBy: { issueDate: "desc" },
  transformIn: (body) => ({ studentId: body.studentId, type: body.type }),
  transformOut: (row) => ({
    ...row,
    studentName: row.student ? `${row.student.firstName} ${row.student.lastName}` : "",
  }),
});
export { GET, POST };
