import { Link } from "@remix-run/react";

import { siteConfig } from "~/config/site";

export function MainNav() {
  return (
    <div className="hidden md:flex">
      <Link to="/" className="mr-6 flex items-center">
        <span className="hidden text-xl font-bold sm:inline-block">
          {siteConfig.name}
        </span>
      </Link>
    </div>
  );
}
