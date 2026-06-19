import { Plus } from "lucide-react";
import CopyButton from "@/components/dash/CopyButton";
import { Badge, Card, EmptyState, PageHeader } from "@/components/dash/ui";
import { createLink, toggleLink } from "@/lib/actions/affiliate";
import { requireAffiliate } from "@/lib/auth-helpers";
import { getRequestOrigin } from "@/lib/base-url";
import { num, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function LinksPage() {
  const { affiliate } = await requireAffiliate();
  const links = await prisma.affiliateLink.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { clicks: true, conversions: true } } },
  });

  const origin = await getRequestOrigin();
  const defaultLink = `${origin}/r/${affiliate.refCode}`;

  return (
    <div>
      <PageHeader
        title="My Links"
        subtitle="Generate tracking links for different campaigns and pages."
      />

      {/* Default link */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-ink">Default link</p>
              <Badge tone="blue">{affiliate.refCode}</Badge>
            </div>
            <p className="mt-1 font-mono text-sm text-brand-700">
              {defaultLink}
            </p>
          </div>
          <CopyButton text={defaultLink} label="Copy" />
        </div>
      </Card>

      {/* Create */}
      <Card className="mb-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">
          Create a campaign link
        </h2>
        <form
          action={createLink}
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <input
            name="label"
            placeholder="Campaign name (e.g. Reddit Q3)"
            className="rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          <input
            name="destination"
            placeholder="Destination path"
            defaultValue="/signup?plan=starter&cycle=monthly"
            className="rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          <button
            type="submit"
            className="press inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500"
          >
            <Plus className="h-4 w-4" /> Create
          </button>
        </form>
      </Card>

      {/* List */}
      {links.length === 0 ? (
        <EmptyState>No campaign links yet. Create one above.</EmptyState>
      ) : (
        <div className="space-y-3">
          {links.map((link) => {
            const url = `${origin}/r/${link.code}`;
            return (
              <Card key={link.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink">
                        {link.label ?? "Untitled"}
                      </p>
                      {link.isActive ? (
                        <Badge tone="green">Active</Badge>
                      ) : (
                        <Badge tone="gray">Paused</Badge>
                      )}
                    </div>
                    <p className="mt-1 truncate font-mono text-sm text-brand-700">
                      {url}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      → {link.destination} · created {shortDate(link.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="font-display text-lg font-bold text-ink">
                        {num(link._count.clicks)}
                      </p>
                      <p className="text-xs text-ink-soft">clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="font-display text-lg font-bold text-ink">
                        {num(link._count.conversions)}
                      </p>
                      <p className="text-xs text-ink-soft">sales</p>
                    </div>
                    <CopyButton text={url} />
                    <form action={toggleLink}>
                      <input type="hidden" name="id" value={link.id} />
                      <button
                        type="submit"
                        className="press rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-brand-50"
                      >
                        {link.isActive ? "Pause" : "Activate"}
                      </button>
                    </form>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
