import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://clothflow.com"),
  title: { default: "ClothFlow | إدارة المخزون والمبيعات", template: "%s | ClothFlow" },
  description: "ClothFlow منصة SaaS لإدارة مخزون ومبيعات متاجر الملابس بسهولة وأمان.",
  applicationName: "ClothFlow",
  keywords: ["ClothFlow", "إدارة المخزون", "إدارة المبيعات", "متاجر الملابس", "SaaS"],
  openGraph: { type: "website", siteName: "ClothFlow", title: "ClothFlow | إدارة المخزون والمبيعات", description: "منصة SaaS لإدارة مخزون ومبيعات متاجر الملابس." },
  twitter: { card: "summary", title: "ClothFlow | إدارة المخزون والمبيعات", description: "منصة SaaS لإدارة مخزون ومبيعات متاجر الملابس." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
