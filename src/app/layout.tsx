import type { Metadata } from "next";
import { Anybody, Azeret_Mono, Familjen_Grotesk } from "next/font/google";
import "./globals.css";

const anybody = Anybody({
  variable: "--font-anybody",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const familjen = Familjen_Grotesk({
  variable: "--font-familjen",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const azeret = Azeret_Mono({
  variable: "--font-azeret",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "KnownGate — every answer, with its source",
  description: "A verification layer where agents propose, the page rules, and humans own the premise.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${anybody.variable} ${familjen.variable} ${azeret.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}<footer className="site-footer">KnownGate reports sourced evidence, not medical advice. Always verify with the manufacturer or venue when the stakes are high.</footer></body>
    </html>
  );
}
