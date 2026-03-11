"use client";

import { useSettings } from "@/context/SettingsContext";
import { TranslationKey } from "@/lib/translations";

export interface TranslatableColumn {
  header: TranslationKey;
  accessor: string;
  className?: string;
}

export function useTranslatedColumns(columns: TranslatableColumn[]) {
  const { t } = useSettings();

  return columns.map((col) => ({
    header: t(col.header),
    accessor: col.accessor,
    className: col.className,
  }));
}

export default useTranslatedColumns;
