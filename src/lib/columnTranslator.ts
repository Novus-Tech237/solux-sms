import { TranslationKey } from "@/lib/translations";

export interface TranslatableColumn {
  header: TranslationKey;
  accessor: string;
  className?: string;
}

export function translateColumns(
  columns: TranslatableColumn[],
  t: (key: TranslationKey) => string
) {
  return columns.map((col) => ({
    header: t(col.header),
    accessor: col.accessor,
    className: col.className,
  }));
}
