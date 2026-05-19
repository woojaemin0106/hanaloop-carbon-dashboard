"use client";

import { useMemo, useState } from "react";

import { parseActivityQuantityInput } from "./input-validation";
import { getAssignmentPcfSummary, type PcfSummaryResponse } from "./summary-service";

type ActivityAdjustmentFormProps = {
  initialSummary: PcfSummaryResponse;
};

const ADJUSTABLE_ACTIVITY_COUNT = 3;

const formatNumber = (value: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits,
  }).format(value);

const getChangeRate = (baseline: number, adjusted: number) => {
  if (baseline === 0) {
    return 0;
  }

  return ((adjusted - baseline) / baseline) * 100;
};

export function ActivityAdjustmentForm({ initialSummary }: ActivityAdjustmentFormProps) {
  const adjustableRecords = useMemo(
    () => initialSummary.topContributors.slice(0, ADJUSTABLE_ACTIVITY_COUNT),
    [initialSummary.topContributors]
  );
  const [activityInputs, setActivityInputs] = useState(() =>
    Object.fromEntries(
      adjustableRecords.map((record) => [record.id, String(record.quantity)])
    )
  );

  const validations = useMemo(
    () =>
      Object.fromEntries(
        adjustableRecords.map((record) => [
          record.id,
          parseActivityQuantityInput(activityInputs[record.id] ?? ""),
        ])
      ),
    [activityInputs, adjustableRecords]
  );
  const hasInvalidInput = Object.values(validations).some((validation) => !validation.ok);

  const adjustedSummary = useMemo(() => {
    if (hasInvalidInput) {
      return null;
    }

    return getAssignmentPcfSummary({
      activityQuantityOverrides: Object.fromEntries(
        adjustableRecords.map((record) => {
          const validation = validations[record.id];

          return [record.id, validation.ok ? validation.value : record.quantity];
        })
      ),
    });
  }, [adjustableRecords, hasInvalidInput, validations]);

  const adjustedTotal = adjustedSummary?.totalKgCO2e ?? initialSummary.totalKgCO2e;
  const changeRate = getChangeRate(initialSummary.totalKgCO2e, adjustedTotal);
  const scope3Share =
    adjustedSummary?.kpis.find((kpi) => kpi.id === "scope3-share")?.value ??
    initialSummary.kpis.find((kpi) => kpi.id === "scope3-share")?.value ??
    0;

  return (
    <section className="panel activity-panel" aria-label="활동량 조정 시나리오">
      <div className="panel-heading">
        <span>활동량 조정</span>
        <strong>감축 시나리오</strong>
      </div>

      <div className="activity-panel__layout">
        <div className="activity-edit-list">
          {adjustableRecords.map((record) => {
            const validation = validations[record.id];
            const messageId = `${record.id}-message`;

            return (
              <div className="activity-edit-row" key={record.id}>
                <div>
                  <span>{record.month}</span>
                  <strong>{record.label}</strong>
                  <small>{record.scope.toUpperCase()}</small>
                </div>
                <label htmlFor={record.id}>활동량</label>
                <div className="quantity-input-wrap">
                  <input
                    aria-describedby={messageId}
                    aria-invalid={!validation.ok}
                    id={record.id}
                    inputMode="decimal"
                    onChange={(event) =>
                      setActivityInputs((current) => ({
                        ...current,
                        [record.id]: event.target.value,
                      }))
                    }
                    type="text"
                    value={activityInputs[record.id] ?? ""}
                  />
                  <span>{record.unit}</span>
                </div>
                <p
                  className={validation.ok ? "form-message" : "form-message form-message--error"}
                  id={messageId}
                >
                  {validation.ok
                    ? `${formatNumber(record.emissionKgCO2e, 3)} kgCO2e`
                    : validation.message}
                </p>
              </div>
            );
          })}
        </div>

        <div className="recalculation-result scenario-result" aria-live="polite">
          <div>
            <span>조정 후 총 배출량</span>
            <strong>
              {hasInvalidInput ? "-" : formatNumber(adjustedTotal, 3)}
              <small>kgCO2e</small>
            </strong>
          </div>
          <div>
            <span>총량 변화율</span>
            <strong className={changeRate <= 0 ? "change-rate--down" : "change-rate--up"}>
              {hasInvalidInput ? "-" : `${formatNumber(changeRate, 1)}%`}
            </strong>
          </div>
          <div>
            <span>Scope 3 비중</span>
            <strong>
              {hasInvalidInput ? "-" : formatNumber(scope3Share, 1)}
              <small>%</small>
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}
