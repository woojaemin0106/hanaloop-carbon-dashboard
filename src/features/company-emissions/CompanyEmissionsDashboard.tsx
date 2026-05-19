"use client";

import { AlertCircle, BarChart3, Building2, FileText, Leaf, RefreshCw, Save } from "lucide-react";
import { type CSSProperties, FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  getLatestMonth,
  getPostsForCompany,
  summarizeByCountry,
  summarizeByMonth,
  summarizeCompanies,
  sumEmissions,
} from "./analytics";
import type { Company, Country, Post } from "./types";
import { createOrUpdatePost, fetchCompanies, fetchCountries, fetchPosts } from "@/lib/api";
import { PcfDashboard } from "@/features/pcf/PcfDashboard";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; countries: Country[]; companies: Company[]; posts: Post[] };

const navigationItems = [
  { id: "overview", label: "경영진 개요", icon: BarChart3 },
  { id: "companies", label: "회사별 현황", icon: Building2 },
  { id: "posts", label: "운영 메모", icon: FileText },
  { id: "pcf", label: "PCF 시나리오", icon: Leaf },
];

const formatNumber = (value: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat("ko-KR", { maximumFractionDigits }).format(value);

const formatUsd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);

const barStyle = (percent: number) =>
  ({
    "--bar-color": "var(--green)",
    "--bar-width": `${Math.max(0, Math.min(percent, 100))}%`,
  }) as CSSProperties;

