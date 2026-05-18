import type {
  ActivityCategory,
  ActivityRecord,
  ActivityWithEmission,
  AssignmentProduct,
  CategorySummary,
  EmissionFactor,
  GhgScope,
  LifecycleStage,
  LifecycleStageSummary,
  MonthlyEmissionSummary,
  PcfDataset,
  ScopeSummary,
} from "./types";

type LabelMaps = {
  category: Record<ActivityCategory, string>;
  scope: Record<GhgScope, string>;
  lifecycleStage: Record<LifecycleStage, string>;
};

export type PcfCalculationOptions = {
  factorVersion?: string;
  productionQuantity?: number;
  activityQuantityOverrides?: Record<string, number>;
  labels?: Partial<LabelMaps>;
};

export type PcfCalculationResult = {
  product: AssignmentProduct;
  factorVersion: string;
  records: ActivityWithEmission[];
  totalKgCO2e: number;
  totalTonCO2e: number;
  pcfKgCO2ePerUnit: number;
  monthly: MonthlyEmissionSummary[];
  byCategory: CategorySummary[];
  byScope: ScopeSummary[];
  byLifecycleStage: LifecycleStageSummary[];
  topContributors: ActivityWithEmission[];
};

const CATEGORY_ORDER: ActivityCategory[] = ["electricity", "material", "transport"];
const SCOPE_ORDER: GhgScope[] = ["scope2", "scope3"];
const LIFECYCLE_STAGE_ORDER: LifecycleStage[] = [
  "manufacturing-energy",
  "raw-materials",
  "upstream-transport",
];

const DEFAULT_LABELS: LabelMaps = {
  category: {
    electricity: "전기",
    material: "원소재",
    transport: "운송",
  },
  scope: {
    scope2: "Scope 2 - 구매 전력",
    scope3: "Scope 3 - 공급망 및 물류",
  },
  lifecycleStage: {
    "manufacturing-energy": "제조 에너지",
    "raw-materials": "원소재 조달",
    "upstream-transport": "상류 운송",
  },
};

const round = (value: number, precision = 3) => {
  const multiplier = 10 ** precision;
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
};

const mergeLabels = (labels?: Partial<LabelMaps>): LabelMaps => ({
  category: { ...DEFAULT_LABELS.category, ...labels?.category },
  scope: { ...DEFAULT_LABELS.scope, ...labels?.scope },
  lifecycleStage: {
    ...DEFAULT_LABELS.lifecycleStage,
    ...labels?.lifecycleStage,
  },
});

