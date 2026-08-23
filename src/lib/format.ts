/** Human-readable byte sizes: 998 B, 12.4 KB, 100 MB (1024-based). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ["KB", "MB", "GB", "TB"] as const;
  let value = bytes;
  let unit: string = "B";
  for (const next of units) {
    // 1023.5+ would round to a displayed "1024", so promote to the next
    // unit instead.
    if (value < 1023.5) {
      break;
    }
    value /= 1024;
    unit = next;
  }
  const rounded = value >= 100 ? Math.round(value).toString() : value.toFixed(1);
  return `${rounded.replace(/\.0$/, "")} ${unit}`;
}
