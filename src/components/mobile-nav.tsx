"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { getModuleNavLinks, isModuleNavActive, resolveModuleApiKey, moduleContextTitle } from "@/lib/api-module-nav";

export function MobileNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const apiKey = resolveModuleApiKey(pathname, searchParams);
  const links = getModuleNavLinks(apiKey);
  const contextLabel = moduleContextTitle(apiKey);

  return (
    <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b bg-white">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted">
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex items-center gap-3 px-5 py-5 border-b">
            <Image src="/LOGO_Same_Day.jpeg" alt="Same Day Solution" width={40} height={40} className="rounded-lg" />
            <p className="font-semibold text-sm">Same Day Solution</p>
          </div>
          <div className="border-b px-4 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Module</p>
            <p className="truncate text-xs font-semibold text-green-800">{contextLabel}</p>
          </div>
          <nav className="py-4 px-3 space-y-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = isModuleNavActive(href, pathname, searchParams);
              return (
                <Link
                  key={href + label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-green-50 text-green-700"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
      <Image src="/LOGO_Same_Day.jpeg" alt="Same Day Solution" width={32} height={32} className="rounded" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm truncate">{contextLabel}</p>
        <p className="text-[10px] text-muted-foreground truncate">Same Day API Portal</p>
      </div>
    </div>
  );
}
