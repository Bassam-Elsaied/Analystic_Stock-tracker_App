import React from "react";
import Header from "@/components/Header";

/**
 * Root layout component that renders the page shell with a header and a padded content container.
 *
 * @param children - The page content to render inside the layout's container.
 * @returns The JSX element containing the Header and the provided children.
 */
function layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen text-gray-400">
      <Header />
      <div className="container py-10">{children}</div>
    </main>
  );
}

export default layout;
