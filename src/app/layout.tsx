import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://crediopulse.com"),
  title: {
    default: "Credio Pulse — Identity Protection Built Around You",
    template: "%s · Credio Pulse",
  },
  description:
    "Credio Pulse watches your credit, identity, and finances in real time. 3-bureau credit scores, dark-web monitoring, $1M identity theft insurance, and U.S.-based restoration specialists.",
  keywords: [
    "identity protection",
    "credit monitoring",
    "credit score",
    "dark web monitoring",
    "identity theft insurance",
    "Credio Pulse",
  ],
  openGraph: {
    title: "Credio Pulse — Identity Protection Built Around You",
    description:
      "Real-time credit & identity protection with 3-bureau scores, dark-web alerts, and $1M theft insurance.",
    url: "https://crediopulse.com",
    siteName: "Credio Pulse",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${hanken.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-ink">{children}</body>
    </html>
  );
}
