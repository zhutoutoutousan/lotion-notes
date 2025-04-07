import { Metadata } from "next";

export const metadata: Metadata = {
  title: "News Explorer | Lotion Notes",
  description: "Explore news articles from around the world with translation capabilities.",
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
} 