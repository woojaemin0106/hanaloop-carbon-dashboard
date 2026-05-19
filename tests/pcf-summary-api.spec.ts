import { expect, test } from "@playwright/test";

import { GET } from "../src/app/api/pcf/summary/route";
import { getAssignmentPcfSummary } from "../src/features/pcf/summary-service";

test("builds a reusable PCF summary response for dashboard and API use", () => {
  const summary = getAssignmentPcfSummary();

  expect(summary.period).toEqual({
    startMonth: "2025-01",
    endMonth: "2025-08",
    monthCount: 8,
  });
  expect(summary.source).toEqual({
    name: "하나루프 과제 제공 데이터",
    activityCount: 30,
    emissionFactorCount: 4,
    emissionFactorVersion: "assignment-2025-v1",
  });
  expect(summary.kpis).toEqual([
    expect.objectContaining({
      id: "total-emission",
      value: 11.072724,
      unit: "tCO2e",
    }),
    expect.objectContaining({
      id: "pcf-per-unit",
      value: 11072.724,
      unit: "kgCO2e/과제 데이터 묶음",
    }),
    expect.objectContaining({
      id: "scope3-share",
      value: 95.8,
      unit: "%",
    }),
    expect.objectContaining({
      id: "top-contributor",
      value: 1173,
      unit: "kgCO2e",
    }),
  ]);
});

test("returns the same PCF summary shape from the Next.js route handler", async () => {
  const response = GET();
  const payload = await response.json();

  expect(response.status).toBe(200);
  expect(payload.product.code).toBe("CT-045");
  expect(payload.totalKgCO2e).toBeCloseTo(11072.724, 3);
  expect(payload.monthly).toHaveLength(8);
  expect(payload.reviewNotes).toContain(
    "원소재와 운송은 공급망 활동으로 해석해 Scope 3로 분류했습니다."
  );
});
