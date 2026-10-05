import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import SubscriptionAdmin from "@/components/SubscriptionAdmin";

export default async function SubscriptionAdminPage() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") redirect("/subscription");
  return <SubscriptionAdmin />;
}