import { expect, test } from "@playwright/test";

import {
  parseActivityQuantityInput,
  parseProductionQuantityInput,
} from "../src/features/pcf/input-validation";
import { getAssignmentPcfSummary } from "../src/features/pcf/summary-service";

test("validates production quantity input before recalculation", () => {
  expect(parseProductionQuantityInput("")).toEqual({
    ok: false,
    message: "생산수량을 입력해 주세요.",
  });
  expect(parseProductionQuantityInput("0")).toEqual({
    ok: false,
    message: "생산수량은 0보다 커야 합니다.",
  });
  expect(parseProductionQuantityInput("abc")).toEqual({
    ok: false,
    message: "생산수량은 숫자로 입력해야 합니다.",
  });
  expect(parseProductionQuantityInput("1,000")).toEqual({
    ok: true,
    value: 1000,
  });
});

test("recalculates per-unit PCF with a custom production quantity", () => {
  const baseline = getAssignmentPcfSummary();
  const adjusted = getAssignmentPcfSummary({ productionQuantity: 10 });

  expect(baseline.totalKgCO2e).toBe(adjusted.totalKgCO2e);
  expect(adjusted.product.productionQuantity).toBe(10);
  expect(adjusted.pcfKgCO2ePerUnit).toBeCloseTo(1107.272, 3);
  expect(adjusted.kpis).toContainEqual(
    expect.objectContaining({
      id: "pcf-per-unit",
      value: 1107.272,
      unit: "kgCO2e/과제 데이터 묶음",
    })
  );
});

test("validates activity quantity input before scenario recalculation", () => {
  expect(parseActivityQuantityInput("")).toEqual({
    ok: false,
    message: "활동량을 입력해 주세요.",
  });
  expect(parseActivityQuantityInput("-1")).toEqual({
    ok: false,
    message: "활동량은 0 이상이어야 합니다.",
  });
  expect(parseActivityQuantityInput("abc")).toEqual({
    ok: false,
    message: "활동량은 숫자로 입력해야 합니다.",
  });
  expect(parseActivityQuantityInput("1,234.5")).toEqual({
    ok: true,
    value: 1234.5,
  });
});

test("recalculates PCF totals with adjusted activity quantities", () => {
  const baseline = getAssignmentPcfSummary();
  const adjusted = getAssignmentPcfSummary({
    activityQuantityOverrides: {
      "material-plastic-1-2025-04-01-001": 255,
    },
  });

  expect(adjusted.records).toContainEqual(
    expect.objectContaining({
      id: "material-plastic-1-2025-04-01-001",
      quantity: 255,
      emissionKgCO2e: 586.5,
    })
  );
  expect(adjusted.totalKgCO2e).toBeCloseTo(baseline.totalKgCO2e - 586.5, 3);
  expect(adjusted.byCategory).toContainEqual(
    expect.objectContaining({
      category: "material",
      totalKgCO2e: 7080.5,
    })
  );
  expect(adjusted.topContributors[0]).toMatchObject({
    id: "material-plastic-1-2025-06-01-001",
    emissionKgCO2e: 1035,
  });
});
