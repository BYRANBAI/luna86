import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Луна · цифровая экосистема кафе",
  description: "Единая платформа кафе «Луна»: меню, заказы, кухня, склад и аналитика.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
