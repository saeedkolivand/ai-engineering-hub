import { useState } from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  onRowClick?: (row: T) => void;
  searchPlaceholder?: string;
  empty?: string;
}

/** Tables-first primitive: sortable, globally filterable, with a search box. */
export function DataTable<T>({
  data,
  columns,
  onRowClick,
  searchPlaceholder = "Filter…",
  empty = "No rows.",
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <input
          className="flex-1 text-ui border border-hairline rounded-xs px-2.5 py-1.5 bg-canvas text-ink outline-none focus:border-accent"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder={searchPlaceholder}
        />
        <span className="text-ui-sm text-ink-faint">{table.getRowModel().rows.length} rows</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-ui border-collapse">
          <thead className="bg-pearl">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    className={[
                      "text-ui-sm text-ink-faint font-semibold text-left px-cell py-row border-b border-hairline",
                      h.column.getCanSort() ? "cursor-pointer select-none hover:text-ink" : "",
                      (h.column.columnDef.meta as any)?.numeric ? "text-right font-mono" : "",
                    ].filter(Boolean).join(" ") || undefined}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {{ asc: " ↑", desc: " ↓" }[h.column.getIsSorted() as string] ?? ""}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={onRowClick ? "cursor-pointer" : ""}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={[
                      "px-cell py-row border-b border-divider-soft",
                      (cell.column.columnDef.meta as any)?.numeric ? "text-right font-mono" : "",
                    ].filter(Boolean).join(" ") || undefined}
                  >{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td className="text-center text-ink-faint py-8" colSpan={columns.length}>
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
