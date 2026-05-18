import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("keeps the dashboard shell entry copy", async () => {
  const pageSource = await readFile("src/app/page.tsx", "utf8");
  const dashboardSource = await readFile("src/features/pcf/PcfDashboard.tsx", "utf8");

  expect(pageSource).toContain("PcfDashboard");
  expect(dashboardSource).toContain("CT-045 PCF Lifecycle Dashboard");
  expect(dashboardSource).toContain("ProductionQuantityForm");
  expect(dashboardSource).toContain("월별 배출량 추이");
});
