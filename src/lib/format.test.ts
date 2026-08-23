import { describe, expect, test } from "vite-plus/test";

import { formatBytes } from "./format";

describe("formatBytes", () => {
  test("bytes below 1024 stay in bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(998)).toBe("998 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  test("unit boundaries", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
    expect(formatBytes(100 * 1024 * 1024)).toBe("100 MB");
  });

  test("values that would round to 1024 promote to the next unit", () => {
    expect(formatBytes(1_048_575)).toBe("1 MB");
    expect(formatBytes(1_073_741_823)).toBe("1 GB");
    expect(formatBytes(1_099_511_627_775)).toBe("1 TB");
  });

  test("one decimal below 100, whole numbers above", () => {
    expect(formatBytes(12.4 * 1024)).toBe("12.4 KB");
    expect(formatBytes(523 * 1024)).toBe("523 KB");
  });
});
