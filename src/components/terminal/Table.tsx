"use client";

interface Column {
  key: string;
  header: string;
  align?: "left" | "right";
}

interface TableProps {
  columns: Column[];
  rows: Record<string, string>[];
}

export function Table({ columns, rows }: TableProps) {
  const widths = columns.map((col) => {
    const headerLen = col.header.length;
    const maxDataLen = rows.reduce(
      (max, row) => Math.max(max, (row[col.key] ?? "").length),
      0
    );
    return Math.max(headerLen, maxDataLen) + 2;
  });

  const pad = (text: string, width: number, align: "left" | "right" = "left") =>
    align === "right" ? text.padStart(width) : text.padEnd(width);

  const border = "┼" + widths.map((w) => "─".repeat(w)).join("┼") + "┼";
  const headerRow =
    "│" +
    columns.map((col, i) => pad(` ${col.header}`, widths[i] ?? 0)).join("│") +
    "│";

  return (
    <pre
      className="text-sm leading-relaxed text-phosphor"
      role="table"
      aria-label="Portfolio data"
    >
      {border}
      {"\n"}
      {headerRow}
      {"\n"}
      {border}
      {"\n"}
      {rows.map((row, rowIdx) => (
        <span key={rowIdx} role="row">
          {"│" +
            columns
              .map((col, i) =>
                pad(` ${row[col.key] ?? ""}`, widths[i] ?? 0, col.align)
              )
              .join("│") +
            "│\n"}
        </span>
      ))}
      {border}
    </pre>
  );
}
