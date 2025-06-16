export type SortFilterItem = {
  title: string;
  slug: string | null;
  sort_key: "POPULAR" | "LATEST";
};

export const defaultSort: SortFilterItem = {
  title: "рекомендуемые",
  slug: null,
  sort_key: "POPULAR",
};

export const sorting: SortFilterItem[] = [
  defaultSort,
  { title: "новые", slug: "latest", sort_key: "LATEST" },
];
