import { prisma } from "@/lib/prisma";
import { collectionHandlers } from "@/lib/crud";

const { GET, POST } = collectionHandlers(prisma.stream, {
  include: {
    class: true,
    teacher: {
      include: {
        user: { select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, avatarColor: true, status: true } },
      },
    },
  },
  orderBy: { name: "asc" },
  transformIn: (body) => ({
    name: body.name,
    classId: body.classId,
    teacherId: body.teacherId || null,
  }),
  transformOut: (row: any) => ({
    ...row,
    className: row.class?.name,
    teacherName: row.teacher?.user?.name,
  }),
});

export { GET, POST };
