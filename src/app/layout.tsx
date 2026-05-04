import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LanguageProvider } from "@/context/language-context";
import { AuthProvider } from "@/context/auth-context";
import { FavoritesProvider } from "@/context/favorites-context";
import { RentalFlowProvider } from "@/context/rental-flow-context";
import { PropertiesProvider } from "@/context/properties-context";
import { LoadingProvider } from "@/context/loading-context";
import { PageProgress } from "@/components/page-progress";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "A.A Rental Control System",
  description:
    "Addis Ababa Residential House Rental Control and Administration System — Modernizing rental governance through transparency, compliance, and efficiency.",
  other: {
    "color-scheme": "light",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" style={{ colorScheme: "light" }} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-slate-900`}
        suppressHydrationWarning
      >
        <LoadingProvider>
          <PageProgress />
          <AuthProvider>
            <FavoritesProvider>
              <PropertiesProvider>
                <RentalFlowProvider>
                  <LanguageProvider>{children}</LanguageProvider>
                </RentalFlowProvider>
              </PropertiesProvider>
            </FavoritesProvider>
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
