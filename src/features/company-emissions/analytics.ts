import type { Company, CompanyEmissionSummary, Country, GhgEmission, Post } from "./types";

const round = (value: number, precision = 1) => {
  const multiplier = 10 ** precision;
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
};

export const sumEmissions = (emissions: GhgEmission[]) =>
  round(emissions.reduce((sum, emission) => sum + emission.emissions, 0));

export const getLatestMonth = (companies: Company[]) =>
  [...new Set(companies.flatMap((company) => company.emissions.map((emission) => emission.yearMonth)))]
    .sort()
    .at(-1) ?? "";

export const filterCompanies = (
  companies: Company[],
  { countryCode, companyId }: { countryCode: string; companyId: string }
) => {
  const countryFiltered =
    countryCode === "all" ? companies : companies.filter((company) => company.country === countryCode);

  if (companyId === "all") {
    return countryFiltered;
  }

  return countryFiltered.filter((company) => company.id === companyId);
};

export const summarizeCompanies = (
  companies: Company[],
  countries: Country[]
): CompanyEmissionSummary[] =>
  companies.map((company) => {
    const country = countries.find((item) => item.code === company.country);

    if (!country) {
      throw new Error(`Missing country for company: ${company.id}`);
    }

    const latestMonth = company.emissions.map((emission) => emission.yearMonth).sort().at(-1) ?? "";
    const latestMonthEmissions = sumEmissions(
      company.emissions.filter((emission) => emission.yearMonth === latestMonth)
    );
    const totalEmissions = sumEmissions(company.emissions);

    return {
      company,
      country,
      totalEmissions,
      latestMonth,
      latestMonthEmissions,
      estimatedCarbonTaxUsd: round(totalEmissions * country.carbonTaxUsdPerTon, 0),
    };
  });

export const summarizeByMonth = (companies: Company[]) => {
  const monthMap = new Map<string, number>();

  companies.forEach((company) => {
    company.emissions.forEach((emission) => {
      monthMap.set(emission.yearMonth, (monthMap.get(emission.yearMonth) ?? 0) + emission.emissions);
    });
  });

  return [...monthMap.entries()]
    .map(([yearMonth, emissions]) => ({
      yearMonth,
      emissions: round(emissions),
    }))
    .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
};

export const summarizeByCountry = (summaries: CompanyEmissionSummary[]) =>
  summaries
    .reduce<Array<{ countryCode: string; countryName: string; emissions: number; taxUsd: number }>>(
      (items, summary) => {
        const existing = items.find((item) => item.countryCode === summary.country.code);

        if (existing) {
          existing.emissions = round(existing.emissions + summary.totalEmissions);
          existing.taxUsd = round(existing.taxUsd + summary.estimatedCarbonTaxUsd, 0);
          return items;
        }

        return [
          ...items,
          {
            countryCode: summary.country.code,
            countryName: summary.country.name,
            emissions: summary.totalEmissions,
            taxUsd: summary.estimatedCarbonTaxUsd,
          },
        ];
      },
      []
    )
    .sort((a, b) => b.emissions - a.emissions);

export const getPostsForCompany = (posts: Post[], companyId: string) =>
  posts
    .filter((post) => post.resourceUid === companyId)
    .sort((a, b) => b.dateTime.localeCompare(a.dateTime));
