import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "KnownGate · every answer, with its source",
  description: "A verification layer where agents propose, the page rules, and humans own the premise.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      {/*
        One footer per page. The scaffold's disclaimer used to sit here as a
        second one, saying something no frame draws and duplicating the line
        the real footer already carries.
      */}
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
