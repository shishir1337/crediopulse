import ClicksTable from "@/components/dash/ClicksTable";
import { PageHeader } from "@/components/dash/ui";
import { requireAffiliate } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function ClicksPage() {
  const { affiliate } = await requireAffiliate();
  const clicks = await prisma.click.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Clicks"
        subtitle="Every click on your links — device, location, and quality, scored in real time."
      />
      <ClicksTable clicks={clicks} showFullIp={false} />
    </div>
  );
}
