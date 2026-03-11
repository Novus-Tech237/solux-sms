"use client";

import Image from "next/image";
import { useSettings } from "@/context/SettingsContext";

const UserCardClient = ({
  type,
  count,
}: {
  type: "admin" | "teacher" | "student";
  count: number;
}) => {
  const { t } = useSettings();

  const typeMap: Record<string, string> = {
    admin: t("admin"),
    teacher: t("teachers"),
    student: t("students"),
  };

  return (
    <div className="rounded-2xl odd:bg-lamaPurple even:bg-lamaYellow p-4 flex-1 min-w-[130px] dark:odd:bg-purple-900 dark:even:bg-yellow-900">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
          2024/25
        </span>
        <Image src="/more.png" alt="" width={20} height={20} />
      </div>
      <h1 className="text-2xl font-semibold my-4 dark:text-gray-100">{count}</h1>
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {typeMap[type]}
      </h2>
    </div>
  );
};

export default UserCardClient;
