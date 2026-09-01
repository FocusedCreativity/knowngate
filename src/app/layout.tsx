import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { KNOWNGATE_DEFINITION, KNOWNGATE_ORIGIN, KNOWNGATE_SAME_AS } from "@/lib/kg/entity";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const GA_ID = "G-1MCC3DE4F9";

export const metadata: Metadata = {
  metadataBase: new URL(KNOWNGATE_ORIGIN),
  title: "KnownGate · every answer, with its source",
  description: KNOWNGATE_DEFINITION,
  openGraph: {
    siteName: "KnownGate",
    type: "website",
    url: KNOWNGATE_ORIGIN,
    title: "KnownGate · every answer, with its source",
    description: KNOWNGATE_DEFINITION,
  },
  twitter: {
    card: "summary_large_image",
    title: "KnownGate · every answer, with its source",
    description: KNOWNGATE_DEFINITION,
  },
};

/**
 * Who KnownGate is, for the machines that resolve entities rather than read
 * pages. Minimal and true: sameAs carries only places that exist today.
 */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "KnownGate",
  url: KNOWNGATE_ORIGIN,
  description: KNOWNGATE_DEFINITION,
  logo: `${KNOWNGATE_ORIGIN}/kg/living-loop.svg`,
  sameAs: KNOWNGATE_SAME_AS,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        {/*
          The layout is the "every page" guarantee: one tag here rather than a
          copy per route, which is how a page ends up counted twice or not at
          all. afterInteractive keeps it out of the critical path while still
          firing on every navigation.
        */}
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
        <script
          type="application/ld+json"
          // A literal object authored above, serialised; no external input
          // reaches it.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      {/*
        One footer per page. The scaffold's disclaimer used to sit here as a
        second one, saying something no frame draws and duplicating the line
        the real footer already carries.
      */}
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
