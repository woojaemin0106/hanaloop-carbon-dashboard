import { z } from "zod";

export type ProductionQuantityValidation =
  | {
      ok: true;
      value: number;
    }
  | {
      ok: false;
      message: string;
    };

export type ActivityQuantityValidation = ProductionQuantityValidation;

const productionQuantitySchema = z
  .number()
  .finite("생산수량은 숫자로 입력해야 합니다.")
  .positive("생산수량은 0보다 커야 합니다.");

const activityQuantitySchema = z
  .number()
  .finite("활동량은 숫자로 입력해야 합니다.")
  .nonnegative("활동량은 0 이상이어야 합니다.");

export const parseProductionQuantityInput = (
  input: string
): ProductionQuantityValidation => {
  const normalizedInput = input.trim().replaceAll(",", "");

  if (!normalizedInput) {
    return {
      ok: false,
      message: "생산수량을 입력해 주세요.",
    };
  }

  const numericValue = Number(normalizedInput);

  if (!Number.isFinite(numericValue)) {
    return {
      ok: false,
      message: "생산수량은 숫자로 입력해야 합니다.",
    };
  }

  const parsed = productionQuantitySchema.safeParse(numericValue);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "생산수량을 다시 확인해 주세요.",
    };
  }

  return {
    ok: true,
    value: parsed.data,
  };
};

export const parseActivityQuantityInput = (input: string): ActivityQuantityValidation => {
  const normalizedInput = input.trim().replaceAll(",", "");

  if (!normalizedInput) {
    return {
      ok: false,
      message: "활동량을 입력해 주세요.",
    };
  }

  const numericValue = Number(normalizedInput);

  if (!Number.isFinite(numericValue)) {
    return {
      ok: false,
      message: "활동량은 숫자로 입력해야 합니다.",
    };
  }

  const parsed = activityQuantitySchema.safeParse(numericValue);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "활동량을 다시 확인해 주세요.",
    };
  }

  return {
    ok: true,
    value: parsed.data,
  };
};
