"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, ArrowLeftRight, HardDrive, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/machines", label: "POS Machines", icon: HardDrive },
  { href: "/exports", label: "Exports", icon: Download },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 flex-col border-r bg-white">
      <div className="flex items-center gap-3 px-5 py-5 border-b">
        <Image src="/logo.jpeg" alt="Same Day Solution" width={48} height={48} className="rounded-lg" />
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">Same Day Solution</p>
          <p className="text-[11px] text-muted-foreground italic leading-tight">Aapke Har Transaction Ka Saathi</p>
        </div>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
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
        <p className="text-[10px] text-muted-foreground leading-tight">POS Partner API Portal</p>
        <p className="text-[10px] text-muted-foreground">Same Day Solution Pvt Ltd</p>
      </div>
    </aside>
  );
}
