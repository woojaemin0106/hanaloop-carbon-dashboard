import { assignmentPcfDataset } from "./assignment-data";
import { calculatePcf, type PcfCalculationResult } from "./calculations";

export type PcfSummaryKpi = {
  id: "total-emission" | "pcf-per-unit" | "scope3-share" | "top-contributor";
  label: string;
  value: number;
  unit: string;
  description: string;
};

export type PcfSummarySource = {
  name: string;
  activityCount: number;
  emissionFactorCount: number;
  emissionFactorVersion: string;
};

export type PcfSummaryOptions = {
  productionQuantity?: number;
  activityQuantityOverrides?: Record<string, number>;
};

export type PcfSummaryResponse = PcfCalculationResult & {
  period: {
    startMonth: string;
    endMonth: string;
    monthCount: number;
  };
  source: PcfSummarySource;
  kpis: PcfSummaryKpi[];
  reviewNotes: string[];
};

const round = (value: number, precision = 1) => {
  const multiplier = 10 ** precision;
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
};

const getPeriod = (summary: PcfCalculationResult) => {
  const months = summary.monthly.map((month) => month.month);

  return {
    startMonth: months[0] ?? "",
    endMonth: months.at(-1) ?? "",
    monthCount: months.length,
  };
};

const getScope3Share = (summary: PcfCalculationResult) => {
  const scope3 = summary.byScope.find((scope) => scope.scope === "scope3");

  if (!scope3 || summary.totalKgCO2e === 0) {
    return 0;
  }

  return round((scope3.totalKgCO2e / summary.totalKgCO2e) * 100);
};

const buildKpis = (summary: PcfCalculationResult): PcfSummaryKpi[] => {
  const topContributor = summary.topContributors[0];

  return [
    {
      id: "total-emission",
      label: "총 배출량",
      value: summary.totalTonCO2e,
      unit: "tCO2e",
      description: "활동 데이터 전체를 배출계수로 환산한 총량",
    },
    {
      id: "pcf-per-unit",
      label: "제품 단위 PCF",
      value: summary.pcfKgCO2ePerUnit,
      unit: `kgCO2e/${summary.product.productionUnit}`,
      description: "현재 과제 데이터의 생산수량 기준 단위 배출량",
    },
    {
      id: "scope3-share",
      label: "Scope 3 비중",
      value: getScope3Share(summary),
      unit: "%",
      description: "원소재와 운송을 포함한 공급망 배출 비중",
    },
    {
      id: "top-contributor",
      label: "최대 배출 활동",
      value: topContributor?.emissionKgCO2e ?? 0,
      unit: "kgCO2e",
      description: topContributor
        ? `${topContributor.month} ${topContributor.label}`
        : "활동 데이터 없음",
    },
  ];
};

export const buildPcfSummaryResponse = (
  summary: PcfCalculationResult
): PcfSummaryResponse => ({
  ...summary,
  period: getPeriod(summary),
  source: {
    name: "하나루프 과제 제공 데이터",
    activityCount: summary.records.length,
    emissionFactorCount: assignmentPcfDataset.emissionFactors.length,
    emissionFactorVersion: summary.factorVersion,
  },
  kpis: buildKpis(summary),
  reviewNotes: [
    "전기는 구매 전력으로 해석해 Scope 2로 분류했습니다.",
    "원소재와 운송은 공급망 활동으로 해석해 Scope 3로 분류했습니다.",
    "현재 생산수량은 과제 데이터 묶음 1개 기준이며, 이후 입력 UX에서 조정 가능하게 확장합니다.",
  ],
});

export const getAssignmentPcfSummary = (options: PcfSummaryOptions = {}) =>
  buildPcfSummaryResponse(
    calculatePcf(assignmentPcfDataset, {
      productionQuantity: options.productionQuantity,
      activityQuantityOverrides: options.activityQuantityOverrides,
    })
  );