export function CompanyEmissionsDashboard() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error" | "saved">("idle");

  const loadDashboard = useCallback(async () => {
    setLoadState({ status: "loading" });

    try {
      const [countries, companies, posts] = await Promise.all([
        fetchCountries(),
        fetchCompanies(),
        fetchPosts(),
      ]);
      setLoadState({ status: "ready", countries, companies, posts });
      setSelectedCompanyId((current) => current || companies[0]?.id || "");
    } catch (error) {
      setLoadState({
        status: "error",
        message: error instanceof Error ? error.message : "대시보드 데이터를 불러오지 못했습니다.",
      });
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  const readyData = loadState.status === "ready" ? loadState : null;
  const visibleCompanies = useMemo(() => {
    if (!readyData) {
      return [];
    }

    if (selectedCountry === "all") {
      return readyData.companies;
    }

    return readyData.companies.filter((company) => company.country === selectedCountry);
  }, [readyData, selectedCountry]);

  const companySummaries = useMemo(() => {
    if (!readyData) {
      return [];
    }

    return summarizeCompanies(visibleCompanies, readyData.countries);
  }, [readyData, visibleCompanies]);
  const monthlySummary = useMemo(() => summarizeByMonth(visibleCompanies), [visibleCompanies]);
  const countrySummary = useMemo(() => summarizeByCountry(companySummaries), [companySummaries]);
  const latestMonth = getLatestMonth(visibleCompanies);
  const selectedCompany =
    visibleCompanies.find((company) => company.id === selectedCompanyId) ?? visibleCompanies[0];
  const selectedCompanySummary = companySummaries.find(
    (summary) => summary.company.id === selectedCompany?.id
  );
  const selectedCompanyPosts =
    readyData && selectedCompany ? getPostsForCompany(readyData.posts, selectedCompany.id) : [];
  const totalEmissions = sumEmissions(visibleCompanies.flatMap((company) => company.emissions));
  const latestMonthEmissions = sumEmissions(
    visibleCompanies.flatMap((company) =>
      company.emissions.filter((emission) => emission.yearMonth === latestMonth)
    )
  );
  const estimatedTaxUsd = companySummaries.reduce(
    (sum, summary) => sum + summary.estimatedCarbonTaxUsd,
    0
  );
  const maxMonthlyEmission = Math.max(...monthlySummary.map((month) => month.emissions), 1);

  const handleSavePost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!readyData || !selectedCompany || !postTitle.trim() || !postContent.trim()) {
      return;
    }

    const optimisticPost: Post = {
      id: `optimistic-${Date.now()}`,
      title: postTitle.trim(),
      resourceUid: selectedCompany.id,
      dateTime: latestMonth || "2025-06",
      content: postContent.trim(),
    };
    const previousPosts = readyData.posts;

    setSaveState("saving");
    setLoadState({
      ...readyData,
      posts: [optimisticPost, ...readyData.posts],
    });

    try {
      const savedPost = await createOrUpdatePost({
        title: optimisticPost.title,
        resourceUid: optimisticPost.resourceUid,
        dateTime: optimisticPost.dateTime,
        content: optimisticPost.content,
      });
      setLoadState({
        ...readyData,
        posts: [savedPost, ...previousPosts],
      });
      setPostTitle("");
      setPostContent("");
      setSaveState("saved");
    } catch {
      setLoadState({
        ...readyData,
        posts: previousPosts,
      });
      setSaveState("error");
    }
  };

  return (
    <div className="app-shell">
      <aside className="nav-drawer" aria-label="대시보드 탐색">
        <div className="nav-brand">
          <span>HanaLoop</span>
          <strong>CarbonOps</strong>
        </div>
        <nav>
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                aria-current={activeSection === item.id ? "page" : undefined}
                className={activeSection === item.id ? "nav-item nav-item--active" : "nav-item"}
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                type="button"
              >
                <Icon aria-hidden="true" size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="executive-main">
        <header className="executive-header">
          <div>
            <p className="eyebrow">탄소 배출량 대시보드</p>
            <h1>경영진 탄소 배출 관리 화면</h1>
            <p>
              회사별 배출량, 국가별 탄소세 노출, 월별 추이를 비교해 감축 계획과 비용 리스크를
              함께 검토합니다.
            </p>
          </div>
          <div className="header-actions">
            <button className="secondary-button" onClick={loadDashboard} type="button">
              <RefreshCw aria-hidden="true" size={16} />
              데이터 새로고침
            </button>
          </div>
        </header>

        {loadState.status === "loading" ? (
          <section className="state-panel" aria-live="polite">
            <RefreshCw aria-hidden="true" size={22} />
            <strong>배출량 데이터를 불러오는 중</strong>
            <p>회사, 국가, 운영 메모 데이터를 fake backend 지연과 함께 불러옵니다.</p>
          </section>
        ) : null}

        {loadState.status === "error" ? (
          <section className="state-panel state-panel--error" aria-live="assertive">
            <AlertCircle aria-hidden="true" size={22} />
            <strong>대시보드를 불러오지 못했습니다</strong>
            <p>{loadState.message}</p>
            <button className="secondary-button" onClick={loadDashboard} type="button">
              다시 시도
            </button>
          </section>
        ) : null}

        {readyData ? (
          <>
            <section className="filter-bar" aria-label="대시보드 필터">
              <label>
                국가
                <select value={selectedCountry} onChange={(event) => setSelectedCountry(event.target.value)}>
                  <option value="all">전체 국가</option>
                  {readyData.countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                회사
                <select
                  value={selectedCompany?.id ?? ""}
                  onChange={(event) => setSelectedCompanyId(event.target.value)}
                >
                  {visibleCompanies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            {activeSection === "overview" ? (
              <>
                <section className="kpi-grid" aria-label="경영진 KPI">
                  <article className="kpi-card">
                    <span>총 배출량</span>
                    <strong>
                      {formatNumber(totalEmissions)}
                      <small>tCO2e</small>
                    </strong>
                    <p>선택된 회사와 월별 데이터를 합산했습니다.</p>
                  </article>
                  <article className="kpi-card">
                    <span>최신 월 배출량</span>
                    <strong>
                      {formatNumber(latestMonthEmissions)}
                      <small>tCO2e</small>
                    </strong>
                    <p>{latestMonth || "월 데이터 없음"} 기준 운영 배출량입니다.</p>
                  </article>
                  <article className="kpi-card">
                    <span>추정 탄소세</span>
                    <strong>
                      {formatUsd(estimatedTaxUsd)}
                      <small>추정</small>
                    </strong>
                    <p>국가별 탄소세율과 총 배출량을 곱해 추정했습니다.</p>
                  </article>
                  <article className="kpi-card">
                    <span>회사 수</span>
                    <strong>{visibleCompanies.length}</strong>
                    <p>현재 필터에 포함된 운영 법인입니다.</p>
                  </article>
                </section>

                <section className="dashboard-grid" aria-label="월별 배출량과 국가별 노출">
                  <article className="panel">
                    <div className="panel-heading">
                      <span>월별 배출량</span>
                      <strong>{latestMonth}</strong>
                    </div>
                    <div className="company-month-chart">
                      {monthlySummary.map((month) => (
                        <div className="company-month-row" key={month.yearMonth}>
                          <span>{month.yearMonth}</span>
                          <div className="bar-track">
                            <span
                              className="bar-fill"
                              style={barStyle((month.emissions / maxMonthlyEmission) * 100)}
                            />
                          </div>
                          <strong>{formatNumber(month.emissions)} t</strong>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="panel">
                    <div className="panel-heading">
                      <span>국가별 노출</span>
                      <strong>{countrySummary.length}개 시장</strong>
                    </div>
                    <div className="country-list">
                      {countrySummary.map((country) => (
                        <div className="country-row" key={country.countryCode}>
                          <div>
                            <strong>{country.countryName}</strong>
                            <span>{country.countryCode}</span>
                          </div>
                          <p>{formatNumber(country.emissions)} tCO2e</p>
                          <small>{formatUsd(country.taxUsd)}</small>
                        </div>
                      ))}
                    </div>
                  </article>
                </section>
              </>
            ) : null}

            {activeSection === "companies" ? (
              <section className="dashboard-grid" aria-label="회사별 현황">
                <article className="panel">
                  <div className="panel-heading">
                    <span>회사별 순위</span>
                    <strong>배출량 기준</strong>
                  </div>
                  <div className="company-list">
                    {companySummaries
                      .sort((a, b) => b.totalEmissions - a.totalEmissions)
                      .map((summary) => (
                        <button
                          className={
                            selectedCompany?.id === summary.company.id
                              ? "company-row company-row--active"
                              : "company-row"
                          }
                          key={summary.company.id}
                          onClick={() => setSelectedCompanyId(summary.company.id)}
                          type="button"
                        >
                          <span>{summary.company.name}</span>
                          <strong>{formatNumber(summary.totalEmissions)} tCO2e</strong>
                          <small>
                            {summary.country.code} / {formatUsd(summary.estimatedCarbonTaxUsd)}
                          </small>
                        </button>
                      ))}
                  </div>
                </article>

                <article className="panel">
                  <div className="panel-heading">
                    <span>선택 회사 요약</span>
                    <strong>{selectedCompany?.name ?? "선택된 회사 없음"}</strong>
                  </div>
                  <dl className="company-detail-list">
                    <div>
                      <dt>국가</dt>
                      <dd>{selectedCompanySummary?.country.name ?? "-"}</dd>
                    </div>
                    <div>
                      <dt>총 배출량</dt>
                      <dd>{formatNumber(selectedCompanySummary?.totalEmissions ?? 0)} tCO2e</dd>
                    </div>
                    <div>
                      <dt>최신 월 배출량</dt>
                      <dd>{formatNumber(selectedCompanySummary?.latestMonthEmissions ?? 0)} tCO2e</dd>
                    </div>
                    <div>
                      <dt>추정 탄소세</dt>
                      <dd>{formatUsd(selectedCompanySummary?.estimatedCarbonTaxUsd ?? 0)}</dd>
                    </div>
                  </dl>
                </article>
              </section>
            ) : null}

            {activeSection === "posts" ? (
              <section className="dashboard-grid dashboard-grid--single" aria-label="운영 메모">
                <article className="panel">
                  <div className="panel-heading">
                    <span>연결된 운영 메모</span>
                    <strong>{selectedCompany?.name ?? "선택된 회사 없음"}</strong>
                  </div>
                  <form className="post-form" onSubmit={handleSavePost}>
                    <input
                      aria-label="운영 메모 제목"
                      onChange={(event) => setPostTitle(event.target.value)}
                      placeholder="운영 메모 제목"
                      value={postTitle}
                    />
                    <textarea
                      aria-label="운영 메모 내용"
                      onChange={(event) => setPostContent(event.target.value)}
                      placeholder="이 회사의 리스크, 조치 사항, 후속 확인 내용을 입력하세요"
                      rows={3}
                      value={postContent}
                    />
                    <button disabled={saveState === "saving"} type="submit">
                      <Save aria-hidden="true" size={16} />
                      {saveState === "saving" ? "저장 중..." : "메모 저장"}
                    </button>
                    {saveState === "error" ? (
                      <p className="form-message form-message--error">
                        저장에 실패해 임시 메모를 이전 상태로 되돌렸습니다.
                      </p>
                    ) : null}
                    {saveState === "saved" ? (
                      <p className="form-message">fake backend 지연 후 메모가 저장되었습니다.</p>
                    ) : null}
                  </form>
                  <div className="post-list">
                    {selectedCompanyPosts.map((post) => (
                      <article key={post.id}>
                        <span>{post.dateTime}</span>
                        <strong>{post.title}</strong>
                        <p>{post.content}</p>
                      </article>
                    ))}
                  </div>
                </article>
              </section>
            ) : null}

            {activeSection === "pcf" ? <PcfDashboard embedded /> : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
