"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getModuleNavLinks, isModuleNavActive, resolveModuleApiKey, moduleContextTitle } from "@/lib/api-module-nav";

export function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const apiKey = resolveModuleApiKey(pathname, searchParams);
  const links = getModuleNavLinks(apiKey);
  const contextLabel = moduleContextTitle(apiKey);

  return (
    <aside className="hidden md:flex md:w-64 flex-col border-r bg-white">
      <div className="flex items-center gap-3 px-5 py-5 border-b">
        <Image src="/LOGO_Same_Day.jpeg" alt="Same Day Solution" width={48} height={48} className="rounded-lg" />
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">Same Day Solution</p>
          <p className="text-[11px] text-muted-foreground italic leading-tight">Aapke Har Transaction Ka Saathi</p>
        </div>
      </div>
      <div className="border-b px-4 py-2.5">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Module</p>
        <p className="truncate text-xs font-semibold text-green-800">{contextLabel}</p>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = isModuleNavActive(href, pathname, searchParams);
          return (
            <Link
              key={href + label}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t">
        <p className="text-[10px] text-muted-foreground leading-tight">Same Day API Portal</p>
        <p className="text-[10px] text-muted-foreground">Same Day Solution Pvt Ltd</p>
      </div>
    </aside>
  );
}
