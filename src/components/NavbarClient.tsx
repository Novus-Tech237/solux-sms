"use client";

import { UserButton } from "@clerk/nextjs";
import { useSettings } from "@/context/SettingsContext";

interface NavbarClientProps {
  firstName?: string;
  lastName?: string;
  role?: string;
}

const NavbarClient = ({ firstName, lastName, role }: NavbarClientProps) => {
  const { t } = useSettings();

  return (
    <div className="flex items-center justify-between p-4 dark:bg-gray-800 dark:text-gray-100 border-b dark:border-gray-700">
      {/* ICONS AND USER */}
      <div className="flex items-center gap-6 justify-end w-full">
        {/* messages & announcements removed */}
        <div className="flex flex-col">
          <span className="text-xs leading-3 font-medium">
            {firstName} {lastName}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 text-right">{role}</span>
        </div>
        {/* <Image src="/avatar.png" alt="" width={36} height={36} className="rounded-full"/> */}
        <UserButton />
      </div>
    </div>
  );
};

export default NavbarClient;
