import type { Company, Country, Post } from "./types";

export const countries: Country[] = [
  {
    code: "KR",
    name: "대한민국",
    region: "아시아 태평양",
    carbonTaxUsdPerTon: 18,
  },
  {
    code: "US",
    name: "미국",
    region: "북미",
    carbonTaxUsdPerTon: 22,
  },
  {
    code: "DE",
    name: "독일",
    region: "유럽",
    carbonTaxUsdPerTon: 49,
  },
  {
    code: "VN",
    name: "베트남",
    region: "아시아 태평양",
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
    title: "분기 CO2 업데이트",
    resourceUid: "c1",
    dateTime: "2025-03",
    content: "국내 사업장의 주요 배출 원인은 여전히 전력 구매입니다.",
  },
  {
    id: "p2",
    title: "운송 경로 검토",
    resourceUid: "c3",
    dateTime: "2025-04",
    content: "공급사 운송 경로 2건이 변경되면서 물류 배출량이 증가했습니다.",
  },
  {
    id: "p3",
    title: "조립 공정 효율 메모",
    resourceUid: "c4",
    dateTime: "2025-06",
    content: "신규 교대 계획으로 유휴 전력은 줄었지만 운송 배출은 증가했습니다.",
  },
];
