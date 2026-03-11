"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSettings } from "@/context/SettingsContext";
import { useEffect, useState } from "react";
import useDebounce from "@/hooks/useDebounce";

const TableSearch = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useSettings();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(searchValue, 400);

  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    const normalizedSearch = debouncedSearch.trim();

    if (normalizedSearch === currentSearch) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (normalizedSearch) {
      params.set("search", normalizedSearch);
    } else {
      params.delete("search");
    }

    // Reset pagination when search changes.
    params.delete("page");

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }, [debouncedSearch, pathname, router, searchParams]);

  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 dark:ring-gray-600 px-2 dark:bg-gray-800"
    >
      <Image src="/search.png" alt="" width={14} height={14} />
      <input
        type="text"
        placeholder={t("search")}
        className="w-[200px] p-2 bg-transparent outline-none dark:text-gray-100"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      />
    </form>
  );
};

export default TableSearch;
