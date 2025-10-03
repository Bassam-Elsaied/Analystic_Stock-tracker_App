"use client";

import { navItems } from "@/lib/data";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

/**
 * Render a responsive list of navigation links and highlight the active item based on the current pathname.
 *
 * The root path ("/") is matched exactly; other paths are considered active when the current pathname starts with the item's href.
 *
 * @returns A JSX element containing a <ul> of navigation <Link> items where the active item has the `text-yellow-500` class applied.
 */
function NavItems() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <ul className="flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium">
      {navItems.map((item) => (
        <li key={item.label}>
          <Link
            href={item.href}
            className={`hover:text-yellow-500 transition-colors ${
              isActive(item.href) ? "text-yellow-500" : ""
            }`}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default NavItems;
