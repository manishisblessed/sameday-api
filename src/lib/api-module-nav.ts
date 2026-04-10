import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  HardDrive,
  Download,
  Landmark,
  Send,
  Building2,
  HandCoins,
  Fingerprint,
  Smartphone,
  WalletCards,
  Layers,
} from "lucide-react";

export type ModuleNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Infer which API “context” we’re in from path + query (POS pages without ?api still count as POS). */
export function resolveModuleApiKey(pathname: string, searchParams: URLSearchParams): string | null {
  const q = searchParams.get("api");
  if (q) return q;
  if (
    pathname.startsWith("/transactions") ||
    pathname.startsWith("/machines") ||
    pathname.startsWith("/exports")
  ) {
    return "pos-transaction-api";
  }
  return null;
}

export function moduleContextTitle(apiKey: string | null): string {
  switch (apiKey) {
    case "settlement":
      return "Settlement · Payout";
    case "bbps":
      return "BBPS";
    case "dmt":
      return "DMT";
    case "aeps":
      return "AEPS";
    case "recharges":
      return "Recharges";
    case "pos-transaction-api":
      return "POS Partner API";
    default:
      return "Same Day API Portal";
  }
}

export function getModuleNavLinks(apiKey: string | null): ModuleNavItem[] {
  const modules: ModuleNavItem = { href: "/", label: "API Modules", icon: LayoutDashboard };

  const pos: ModuleNavItem[] = [
    modules,
    { href: "/?api=pos-transaction-api", label: "POS dashboard", icon: WalletCards },
    { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
    { href: "/machines", label: "POS Machines", icon: HardDrive },
    { href: "/exports", label: "Exports", icon: Download },
  ];

  if (!apiKey || apiKey === "pos-transaction-api") {
    return pos;
  }

  if (apiKey === "settlement") {
    return [modules, { href: "/?api=settlement", label: "Payouts", icon: Send }];
  }

  if (apiKey === "bbps") {
    return [modules, { href: "/?api=bbps", label: "BBPS dashboard", icon: Building2 }];
  }

  if (apiKey === "dmt") {
    return [modules, { href: "/?api=dmt", label: "DMT dashboard", icon: HandCoins }];
  }

  if (apiKey === "aeps") {
    return [modules, { href: "/?api=aeps", label: "AEPS dashboard", icon: Fingerprint }];
  }

  if (apiKey === "recharges") {
    return [modules, { href: "/?api=recharges", label: "Recharges dashboard", icon: Smartphone }];
  }

  return [modules, { href: `/?api=${apiKey}`, label: "Module dashboard", icon: Layers }];
}

export function isModuleNavActive(href: string, pathname: string, searchParams: URLSearchParams): boolean {
  if (href === "/") {
    return pathname === "/" && !searchParams.get("api");
  }
  if (href.startsWith("/?")) {
    const q = href.slice(2);
    const api = new URLSearchParams(q).get("api");
    if (api) return pathname === "/" && searchParams.get("api") === api;
  }
  if (href === pathname) return true;
  return href !== "/" && pathname.startsWith(href.endsWith("/") ? href : `${href}/`);
}
