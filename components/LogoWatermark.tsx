"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";

export default function LogoWatermark() {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard/finances")) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
      <Image
        src="/hybrid fitness logo.png"
        alt=""
        width={600}
        height={600}
        className="w-[55vw] max-w-[580px] opacity-40 select-none"
        style={{ mixBlendMode: "screen" }}
        priority
      />
    </div>
  );
}
