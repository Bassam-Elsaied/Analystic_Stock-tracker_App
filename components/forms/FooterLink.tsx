import Link from "next/link";
import React from "react";

function FooterLink({ text, href, linkText }: FooterLinkProps) {
  return (
    <div className="text-center pt-4">
      <p className="text-gray-500 text-sm">
        {text}
        <Link href={href} className="footer-link">
          {linkText}
        </Link>
      </p>
    </div>
  );
}

export default FooterLink;
