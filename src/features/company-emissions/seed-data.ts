import type { Company, Country, Post } from "./types";

export const countries: Country[] = [
  {
    code: "KR",
    name: "South Korea",
    region: "Asia Pacific",
    carbonTaxUsdPerTon: 18,
  },
  {
    code: "US",
    name: "United States",
    region: "North America",
    carbonTaxUsdPerTon: 22,
  },
  {
    code: "DE",
    name: "Germany",
    region: "Europe",
    carbonTaxUsdPerTon: 49,
  },
  {
    code: "VN",
    name: "Vietnam",
    region: "Asia Pacific",
    carbonTaxUsdPerTon: 8,
  },
];

export const companies: Company[] = [
  {
    id: "c1",
    name: "Hana Display Korea",
    country: "KR",
    emissions: [
      { yearMonth: "2025-01", source: "electricity", emissions: 118 },
      { yearMonth: "2025-02", source: "electricity", emissions: 111 },
      { yearMonth: "2025-03", source: "diesel", emissions: 126 },
      { yearMonth: "2025-04", source: "freight", emissions: 139 },
      { yearMonth: "2025-05", source: "electricity", emissions: 132 },
      { yearMonth: "2025-06", source: "lpg", emissions: 128 },
    ],
  },
  {
    id: "c2",
    name: "Acme Components",
    country: "US",
    emissions: [
      { yearMonth: "2025-01", source: "gasoline", emissions: 96 },
      { yearMonth: "2025-02", source: "freight", emissions: 108 },
      { yearMonth: "2025-03", source: "electricity", emissions: 119 },
      { yearMonth: "2025-04", source: "diesel", emissions: 127 },
      { yearMonth: "2025-05", source: "diesel", emissions: 121 },
      { yearMonth: "2025-06", source: "freight", emissions: 116 },
    ],
  },
  {
    id: "c3",
    name: "Globex Logistics",
    country: "DE",
    emissions: [
      { yearMonth: "2025-01", source: "diesel", emissions: 82 },
      { yearMonth: "2025-02", source: "freight", emissions: 89 },
      { yearMonth: "2025-03", source: "diesel", emissions: 101 },
      { yearMonth: "2025-04", source: "freight", emissions: 113 },
      { yearMonth: "2025-05", source: "electricity", emissions: 118 },
      { yearMonth: "2025-06", source: "freight", emissions: 122 },
    ],
  },
  {
    id: "c4",
    name: "Mekong Assembly",
    country: "VN",
    emissions: [
      { yearMonth: "2025-01", source: "electricity", emissions: 74 },
      { yearMonth: "2025-02", source: "lpg", emissions: 81 },
      { yearMonth: "2025-03", source: "electricity", emissions: 88 },
      { yearMonth: "2025-04", source: "gasoline", emissions: 91 },
      { yearMonth: "2025-05", source: "freight", emissions: 97 },
      { yearMonth: "2025-06", source: "electricity", emissions: 102 },
    ],
  },
];

export const posts: Post[] = [
  {
    id: "p1",
    title: "Quarterly CO2 update",
    resourceUid: "c1",
    dateTime: "2025-03",
    content: "Electricity procurement remains the main driver for Korea operations.",
  },
  {
    id: "p2",
    title: "Freight lane review",
    resourceUid: "c3",
    dateTime: "2025-04",
    content: "Logistics emissions increased after two supplier lane changes.",
  },
  {
    id: "p3",
    title: "Assembly efficiency note",
    resourceUid: "c4",
    dateTime: "2025-06",
    content: "New shift plan reduced idle electricity but freight increased.",
  },
];
