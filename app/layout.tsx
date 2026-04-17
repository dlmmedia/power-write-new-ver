import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { ConditionalClerkProvider } from "@/components/providers/ConditionalClerkProvider";
import { Providers } from "@/components/providers/Providers";
import { MainNav } from "@/components/layout/MainNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Display serif used for editorial headings on marketing surfaces and
// any "book-feel" moments. Variable font so weight/optical-size are free.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: "PowerWrite - AI Book Generator",
  description: "AI-powered book generation platform. Write your next masterpiece in minutes with offline reading support.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PowerWrite",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#fbbf24",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConditionalClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="PowerWrite" />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  var saved = localStorage.getItem('theme');
                  var valid = ['light', 'dark', 'system'];
                  var theme = (saved && valid.indexOf(saved) !== -1) ? saved :
                    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.classList.add(theme);
                })();
              `,
            }}
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
        >
          {/* Keyboard skip-link — the very first focusable stop on every
           * page so keyboard users can jump straight to <main> without
           * tabbing through the sticky nav. Hidden until focused. */}
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <Providers>
            <MainNav />
            {children}
          </Providers>
        </body>
      </html>
    </ConditionalClerkProvider>
  );
}
