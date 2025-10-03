import Image from "next/image";
import Link from "next/link";
import React from "react";
import NavItems from "./NavItems";
import UserDropdown from "./UserDropdown";

/**
 * Renders the top sticky header containing the logo, responsive navigation, and user dropdown.
 *
 * @returns A header element with a home-link logo image, navigation items for larger viewports, and a user dropdown menu.
 */
function Header() {
  return (
    <header className="header sticky top-0">
      <div className="header-wrapper container">
        <Link href="/">
          <Image
            src="/assets/images/logo.png"
            alt="Stocklytics"
            width={140}
            height={32}
            className="h-8 w-auto cursor-pointer "
          />
        </Link>
        <nav className="hidden sm:block">
          <NavItems />
        </nav>
        <UserDropdown />
      </div>
    </header>
  );
}

export default Header;
