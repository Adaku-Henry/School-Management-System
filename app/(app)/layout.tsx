import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const [user, school] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId }, select: { avatarUrl: true } }),
    prisma.schoolSettings.findUnique({ where: { id: "settings" }, select: { schoolName: true, logoUrl: true } }),
  ]);

  return (
    <div className="min-h-screen flex bg-slate-50 print:bg-white">
      <div className="print:hidden">
        <Sidebar role={session.role} schoolName={school?.schoolName} schoolLogoUrl={school?.logoUrl} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="print:hidden">
          <Topbar session={session} avatarUrl={user?.avatarUrl} />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto print:p-0 print:max-w-none">{children}</main>
      </div>
    </div>
  );
}
