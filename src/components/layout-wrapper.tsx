"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { SidebarNav } from "@/components/sidebar-nav";
import { MobileNav } from "@/components/mobile-nav";
import { HealthBanner } from "@/components/health-banner";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const isHomePage = pathname === "/" && !searchParams.get("api");
  const isSettlementRoute = pathname === "/" && searchParams.get("api") === "settlement";

  return (
    <div className="flex flex-1 min-h-screen">
      {!isHomePage && <SidebarNav />}
      <div className="flex flex-1 flex-col min-w-0">
        {!isHomePage && <MobileNav />}
        {!isHomePage && !isSettlementRoute && <HealthBanner />}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
