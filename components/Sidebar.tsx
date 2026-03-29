"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, DollarSign, Settings, LogOut, Dumbbell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/members", icon: Users, label: "Members" },
  { href: "/dashboard/finances", icon: DollarSign, label: "Finances" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-16 bg-[#09090b] border-r border-zinc-800 flex flex-col items-center py-4 z-50">
      {/* Logo */}
      <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center mb-8">
        <Dumbbell className="w-4 h-4 text-blue-500" />
      </div>

      {/* Nav */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "group relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                isActive
                  ? "bg-blue-600/15 text-blue-400"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r-full -ml-[1px]" />
              )}
              <Icon className="w-4.5 h-4.5" strokeWidth={isActive ? 2 : 1.75} />

              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 text-zinc-200 text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        title="Sign out"
        className="group relative w-10 h-10 rounded-xl flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
      >
        <LogOut className="w-4 h-4" strokeWidth={1.75} />
        <span className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 text-zinc-200 text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
          Sign out
        </span>
      </button>
    </aside>
  );
}
