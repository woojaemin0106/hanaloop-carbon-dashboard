import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("keeps the dashboard shell entry copy", async () => {
  const pageSource = await readFile("src/app/page.tsx", "utf8");

  expect(pageSource).toContain("CT-045 PCF Lifecycle Dashboard");
});
