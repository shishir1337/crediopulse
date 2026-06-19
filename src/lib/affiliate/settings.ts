import { prisma } from "@/lib/prisma";

/** Returns the global settings row, creating defaults on first use. */
export async function getSettings() {
  const existing = await prisma.setting.findUnique({ where: { id: "global" } });
  if (existing) return existing;
  return prisma.setting.create({ data: { id: "global" } });
}
