/** How NSSF is worked out: a percentage of pay, or a flat amount per employee. */
export const CONTRIBUTION_MODES = ["PERCENT", "FIXED"] as const;
export type ContributionMode = (typeof CONTRIBUTION_MODES)[number];

/**
 * `dto/response/company/CompanySettingsResponse`, now including the days × rate pay model.
 * (The older `CompanySettingsResponse` in `types/index.ts` predates these fields.)
 */
export type PaySettingsResponse = {
  id: number;
  vatRate: number;
  defaultWorkingHoursPerDay: number | null;
  overtimeMultiplier: number | null;
  weekendDays: string | null;
  payrollPeriod: string | null;
  /** What one day worked pays (KES). */
  dailyRate: number;
  shifMode: ContributionMode;
  shifValue: number;
  nssfMode: ContributionMode;
  nssfValue: number;
  /** Saved values from the old pay model. The agent payment formula does not read these switches. */
  applyHousingLevy: boolean;
  applyPaye: boolean;
  applyNita: boolean;
  /** Most that loans and damages may take from one employee's pay, as a percentage of it. */
  deductionCeilingPercent: number;
};

/** The body of `PUT /company/settings` (`CompanySettingsUpdateRequest`) for the pay model. */
export type PaySettingsPayload = Pick<
  PaySettingsResponse,
  | "vatRate"
  | "dailyRate"
  | "nssfMode"
  | "nssfValue"
  | "deductionCeilingPercent"
>;

