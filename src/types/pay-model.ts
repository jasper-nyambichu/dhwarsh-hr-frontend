/** How SHIF or NSSF is worked out: a percentage of pay, or a flat amount per payslip. */
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
  /** The owner's formula leaves these out, so they are off until an Admin turns them on. */
  applyHousingLevy: boolean;
  applyPaye: boolean;
  applyNita: boolean;
  /** Most that loans, damages and any tax/levy may take off one payslip, as % of gross pay. */
  deductionCeilingPercent: number;
};

/** The body of `PUT /company/settings` (`CompanySettingsUpdateRequest`) for the pay model. */
export type PaySettingsPayload = Pick<
  PaySettingsResponse,
  | "vatRate"
  | "dailyRate"
  | "shifMode"
  | "shifValue"
  | "nssfMode"
  | "nssfValue"
  | "applyHousingLevy"
  | "applyPaye"
  | "applyNita"
  | "deductionCeilingPercent"
>;

/**
 * The four fields `PayslipResponse` gained in Phase 4. Add them to your payslip type in
 * `types/payroll.ts` (for example `type Payslip = ExistingPayslip & PayslipPayModelFields`).
 */
export type PayslipPayModelFields = {
  daysWorked: number;
  dailyRate: number;
  damageDeduction: number | null;
  /** Gross pay + SHIF + NSSF. */
  totalEmployeeSalary: number;
};