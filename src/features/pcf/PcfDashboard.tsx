import type { CSSProperties } from "react";

import { ActivityAdjustmentForm } from "./ActivityAdjustmentForm";
import { ProductionQuantityForm } from "./ProductionQuantityForm";
import { getAssignmentPcfSummary } from "./summary-service";

const CATEGORY_COLORS = {
  electricity: "#2563eb",
  material: "#1f7a5a",
  transport: "#c47a24",
};

const SCOPE_COLORS = {
  scope2: "#2563eb",
  scope3: "#1f7a5a",
};

const formatNumber = (value: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits,
  }).format(value);

const formatKg = (value: number) => `${formatNumber(value, 3)} kgCO2e`;

const getRatio = (value: number, total: number) => {
  if (total === 0) {
    return 0;
  }

  return (value / total) * 100;
};

const barStyle = (percent: number, color: string) =>
  ({
    "--bar-width": `${Math.max(0, Math.min(percent, 100))}%`,
    "--bar-color": color,
  }) as CSSProperties;

export function PcfDashboard() {
  const summary = getAssignmentPcfSummary();
  const maxMonthlyTotal = Math.max(...summary.monthly.map((month) => month.totalKgCO2e));

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">HanaLoop Carbon Management</p>
          <h1>CT-045 PCF Lifecycle Dashboard</h1>
          <p>
            {summary.product.nameKo} 제품의 활동 데이터, GHG Scope, 전과정 단계별 배출량을
            한 화면에서 확인합니다.
          </p>
        </div>
        <dl className="product-meta" aria-label="제품 정보">
          <div>
            <dt>제품 코드</dt>
            <dd>{summary.product.code}</dd>
          </div>
          <div>
            <dt>분석 기간</dt>
            <dd>
              {summary.period.startMonth} - {summary.period.endMonth}
            </dd>
          </div>
          <div>
            <dt>배출계수</dt>
            <dd>{summary.factorVersion}</dd>
          </div>
        </dl>
      </header>

      <section className="kpi-grid" aria-label="핵심 지표">
        {summary.kpis.map((kpi) => (
          <article className="kpi-card" key={kpi.id}>
            <span>{kpi.label}</span>
            <strong>
              {formatNumber(kpi.value, kpi.id === "total-emission" ? 3 : 1)}
              <small>{kpi.unit}</small>
            </strong>
            <p>{kpi.description}</p>
          </article>
        ))}
      </section>

      <ProductionQuantityForm initialSummary={summary} />

      <ActivityAdjustmentForm initialSummary={summary} />

      <section className="dashboard-grid" aria-label="배출량 요약">
        <article className="panel">
          <div className="panel-heading">
            <span>활동 유형별 배출량</span>
            <strong>{formatKg(summary.totalKgCO2e)}</strong>
          </div>
          <div className="bar-list">
            {summary.byCategory.map((category) => {
              const ratio = getRatio(category.totalKgCO2e, summary.totalKgCO2e);

              return (
                <div className="bar-row" key={category.category}>
                  <div className="bar-row__meta">
                    <span>{category.label}</span>
                    <strong>{formatKg(category.totalKgCO2e)}</strong>
                  </div>
                  <div className="bar-track" aria-label={`${category.label} ${ratio.toFixed(1)}%`}>
                    <span
                      className="bar-fill"
                      style={barStyle(ratio, CATEGORY_COLORS[category.category])}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <span>GHG Scope별 배출량</span>
            <strong>{formatNumber(summary.kpis[2].value)}%</strong>
          </div>
          <div className="bar-list">
            {summary.byScope.map((scope) => {
              const ratio = getRatio(scope.totalKgCO2e, summary.totalKgCO2e);

              return (
                <div className="bar-row" key={scope.scope}>
                  <div className="bar-row__meta">
                    <span>{scope.label}</span>
                    <strong>{formatKg(scope.totalKgCO2e)}</strong>
                  </div>
                  <div className="bar-track" aria-label={`${scope.label} ${ratio.toFixed(1)}%`}>
                    <span
                      className="bar-fill"
                      style={barStyle(ratio, SCOPE_COLORS[scope.scope])}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="panel monthly-panel" aria-label="월별 배출량 추이">
        <div className="panel-heading">
          <span>월별 배출량 추이</span>
          <strong>{summary.period.monthCount}개월</strong>
        </div>
        <div className="monthly-chart">
          {summary.monthly.map((month) => {
            const totalWidth = getRatio(month.totalKgCO2e, maxMonthlyTotal);
            const electricityRatio = getRatio(month.electricityKgCO2e, month.totalKgCO2e);
            const materialRatio = getRatio(month.materialKgCO2e, month.totalKgCO2e);
            const transportRatio = getRatio(month.transportKgCO2e, month.totalKgCO2e);

            return (
              <div className="month-row" key={month.month}>
                <span className="month-row__label">{month.month}</span>
                <div className="month-row__bar">
                  <div className="month-stack" style={barStyle(totalWidth, CATEGORY_COLORS.material)}>
                    <span
                      className="month-stack__segment month-stack__segment--electricity"
                      style={{ flexBasis: `${electricityRatio}%` }}
                    />
                    <span
                      className="month-stack__segment month-stack__segment--material"
                      style={{ flexBasis: `${materialRatio}%` }}
                    />
                    <span
                      className="month-stack__segment month-stack__segment--transport"
                      style={{ flexBasis: `${transportRatio}%` }}
                    />
                  </div>
                </div>
                <strong>{formatKg(month.totalKgCO2e)}</strong>
              </div>
            );
          })}
        </div>
        <div className="legend" aria-label="월별 차트 범례">
          <span className="legend__item legend__item--electricity">전기</span>
          <span className="legend__item legend__item--material">원소재</span>
          <span className="legend__item legend__item--transport">운송</span>
        </div>
      </section>

      <section className="dashboard-grid" aria-label="상세 검토">
        <article className="panel">
          <div className="panel-heading">
            <span>상위 배출 활동</span>
            <strong>Top {summary.topContributors.length}</strong>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>월</th>
                  <th>활동</th>
                  <th>Scope</th>
                  <th>배출량</th>
                </tr>
              </thead>
              <tbody>
                {summary.topContributors.map((record) => (
                  <tr key={record.id}>
                    <td>{record.month}</td>
                    <td>{record.label}</td>
                    <td>{record.scope.toUpperCase()}</td>
                    <td>{formatKg(record.emissionKgCO2e)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <span>데이터 기준</span>
            <strong>{summary.source.activityCount}건</strong>
          </div>
          <dl className="source-list">
            <div>
              <dt>출처</dt>
              <dd>{summary.source.name}</dd>
            </div>
            <div>
              <dt>배출계수</dt>
              <dd>{summary.source.emissionFactorCount}개</dd>
            </div>
            <div>
              <dt>생산수량</dt>
              <dd>
                {summary.product.productionQuantity} {summary.product.productionUnit}
              </dd>
            </div>
          </dl>
          <ul className="review-notes">
            {summary.reviewNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
