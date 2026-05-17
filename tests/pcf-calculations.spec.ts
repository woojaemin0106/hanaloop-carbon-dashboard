import { expect, test } from "@playwright/test";
import { assignmentPcfDataset } from "../src/features/pcf/assignment-data";
import { calculatePcf } from "../src/features/pcf/calculations";

test("calculates PCF totals from assignment activity data", () => {
  const result = calculatePcf(assignmentPcfDataset);

  expect(result.records).toHaveLength(30);
  expect(result.factorVersion).toBe("assignment-2025-v1");
  expect(result.totalKgCO2e).toBeCloseTo(11072.724, 3);
  expect(result.totalTonCO2e).toBeCloseTo(11.072724, 6);
  expect(result.pcfKgCO2ePerUnit).toBeCloseTo(11072.724, 3);

  expect(result.byCategory).toEqual([
    {
      category: "electricity",
      label: "전기",
      totalKgCO2e: 469.224,
    },
    {
      category: "material",
      label: "원소재",
      totalKgCO2e: 7667,
    },
    {
      category: "transport",
      label: "운송",
      totalKgCO2e: 2936.5,
    },
  ]);

  expect(result.byScope).toEqual([
    {
      scope: "scope2",
      label: "Scope 2 - 구매 전력",
      totalKgCO2e: 469.224,
    },
    {
      scope: "scope3",
      label: "Scope 3 - 공급망 및 물류",
      totalKgCO2e: 10603.5,
    },
  ]);
});

test("aggregates duplicate month rows into one monthly summary", () => {
  const result = calculatePcf(assignmentPcfDataset);
  const may = result.monthly.find((month) => month.month === "2025-05");

  expect(result.monthly).toHaveLength(8);
  expect(may).toEqual({
    month: "2025-05",
    electricityKgCO2e: 100.776,
    materialKgCO2e: 1636.8,
    transportKgCO2e: 472.5,
    totalKgCO2e: 2210.076,
  });
});

test("sorts top contributors by emission amount", () => {
  const result = calculatePcf(assignmentPcfDataset);

  expect(result.topContributors[0]).toMatchObject({
    id: "material-plastic-1-2025-04-01-001",
    emissionKgCO2e: 1173,
  });
  expect(result.topContributors).toHaveLength(5);
});

test("rejects missing emission factor versions and invalid production quantities", () => {
  expect(() =>
    calculatePcf(assignmentPcfDataset, { factorVersion: "missing-version" })
  ).toThrow("Missing emission factor");

  expect(() => calculatePcf(assignmentPcfDataset, { productionQuantity: 0 })).toThrow(
    "Production quantity must be greater than zero"
  );
});
