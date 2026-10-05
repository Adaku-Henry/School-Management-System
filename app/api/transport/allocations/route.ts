import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";

const { GET, POST } = collectionHandlers(prisma.transportAllocation, {
  include: { student: true, route: true },
  transformIn: (body) => ({ studentId: body.studentId, routeId: body.routeId }),
  transformOut: (row) => ({
    ...row,
    studentName: row.student ? `${row.student.firstName} ${row.student.lastName}` : "",
    routeName: row.route?.name,
  }),
});
export { GET, POST };
