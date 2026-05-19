"use client";

import { useMemo, useState } from "react";

import { parseProductionQuantityInput } from "./input-validation";
import { getAssignmentPcfSummary, type PcfSummaryResponse } from "./summary-service";

type ProductionQuantityFormProps = {
  initialSummary: PcfSummaryResponse;
};

const formatNumber = (value: number, maximumFractionDigits = 1) =>
  new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits,
  }).format(value);

const getPcfChangeRate = (baseline: number, adjusted: number) => {
  if (baseline === 0) {
    return 0;
  }

  return ((adjusted - baseline) / baseline) * 100;
};

export function ProductionQuantityForm({ initialSummary }: ProductionQuantityFormProps) {
  const [productionQuantityInput, setProductionQuantityInput] = useState(
    String(initialSummary.product.productionQuantity)
  );

  const validation = useMemo(
    () => parseProductionQuantityInput(productionQuantityInput),
    [productionQuantityInput]
  );

  const adjustedSummary = useMemo(() => {
    if (!validation.ok) {
      return null;
    }

    return getAssignmentPcfSummary({
      productionQuantity: validation.value,
    });
  }, [validation]);

  const adjustedPcf =
    adjustedSummary?.pcfKgCO2ePerUnit ?? initialSummary.pcfKgCO2ePerUnit;
  const changeRate = getPcfChangeRate(initialSummary.pcfKgCO2ePerUnit, adjustedPcf);

  return (
    <section className="panel input-panel" aria-label="생산수량 입력과 검증">
      <div className="panel-heading">
        <span>생산수량 입력</span>
        <strong>단위 PCF 재계산</strong>
      </div>

      <div className="input-panel__layout">
        <div className="quantity-control">
          <label htmlFor="production-quantity">생산수량</label>
          <div className="quantity-input-wrap">
            <input
              aria-describedby="production-quantity-message"
              aria-invalid={!validation.ok}
              id="production-quantity"
              inputMode="decimal"
              onChange={(event) => setProductionQuantityInput(event.target.value)}
              type="text"
              value={productionQuantityInput}
            />
            <span>{initialSummary.product.productionUnit}</span>
          </div>
          <p
            className={validation.ok ? "form-message" : "form-message form-message--error"}
            id="production-quantity-message"
          >
            {validation.ok
              ? "총 배출량은 유지하고 생산수량 기준 단위 PCF만 다시 계산합니다."
              : validation.message}
          </p>
        </div>

        <div className="recalculation-result" aria-live="polite">
          <div>
            <span>기준 단위 PCF</span>
            <strong>
              {formatNumber(initialSummary.pcfKgCO2ePerUnit, 3)}
              <small>kgCO2e</small>
            </strong>
          </div>
          <div>
            <span>입력 기준 단위 PCF</span>
            <strong>
              {validation.ok ? formatNumber(adjustedPcf, 3) : "-"}
              <small>kgCO2e</small>
            </strong>
          </div>
          <div>
            <span>변화율</span>
            <strong className={changeRate <= 0 ? "change-rate--down" : "change-rate--up"}>
              {validation.ok ? `${formatNumber(changeRate, 1)}%` : "-"}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}
