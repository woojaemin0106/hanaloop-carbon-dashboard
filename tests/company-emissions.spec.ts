import { expect, test } from "@playwright/test";

import {
  filterCompanies,
  getLatestMonth,
  getPostsForCompany,
  summarizeByCountry,
  summarizeByMonth,
  summarizeCompanies,
  sumEmissions,
} from "../src/features/company-emissions/analytics";
import {
  companies,
  countries,
  posts,
} from "../src/features/company-emissions/seed-data";

test("summarizes executive emissions and carbon tax exposure", () => {
  const summaries = summarizeCompanies(companies, countries);

  expect(getLatestMonth(companies)).toBe("2025-06");
  expect(sumEmissions(companies.flatMap((company) => company.emissions))).toBe(2599);
  expect(summaries).toContainEqual(
    expect.objectContaining({
      totalEmissions: 754,
      estimatedCarbonTaxUsd: 13572,
    })
  );
  expect(summaries.reduce((sum, summary) => sum + summary.estimatedCarbonTaxUsd, 0)).toBe(63575);
});

test("builds monthly and country summaries for the dashboard", () => {
  const companySummaries = summarizeCompanies(companies, countries);

  expect(summarizeByMonth(companies).at(-1)).toEqual({
    yearMonth: "2025-06",
    emissions: 468,
  });
  expect(summarizeByCountry(companySummaries)[0]).toEqual({
    countryCode: "KR",
    countryName: "대한민국",
    emissions: 754,
    taxUsd: 13572,
  });
});

test("filters executive dashboard companies by country and selected company", () => {
  expect(filterCompanies(companies, { companyId: "all", countryCode: "all" })).toHaveLength(4);
  expect(filterCompanies(companies, { companyId: "all", countryCode: "KR" })).toEqual([
    expect.objectContaining({ id: "c1" }),
  ]);
  expect(filterCompanies(companies, { companyId: "c2", countryCode: "all" })).toEqual([
    expect.objectContaining({ id: "c2", country: "US" }),
  ]);
});

test("links posts to the selected company and sorts recent notes first", () => {
  expect(getPostsForCompany(posts, "c1")).toEqual([
    expect.objectContaining({
      dateTime: "2025-03",
      resourceUid: "c1",
    }),
  ]);
});
