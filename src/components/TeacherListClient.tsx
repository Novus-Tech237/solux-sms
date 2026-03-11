"use client";

import { useSettings } from "@/context/SettingsContext";
import { TranslationKey } from "@/lib/translations";
import Table from "./Table";
import Image from "next/image";
import Link from "next/link";
import { Teacher, Course } from "@prisma/client";
import { useMemo } from "react";

type TeacherList = Teacher & { courses: Course[] };

interface TeacherListClientProps {
  items: TeacherList[];
  role?: string;
}

const TeacherListClient = ({ items, role }: TeacherListClientProps) => {
  const { t } = useSettings();

  // Memoize columns to avoid unnecessary recalculations
  const columns = useMemo(() => [
    {
      header: t("info" as TranslationKey),
      accessor: "info",
    },
    {
      header: t("teacherId" as TranslationKey),
      accessor: "teacherId",
      className: "hidden md:table-cell",
    },
    {
      header: "Courses",
      accessor: "courses",
      className: "hidden md:table-cell",
    },
    {
      header: t("phone" as TranslationKey),
      accessor: "phone",
      className: "hidden lg:table-cell",
    },
    {
      header: t("address" as TranslationKey),
      accessor: "address",
      className: "hidden lg:table-cell",
    },
    ...(role === "admin"
      ? [
          {
            header: t("actions" as TranslationKey),
            accessor: "action",
          },
        ]
      : []),
  ], [t, role]);

  const renderRow = (item: TeacherList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 dark:border-gray-700 even:bg-slate-50 dark:even:bg-gray-800 text-sm hover:bg-lamaPurpleLight dark:hover:bg-gray-700"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.img || "/noAvatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold dark:text-gray-100">{item.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{item?.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell dark:text-gray-100">{item.username}</td>
      <td className="hidden md:table-cell dark:text-gray-100">
        {item.courses.map((course) => course.name).join(",")}
      </td>
      <td className="hidden lg:table-cell dark:text-gray-100">{item.phone}</td>
      <td className="hidden lg:table-cell dark:text-gray-100">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/teachers/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky dark:bg-blue-700 hover:opacity-80 transition">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
        </div>
      </td>
    </tr>
  );

  return <Table columns={columns} renderRow={renderRow} data={items} />;
};

export default TeacherListClient;
