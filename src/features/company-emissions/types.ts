export type Country = {
  code: string;
  name: string;
  region: string;
  carbonTaxUsdPerTon: number;
};

export type GhgEmission = {
  yearMonth: string;
  source: "electricity" | "gasoline" | "diesel" | "lpg" | "freight";
  emissions: number;
};

export type Company = {
  id: string;
  name: string;
  country: Country["code"];
  emissions: GhgEmission[];
};

export type Post = {
  id: string;
  title: string;
  resourceUid: Company["id"];
  dateTime: string;
  content: string;
};

export type CompanyEmissionSummary = {
  company: Company;
  country: Country;
  totalEmissions: number;
  latestMonth: string;
  latestMonthEmissions: number;
  estimatedCarbonTaxUsd: number;
};
