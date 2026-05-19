"use client";

import { AlertCircle, BarChart3, Building2, FileText, RefreshCw, Save } from "lucide-react";
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

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; countries: Country[]; companies: Company[]; posts: Post[] };

const navigationItems = [
  { id: "overview", label: "Executive overview", icon: BarChart3 },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "posts", label: "Posts", icon: FileText },
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
        message: error instanceof Error ? error.message : "Dashboard data failed to load.",
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
      <aside className="nav-drawer" aria-label="Dashboard navigation">
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
            <p className="eyebrow">Carbon Emissions Dashboard</p>
            <h1>Executive emissions control room</h1>
            <p>
              Compare company emissions, country-level exposure, and carbon tax estimates before
              planning reduction actions.
            </p>
          </div>
          <div className="header-actions">
            <button className="secondary-button" onClick={loadDashboard} type="button">
              <RefreshCw aria-hidden="true" size={16} />
              Refresh data
            </button>
          </div>
        </header>

        {loadState.status === "loading" ? (
          <section className="state-panel" aria-live="polite">
            <RefreshCw aria-hidden="true" size={22} />
            <strong>Loading emissions data</strong>
            <p>Simulating backend latency for companies, countries, and posts.</p>
          </section>
        ) : null}

        {loadState.status === "error" ? (
          <section className="state-panel state-panel--error" aria-live="assertive">
            <AlertCircle aria-hidden="true" size={22} />
            <strong>Unable to load dashboard</strong>
            <p>{loadState.message}</p>
            <button className="secondary-button" onClick={loadDashboard} type="button">
              Try again
            </button>
          </section>
        ) : null}

        {readyData ? (
          <>
            <section className="filter-bar" aria-label="Dashboard filters">
              <label>
                Country
                <select value={selectedCountry} onChange={(event) => setSelectedCountry(event.target.value)}>
                  <option value="all">All countries</option>
                  {readyData.countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Company
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

            <section className="kpi-grid" aria-label="Executive KPIs">
              <article className="kpi-card">
                <span>Total emissions</span>
                <strong>
                  {formatNumber(totalEmissions)}
                  <small>tCO2e</small>
                </strong>
                <p>Across selected companies and months.</p>
              </article>
              <article className="kpi-card">
                <span>Latest month</span>
                <strong>
                  {formatNumber(latestMonthEmissions)}
                  <small>tCO2e</small>
                </strong>
                <p>{latestMonth || "No month"} operating exposure.</p>
              </article>
              <article className="kpi-card">
                <span>Tax exposure</span>
                <strong>
                  {formatUsd(estimatedTaxUsd)}
                  <small>est.</small>
                </strong>
                <p>Country tax rate multiplied by total emissions.</p>
              </article>
              <article className="kpi-card">
                <span>Companies</span>
                <strong>{visibleCompanies.length}</strong>
                <p>Filtered operating entities.</p>
              </article>
            </section>

            <section className="dashboard-grid" aria-label={activeSection}>
              <article className="panel">
                <div className="panel-heading">
                  <span>Monthly emissions</span>
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
                  <span>Country exposure</span>
                  <strong>{countrySummary.length} markets</strong>
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

            <section className="dashboard-grid" aria-label="Company details and posts">
              <article className="panel">
                <div className="panel-heading">
                  <span>Company ranking</span>
                  <strong>{activeSection === "companies" ? "Focused" : "Portfolio"}</strong>
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
                  <span>Linked posts</span>
                  <strong>{selectedCompany?.name ?? "No company"}</strong>
                </div>
                <form className="post-form" onSubmit={handleSavePost}>
                  <input
                    aria-label="Post title"
                    onChange={(event) => setPostTitle(event.target.value)}
                    placeholder="Post title"
                    value={postTitle}
                  />
                  <textarea
                    aria-label="Post content"
                    onChange={(event) => setPostContent(event.target.value)}
                    placeholder="Add operational note for this company"
                    rows={3}
                    value={postContent}
                  />
                  <button disabled={saveState === "saving"} type="submit">
                    <Save aria-hidden="true" size={16} />
                    {saveState === "saving" ? "Saving..." : "Save post"}
                  </button>
                  {saveState === "error" ? (
                    <p className="form-message form-message--error">
                      Save failed. The optimistic note was rolled back.
                    </p>
                  ) : null}
                  {saveState === "saved" ? (
                    <p className="form-message">Post saved with fake backend latency.</p>
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
          </>
        ) : null}
      </main>
    </div>
  );
}
