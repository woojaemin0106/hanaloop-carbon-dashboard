export type ActivityCategory = "electricity" | "material" | "transport";

export type ActivityUnit = "kWh" | "kg" | "ton-km";

export type GhgScope = "scope2" | "scope3";

export type LifecycleStage =
  | "manufacturing-energy"
  | "raw-materials"
  | "upstream-transport";

export type AssignmentProduct = {
  code: string;
  nameKo: string;
  nameEn: string;
  productionQuantity: number;
  productionUnit: string;
};

export type ActivityRecord = {
  id: string;
  date: string;
  category: ActivityCategory;
  label: string;
  quantity: number;
  unit: ActivityUnit;
  scope: GhgScope;
  lifecycleStage: LifecycleStage;
};

export type EmissionFactor = {
  id: string;
  version: string;
  validFrom: string;
  category: ActivityCategory;
  label: string;
  factor: number;
  factorUnit: string;
  source: string;
};

export type ActivityWithEmission = ActivityRecord & {
  emissionFactorId: string;
  emissionFactorVersion: string;
  emissionKgCO2e: number;
  month: string;
};

export type CategorySummary = {
  category: ActivityCategory;
  label: string;
  totalKgCO2e: number;
};

export type ScopeSummary = {
  scope: GhgScope;
  label: string;
  totalKgCO2e: number;
};

export type LifecycleStageSummary = {
  lifecycleStage: LifecycleStage;
  label: string;
  totalKgCO2e: number;
};

export type MonthlyEmissionSummary = {
  month: string;
  electricityKgCO2e: number;
  materialKgCO2e: number;
  transportKgCO2e: number;
  totalKgCO2e: number;
};

export type PcfDataset = {
  product: AssignmentProduct;
  activities: ActivityRecord[];
  emissionFactors: EmissionFactor[];
};
