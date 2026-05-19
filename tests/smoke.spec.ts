import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("keeps the dashboard shell entry copy", async () => {
  const pageSource = await readFile("src/app/page.tsx", "utf8");
  const dashboardSource = await readFile(
    "src/features/company-emissions/CompanyEmissionsDashboard.tsx",
    "utf8"
  );

  expect(pageSource).toContain("CompanyEmissionsDashboard");
  expect(dashboardSource).toContain("nav-drawer");
  expect(dashboardSource).toContain("경영진 탄소 배출 관리 화면");
  expect(dashboardSource).toContain("fetchCompanies");
  expect(dashboardSource).toContain("createOrUpdatePost");
});
