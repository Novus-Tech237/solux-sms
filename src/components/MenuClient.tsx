"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type MenuItem = {
  title: string;
  items: Array<{
    icon: string;
    label: string;
    href: string;
    visible: string[];
  }>;
};

const MenuClient = ({ menuItems, role }: { menuItems: MenuItem[]; role: string }) => {
  const pathname = usePathname() || "/";

  const linkClass = (isActive: boolean) =>
    `flex items-center justify-center lg:justify-start gap-4 py-2 md:px-2 rounded-md transition-colors ${
      isActive ? "bg-orange-500 text-gray-900 font-semibold" : "text-gray-500 hover:bg-lamaSkyLight"
    }`;

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((group) => (
        <div className="flex flex-col gap-2" key={group.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">{group.title}</span>
          {group.items.map((item) => {
            if (!item.visible.includes(role)) return null;

            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link href={item.href} key={item.label} className={linkClass(isActive)} aria-current={isActive ? "page" : undefined}>
                <Image src={item.icon} alt="" width={20} height={20} />
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default MenuClient;