const getMonth = (date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid activity date: ${date}`);
  }

  return date.slice(0, 7);
};

const factorMatchesActivity = (factor: EmissionFactor, activity: ActivityRecord) =>
  factor.category === activity.category && factor.label === activity.label;

const factorUnitMatchesActivity = (factor: EmissionFactor, activity: ActivityRecord) =>
  factor.factorUnit.endsWith(`/${activity.unit}`);

export const findEmissionFactor = (
  activity: ActivityRecord,
  emissionFactors: EmissionFactor[],
  factorVersion?: string
) => {
  const candidates = emissionFactors
    .filter((factor) => factorMatchesActivity(factor, activity))
    .filter((factor) => !factorVersion || factor.version === factorVersion)
    .filter((factor) => factor.validFrom <= activity.date)
    .sort((a, b) => b.validFrom.localeCompare(a.validFrom));

  const factor = candidates[0];

  if (!factor) {
    throw new Error(
      `Missing emission factor for ${activity.category}/${activity.label} on ${activity.date}`
    );
  }

  if (!factorUnitMatchesActivity(factor, activity)) {
    throw new Error(
      `Emission factor unit ${factor.factorUnit} does not match activity unit ${activity.unit}`
    );
  }

  return factor;
};

export const calculateActivityEmission = (
  activity: ActivityRecord,
  emissionFactor: EmissionFactor
): ActivityWithEmission => {
  if (!Number.isFinite(activity.quantity) || activity.quantity < 0) {
    throw new Error(`Invalid activity quantity: ${activity.id}`);
  }

  if (!factorMatchesActivity(emissionFactor, activity)) {
    throw new Error(
      `Emission factor ${emissionFactor.id} does not match activity ${activity.id}`
    );
  }

  if (!factorUnitMatchesActivity(emissionFactor, activity)) {
    throw new Error(
      `Emission factor unit ${emissionFactor.factorUnit} does not match activity unit ${activity.unit}`
    );
  }

  return {
    ...activity,
    emissionFactorId: emissionFactor.id,
    emissionFactorVersion: emissionFactor.version,
    emissionKgCO2e: round(activity.quantity * emissionFactor.factor),
    month: getMonth(activity.date),
  };
};

export const calculateActivityEmissions = (
  activities: ActivityRecord[],
  emissionFactors: EmissionFactor[],
  options: Pick<PcfCalculationOptions, "factorVersion"> = {}
) =>
  activities.map((activity) =>
    calculateActivityEmission(
      activity,
      findEmissionFactor(activity, emissionFactors, options.factorVersion)
    )
  );

const sumEmission = (records: ActivityWithEmission[]) =>
  round(records.reduce((sum, record) => sum + record.emissionKgCO2e, 0));

const applyActivityQuantityOverrides = (
  activities: ActivityRecord[],
  overrides: Record<string, number> = {}
) => {
  const activityIds = new Set(activities.map((activity) => activity.id));
  const unknownIds = Object.keys(overrides).filter((id) => !activityIds.has(id));

  if (unknownIds.length > 0) {
    throw new Error(`Unknown activity quantity override: ${unknownIds.join(", ")}`);
  }

  return activities.map((activity) => {
    const overrideQuantity = overrides[activity.id];

    if (overrideQuantity === undefined) {
      return activity;
    }

    return {
      ...activity,
      quantity: overrideQuantity,
    };
  });
};

export const summarizeByCategory = (
  records: ActivityWithEmission[],
  labels: LabelMaps["category"] = DEFAULT_LABELS.category
): CategorySummary[] =>
  CATEGORY_ORDER.map((category) => ({
    category,
    label: labels[category],
    totalKgCO2e: sumEmission(records.filter((record) => record.category === category)),
  }));

export const summarizeByScope = (
  records: ActivityWithEmission[],
  labels: LabelMaps["scope"] = DEFAULT_LABELS.scope
): ScopeSummary[] =>
  SCOPE_ORDER.map((scope) => ({
    scope,
    label: labels[scope],
    totalKgCO2e: sumEmission(records.filter((record) => record.scope === scope)),
  }));

export const summarizeByLifecycleStage = (
  records: ActivityWithEmission[],
  labels: LabelMaps["lifecycleStage"] = DEFAULT_LABELS.lifecycleStage
): LifecycleStageSummary[] =>
  LIFECYCLE_STAGE_ORDER.map((lifecycleStage) => ({
    lifecycleStage,
    label: labels[lifecycleStage],
    totalKgCO2e: sumEmission(
      records.filter((record) => record.lifecycleStage === lifecycleStage)
    ),
  }));

export const summarizeByMonth = (records: ActivityWithEmission[]): MonthlyEmissionSummary[] => {
  const monthMap = new Map<string, MonthlyEmissionSummary>();

  records.forEach((record) => {
    const existing = monthMap.get(record.month) ?? {
      month: record.month,
      electricityKgCO2e: 0,
      materialKgCO2e: 0,
      transportKgCO2e: 0,
      totalKgCO2e: 0,
    };

    if (record.category === "electricity") {
      existing.electricityKgCO2e += record.emissionKgCO2e;
    }

    if (record.category === "material") {
      existing.materialKgCO2e += record.emissionKgCO2e;
    }

    if (record.category === "transport") {
      existing.transportKgCO2e += record.emissionKgCO2e;
    }

    existing.totalKgCO2e += record.emissionKgCO2e;
    monthMap.set(record.month, existing);
  });

  return [...monthMap.values()]
    .map((month) => ({
      ...month,
      electricityKgCO2e: round(month.electricityKgCO2e),
      materialKgCO2e: round(month.materialKgCO2e),
      transportKgCO2e: round(month.transportKgCO2e),
      totalKgCO2e: round(month.totalKgCO2e),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

export const calculatePcf = (
  dataset: PcfDataset,
  options: PcfCalculationOptions = {}
): PcfCalculationResult => {
  const labels = mergeLabels(options.labels);
  const productionQuantity = options.productionQuantity ?? dataset.product.productionQuantity;

  if (!Number.isFinite(productionQuantity) || productionQuantity <= 0) {
    throw new Error("Production quantity must be greater than zero");
  }

  const activities = applyActivityQuantityOverrides(
    dataset.activities,
    options.activityQuantityOverrides
  );
  const records = calculateActivityEmissions(activities, dataset.emissionFactors, {
    factorVersion: options.factorVersion,
  });
  const totalKgCO2e = sumEmission(records);
  const versions = [...new Set(records.map((record) => record.emissionFactorVersion))];

  return {
    product: {
      ...dataset.product,
      productionQuantity,
    },
    factorVersion: versions.join(", "),
    records,
    totalKgCO2e,
    totalTonCO2e: round(totalKgCO2e / 1000, 6),
    pcfKgCO2ePerUnit: round(totalKgCO2e / productionQuantity),
    monthly: summarizeByMonth(records),
    byCategory: summarizeByCategory(records, labels.category),
    byScope: summarizeByScope(records, labels.scope),
    byLifecycleStage: summarizeByLifecycleStage(records, labels.lifecycleStage),
    topContributors: [...records]
      .sort((a, b) => b.emissionKgCO2e - a.emissionKgCO2e)
      .slice(0, 5),
  };
};
