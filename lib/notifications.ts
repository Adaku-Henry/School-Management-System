type NotificationPayload = {
  eventKey: string;
  eventType: string;
  category: string;
  title: string;
  message: string;
  studentStatusMessage?: string;
  href?: string;
  priority?: string;
};

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  try { return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}

export async function createInAppNotification(db: any, userId: string, payload: NotificationPayload) {
  const [preference, user] = await Promise.all([
    db.notificationPreference.findUnique({ where: { userId } }),
    db.user.findUnique({ where: { id: userId }, select: { role: true } }),
  ]);
  if (!user) return;

  const channels = parseJson<Record<string, boolean>>(preference?.channels, { IN_APP: true });
  if (!channels.IN_APP) return;

  let message = payload.message;
  if (payload.category === "FINANCE" && user.role === "STUDENT") {
    const visibility = preference?.studentFinanceVisibility || "NONE";
    if (visibility === "NONE") return;
    if (visibility === "STATUS") message = payload.studentStatusMessage || "A fee account update is available.";
  }

  await db.notification.upsert({
    where: { userId_eventKey: { userId, eventKey: payload.eventKey } },
    update: {},
    create: {
      userId,
      eventKey: payload.eventKey,
      eventType: payload.eventType,
      category: payload.category,
      title: payload.title,
      message,
      href: payload.href || null,
      priority: payload.priority || "NORMAL",
    },
  });
}

export async function notifyFeeRecipients(db: any, {
  eventKey,
  eventType,
  title,
  messageFor,
  statusMessageFor,
  href,
  studentIds,
  parentUserIds,
}: {
  eventKey: string;
  eventType: string;
  title: string;
  messageFor: (studentName: string, studentId: string) => string;
  statusMessageFor: (studentName: string, studentId: string) => string;
  href: (studentId: string) => string;
  studentIds: string[];
  parentUserIds: Array<{ studentId: string; userId: string }>;
}) {
  const students = studentIds.length
    ? await db.studentProfile.findMany({ where: { id: { in: studentIds } }, select: { id: true, userId: true, firstName: true, lastName: true } })
    : [];
  const notifications: Promise<void>[] = [];

  for (const student of students) {
    const studentName = `${student.firstName} ${student.lastName}`;
    const payload = {
      eventKey: `${eventKey}:${student.id}`,
      eventType,
      category: "FINANCE",
      title,
      message: messageFor(studentName, student.id),
      studentStatusMessage: statusMessageFor(studentName, student.id),
      href: href(student.id),
    };
    if (student.userId) notifications.push(createInAppNotification(db, student.userId, payload));
    for (const parent of parentUserIds.filter((recipient) => recipient.studentId === student.id)) {
      notifications.push(createInAppNotification(db, parent.userId, payload));
    }
  }

  await Promise.all(notifications);
}

export function totalFeeAmount(structure: { amount: number; optionalCharges?: string | null }) {
  const charges = parseJson<Array<{ amount?: number } | number>>(structure.optionalCharges, []);
  return Number(structure.amount) + charges.reduce<number>((total, charge) => {
    const amount = typeof charge === "number" ? charge : Number(charge.amount || 0);
    return Number.isFinite(amount) ? total + amount : total;
  }, 0);
}