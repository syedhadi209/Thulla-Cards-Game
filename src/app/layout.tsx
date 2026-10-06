import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Thulla",
  description: "Real-time multiplayer Thulla card game",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-[family-name:var(--font-body)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
