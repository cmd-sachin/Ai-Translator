import "./globals.css";

export const metadata = {
  title: "AI-Translater",
  description: "AI Translater",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
