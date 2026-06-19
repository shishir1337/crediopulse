import { UserPlus } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
  Table,
  Td,
  Th,
} from "@/components/dash/ui";
import {
  createAffiliateAccount,
  setAffiliateStatus,
} from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth-helpers";
import { num, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const inputCls =
  "rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

const NOTICES: Record<string, { tone: "ok" | "err"; text: string }> = {
  "1": { tone: "ok", text: "Affiliate account created." },
  invalid: {
    tone: "err",
    text: "Enter a name, valid email, and a password of at least 8 characters.",
  },
  exists: {
    tone: "err",
    text: "Could not create that account — the email may already be in use.",
  },
};

function StatusButton({
  id,
  status,
  label,
  tone,
}: {
  id: string;
  status: string;
  label: string;
  tone: string;
}) {
  return (
    <form action={setAffiliateStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={`press rounded-lg px-2.5 py-1 text-xs font-semibold ${tone}`}
      >
        {label}
      </button>
    </form>
  );
}

export default async function AdminAffiliates({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  await requireAdmin();
  const { created, error } = await searchParams;
  const notice = NOTICES[created ?? error ?? ""];

  const affiliates = await prisma.affiliate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      _count: { select: { clicks: true, conversions: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Affiliates"
        subtitle="Create affiliate accounts and manage their standing."
      />

      {notice && (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-sm font-medium ${
            notice.tone === "ok"
              ? "border-meter-excellent/30 bg-meter-excellent/10 text-meter-excellent"
              : "border-meter-poor/30 bg-meter-poor/10 text-meter-poor"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Create affiliate */}
      <Card className="mb-6">
        <h2 className="mb-1 font-display text-lg font-semibold text-ink">
          Create affiliate
        </h2>
        <p className="mb-4 text-sm text-ink-soft">
          Affiliates can&apos;t sign up themselves. Create the account here,
          then share the email + temporary password — they log in at{" "}
          <span className="font-mono text-ink">/login</span>.
        </p>
        <form
          action={createAffiliateAccount}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <input
            name="name"
            placeholder="Full name"
            required
            className={inputCls}
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className={inputCls}
          />
          <input
            name="password"
            type="text"
            placeholder="Temp password (min 8)"
            required
            minLength={8}
            className={inputCls}
          />
          <button
            type="submit"
            className="press inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
          >
            <UserPlus className="h-4 w-4" /> Create
          </button>
        </form>
      </Card>

      {affiliates.length === 0 ? (
        <EmptyState>No affiliates yet.</EmptyState>
      ) : (
        <Table
          head={
            <tr>
              <Th>Affiliate</Th>
              <Th>Status</Th>
              <Th>Trust</Th>
              <Th>Clicks</Th>
              <Th>Sales</Th>
              <Th>Joined</Th>
              <Th>Actions</Th>
            </tr>
          }
        >
          {affiliates.map((a) => (
            <tr key={a.id}>
              <Td>
                <a
                  href={`/admin/affiliates/${a.id}`}
                  className="font-semibold text-brand-700 hover:underline"
                >
                  {a.user.name}
                </a>
                <p className="text-xs text-ink-soft">{a.user.email}</p>
                {a.user.role === "admin" && <Badge tone="blue">admin</Badge>}
              </Td>
              <Td>
                <StatusBadge status={a.status} />
              </Td>
              <Td>
                <Badge
                  tone={
                    a.trustScore >= 70
                      ? "green"
                      : a.trustScore >= 40
                        ? "amber"
                        : "red"
                  }
                >
                  {a.trustScore}
                </Badge>
              </Td>
              <Td>{num(a._count.clicks)}</Td>
              <Td>{num(a._count.conversions)}</Td>
              <Td className="text-ink-soft">{shortDate(a.createdAt)}</Td>
              <Td>
                <div className="flex flex-wrap gap-1.5">
                  {a.status !== "ACTIVE" && (
                    <StatusButton
                      id={a.id}
                      status="ACTIVE"
                      label="Approve"
                      tone="bg-meter-excellent/12 text-meter-excellent"
                    />
                  )}
                  {a.status !== "SUSPENDED" && a.status !== "BANNED" && (
                    <StatusButton
                      id={a.id}
                      status="SUSPENDED"
                      label="Suspend"
                      tone="bg-meter-fair/15 text-[#b45309]"
                    />
                  )}
                  {a.status !== "BANNED" && (
                    <StatusButton
                      id={a.id}
                      status="BANNED"
                      label="Ban"
                      tone="bg-meter-poor/12 text-meter-poor"
                    />
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
