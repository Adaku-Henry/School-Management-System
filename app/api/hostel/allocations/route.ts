import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";

const { GET, POST } = collectionHandlers(prisma.hostelAllocation, {
  include: { student: true, room: true },
  orderBy: { allocatedAt: "desc" },
  transformIn: (body) => ({ studentId: body.studentId, roomId: body.roomId }),
  transformOut: (row) => ({
    ...row,
    studentName: row.student ? `${row.student.firstName} ${row.student.lastName}` : "",
    roomName: row.room?.name,
  }),
});
export { GET, POST };
