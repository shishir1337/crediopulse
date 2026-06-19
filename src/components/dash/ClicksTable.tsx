import { Bot, Monitor, Smartphone, Tablet } from "lucide-react";
import { dateTime, maskIp } from "@/lib/format";
import { FRAUD_LABELS } from "@/lib/fraud/engine";
import { Badge, EmptyState, StatusBadge, Table, Td, Th } from "./ui";

type ClickRow = {
  id: string;
  createdAt: Date;
  ip: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  isp: string | null;
  asn: string | null;
  userAgent: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  referer: string | null;
  status: string;
  isUnique: boolean;
  flags: string[];
};

const DEVICE_ICON: Record<string, typeof Monitor> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  bot: Bot,
};

export default function ClicksTable({
  clicks,
  showFullIp = false,
}: {
  clicks: ClickRow[];
  showFullIp?: boolean;
}) {
  if (clicks.length === 0) {
    return <EmptyState>No clicks recorded yet.</EmptyState>;
  }

  return (
    <Table
      head={
        <tr>
          <Th>Time</Th>
          <Th>IP address</Th>
          <Th>Device</Th>
          <Th>Client</Th>
          <Th>Location</Th>
          <Th>Network</Th>
          <Th>Quality</Th>
          <Th>Signals</Th>
        </tr>
      }
    >
      {clicks.map((c) => {
        const Icon = DEVICE_ICON[c.device ?? ""] ?? Monitor;
        const location = [c.city, c.region, c.country]
          .filter(Boolean)
          .join(", ");
        return (
          <tr key={c.id}>
            <Td className="whitespace-nowrap text-ink-soft">
              {dateTime(c.createdAt)}
            </Td>
            <Td className="whitespace-nowrap font-mono text-xs text-ink">
              {showFullIp ? (c.ip ?? "—") : maskIp(c.ip)}
            </Td>
            <Td>
              <span className="inline-flex items-center gap-1.5 capitalize">
                <Icon className="h-4 w-4 text-ink-soft" />
                {c.device ?? "—"}
              </span>
            </Td>
            <Td>
              <span title={c.userAgent ?? undefined} className="cursor-help">
                <span className="font-medium text-ink">{c.browser ?? "—"}</span>
                <span className="text-ink-soft"> · {c.os ?? "—"}</span>
              </span>
            </Td>
            <Td className="text-ink-soft">{location || "—"}</Td>
            <Td className="text-ink-soft">
              <span
                title={c.isp ?? undefined}
                className="block max-w-[11rem] truncate"
              >
                {c.isp ?? "—"}
              </span>
            </Td>
            <Td>
              <div className="flex items-center gap-1.5">
                <StatusBadge status={c.status} />
                {!c.isUnique && <Badge tone="gray">dup</Badge>}
              </div>
            </Td>
            <Td>
              <div className="flex flex-wrap gap-1">
                {c.flags.length === 0 ? (
                  <span className="text-xs text-ink-soft">clean</span>
                ) : (
                  c.flags.map((f) => (
                    <Badge key={f} tone="red">
                      {FRAUD_LABELS[f] ?? f}
                    </Badge>
                  ))
                )}
              </div>
            </Td>
          </tr>
        );
      })}
    </Table>
  );
}
