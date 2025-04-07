import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Database Management | Lotion Notes",
  description: "Manage your vocabulary database with an AWS-style interface.",
};

export default function DatabaseLayout({
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