import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { LanguageProvider } from "@/context/language-context";
import { AuthProvider } from "@/context/auth-context";
import { FavoritesProvider } from "@/context/favorites-context";
import { RentalFlowProvider } from "@/context/rental-flow-context";
import { PropertiesProvider } from "@/context/properties-context";
import { LoadingProvider } from "@/context/loading-context";
import { AlertProvider } from "@/context/alert-context";
import { PageProgress } from "@/components/page-progress";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "A.A Rental Control System",
  description:
    "Addis Ababa Residential House Rental Control and Administration System — Modernizing rental governance through transparency, compliance, and efficiency.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased bg-surface text-stone-900 dark:bg-[#050505] dark:text-stone-100`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <LoadingProvider>
            <PageProgress />
            <AuthProvider>
              <FavoritesProvider>
                <PropertiesProvider>
                  <RentalFlowProvider>
                    <LanguageProvider>
                      <AlertProvider>{children}</AlertProvider>
                    </LanguageProvider>
                  </RentalFlowProvider>
                </PropertiesProvider>
              </FavoritesProvider>
            </AuthProvider>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
