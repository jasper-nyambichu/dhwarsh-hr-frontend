import type { Metadata } from "next";
import type { ReactNode } from "react";

import {
  BackButton,
  PrintButton,
  TermsToc,
  type TermsSection,
} from "@/components/features/legal/terms-controls";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = {
  title: "Loan Terms and Conditions",
  description:
    "The terms an employee accepts when requesting a staff loan from Dhwarsh.",
};

/**
 * ─────────────────────────────────────────────────────────────────────────
 * THE FIGURES BELOW ARE PLACEHOLDERS.
 *
 * They came from the design mock-up, not from Dhwarsh's loan policy. Replace
 * every value with the approved policy — and have HR / legal sign off the
 * wording — before this page goes in front of employees. They are gathered here
 * so that is a one-place edit and the JSX below never needs touching.
 * ─────────────────────────────────────────────────────────────────────────
 */
const TERMS = {
  version: "1.0",
  lastUpdated: "1 October 2026",

  minServiceMonths: "six (6)",
  minContractRemaining: "twelve (12)",
  disciplinaryLookbackMonths: "12",

  capMultiple: "3x Net Monthly Salary",
  capAmount: "KES 300,000",
  retentionFloor: "33.3%",

  interestRate: "5.0%",
  tenureRange: "between six (6) and twenty-four (24) equal calendar months",
  payrollCutoffDay: "25th",
  payslipCode: "DED-EMP-LN",

  prepaymentNoticeDays: "seven (7)",
  lateInterest: "1.5%",

  recoveryWindowDays: "thirty (30)",
  crbThresholdDays: "ninety (90)",
  crbNoticeDays: "twenty-one (21)",

  loansEmail: "loans@dhwarsh.co.ke",
  treasuryEmail: "treasury@dhwarsh.co.ke",
  phone: "+254 (020) 790 4000",
  phoneNote: "Ext. 4022 / Payroll Operations",
  office: "Upper Hill Financial Towers, 8th Floor",
  city: "Nairobi, Kenya",
} as const;

const SECTIONS: readonly TermsSection[] = [
  { id: "section-1", title: "Eligibility Criteria" },
  { id: "section-2", title: "Loan Limits and Amounts" },
  { id: "section-3", title: "Interest and Charges" },
  { id: "section-4", title: "Repayment & Deductions" },
  { id: "section-5", title: "Early Settlement" },
  { id: "section-6", title: "Default and Recovery" },
  { id: "section-7", title: "Separation from Employment" },
  { id: "section-8", title: "Data Protection & CRB" },
  { id: "section-9", title: "Contact HR" },
];

/** Where "Back" goes when the page was opened directly and there is no history. */
const FALLBACK_HREF = "/agent/loans";

/**
 * Loan terms and conditions — public, and outside the portal.
 *
 * It sits at `/legal/*`, not under a role namespace, because it is read before a
 * loan is requested (linked from the loan form) and may be opened from a shared
 * link by someone who is not signed in. `proxy.ts` lets this path through for
 * both cases. There is therefore no rail and no top bar here — a minimal public
 * header instead.
 *
 * Layout: one reading column (`max-w-3xl`) on a white card. From `lg` a sticky
 * table of contents sits to its left, with the section being read highlighted;
 * below `lg` that list becomes a collapsible "On this page" panel at the top of
 * the card. The page is a Server Component — only the contents list, the back
 * button and the print button are client code.
 */
export default function LoanTermsPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-on-surface">
      {/* ───────────────────────── public header ───────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-outline-variant/25 bg-surface-container-lowest/95 backdrop-blur print:static print:border-0">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary shadow-ambient-1"
            >
              <Icon name="account_balance" className="text-[18px]" />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-display-greeting text-[18px] font-bold tracking-tight text-primary">
                Dhwarsh
              </span>
              <span className="font-table-header text-[10px] font-semibold uppercase tracking-wider text-secondary">
                HR &amp; Payroll
              </span>
            </span>
          </a>

          <BackButton
            fallbackHref={FALLBACK_HREF}
            icon="arrow_back"
            variant="ghost"
            className="print:hidden"
          >
            Back
          </BackButton>
        </div>
      </header>

      {/* ───────────────────────────── content ─────────────────────────── */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="items-start lg:flex lg:justify-center lg:gap-8">
          {/* Sticky contents list — desktop only. */}
          <aside className="sticky top-24 hidden w-64 shrink-0 self-start lg:block print:hidden">
            <div className="bento-card p-5">
              <div className="mb-3 flex items-center gap-2 border-b border-outline-variant/20 pb-3">
                <Icon name="menu_book" className="text-[18px] text-primary" />
                <h2 className="font-body-md text-[13px] font-bold text-on-surface">
                  Table of contents
                </h2>
              </div>
              <TermsToc sections={SECTIONS} variant="rail" />
            </div>
          </aside>

          <article className="w-full min-w-0 max-w-3xl rounded-card bg-surface-container-lowest p-4 shadow-ambient-1 sm:p-6 lg:p-8 print:shadow-none">
            <div
              id="top"
              className="mb-6 scroll-mt-24 border-b border-outline-variant/25 pb-6"
            >
              <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-secondary-fixed px-2.5 py-1 text-[11px] font-semibold text-primary">
                <Icon name="policy" className="text-[14px]" />
                Official employment policy
              </span>
              <h1 className="font-page-title text-page-title text-on-surface">
                Loan Terms and Conditions
              </h1>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                Last updated {TERMS.lastUpdated} · Version {TERMS.version}
              </p>
            </div>

            {/* Collapsible contents — below lg. */}
            <div className="mb-6 lg:hidden print:hidden">
              <TermsToc sections={SECTIONS} variant="inline" />
            </div>

            {/* Key note */}
            <section
              aria-labelledby="key-note-title"
              className="mb-8 flex items-start gap-3.5 rounded-xl border border-secondary-container bg-secondary-fixed/40 p-4 sm:p-5"
            >
              <Icon
                name="info"
                filled
                className="mt-0.5 shrink-0 text-[22px] text-primary"
              />
              <div className="min-w-0">
                <h2
                  id="key-note-title"
                  className="font-body-md text-[13px] font-bold text-primary"
                >
                  Key note for staff
                </h2>
                <p className="mt-1 font-body-md text-body-md leading-relaxed text-on-surface-variant">
                  Employer staff loans are governed by{" "}
                  <strong className="font-semibold text-on-surface">
                    Section 19 of the Kenya Employment Act, 2007
                  </strong>
                  . All authorised monthly instalments are deducted directly from
                  your monthly payroll before it is paid out to you.
                </p>
              </div>
            </section>

            <div className="flex flex-col gap-8 font-body-md text-body-md">
              <Section index={1} title="Eligibility Criteria">
                <p>
                  To qualify for a Dhwarsh staff loan, an employee must meet all
                  of the following conditions when the request is submitted:
                </p>
                <Bullets>
                  <Li term="Completed probation">
                    A minimum of {TERMS.minServiceMonths} continuous months of
                    confirmed service.
                  </Li>
                  <Li term="Contract type">
                    An active permanent contract, or a renewable fixed-term
                    contract with at least {TERMS.minContractRemaining} months
                    remaining.
                  </Li>
                  <Li term="Disciplinary standing">
                    No active warning, formal inquiry or disciplinary hearing on
                    record in the past {TERMS.disciplinaryLookbackMonths} months.
                  </Li>
                </Bullets>
              </Section>

              <Section index={2} title="Loan Limits and Amounts">
                <p>
                  The amount you can borrow depends on affordability and on the
                  statutory rule that protects part of your wages:
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Fact
                    label="Maximum loan"
                    value={TERMS.capMultiple}
                    note={`Or ${TERMS.capAmount}, whichever is lower.`}
                  />
                  <Fact
                    label="Pay protected by law"
                    value="One-third rule"
                    note={`Take-home pay must not fall below ${TERMS.retentionFloor} of your wages.`}
                  />
                </div>
                <p>
                  Under Section 19(3) of the Employment Act, no loan schedule is
                  allowed where total deductions — including PAYE, SHIF, NSSF and
                  the Affordable Housing Levy — leave you with less than
                  one-third of your pay.
                </p>
              </Section>

              <Section index={3} title="Interest and Charges">
                <p>
                  Staff loans are subsidised, to keep them cheaper than
                  commercial borrowing:
                </p>
                <Bullets>
                  <Li term="Interest rate">
                    A fixed {TERMS.interestRate} per year on a reducing balance.
                  </Li>
                  <Li term="Fees">
                    No processing fee, appraisal charge or ledger charge.
                  </Li>
                  <Li term="Fringe benefit tax">
                    Where the rate is below the market rate set by the Kenya
                    Revenue Authority, any fringe benefit tax is settled by the
                    company, as the Income Tax Act requires.
                  </Li>
                </Bullets>
              </Section>

              <Section index={4} title="Repayment and Payroll Deductions">
                <p>Repayment is by automatic deduction from your salary:</p>
                <Bullets>
                  <Li term="Repayment period">
                    {capitalise(TERMS.tenureRange)}.
                  </Li>
                  <Li term="Deduction date">
                    Each instalment is taken at payroll cut-off, on the{" "}
                    {TERMS.payrollCutoffDay} of every month.
                  </Li>
                  <Li term="On your payslip">
                    Shown under code{" "}
                    <code className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-on-surface">
                      {TERMS.payslipCode}
                    </code>
                    , split into principal and finance charge.
                  </Li>
                </Bullets>
              </Section>

              <Section index={5} title="Early Settlement">
                <p>
                  You may repay the whole balance, or make a part-payment, at any
                  time. There is no prepayment penalty, recalculation fee or
                  early-closure charge. Give the Treasury Desk (
                  <a
                    href={`mailto:${TERMS.treasuryEmail}`}
                    className="font-mono font-medium text-primary hover:underline"
                  >
                    {TERMS.treasuryEmail}
                  </a>
                  ) written notice at least {TERMS.prepaymentNoticeDays} banking
                  days before the payroll run.
                </p>
              </Section>

              <Section index={6} title="Default and Recovery">
                <p>
                  If you receive no pay, or reduced pay — for example during
                  unpaid leave, suspension or extended medical absence:
                </p>
                <div className="flex flex-col gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-low p-3.5">
                  <Callout icon="trending_up" term="Deferred arrears">
                    Unpaid amounts carry forward to the next cycles, with a{" "}
                    {TERMS.lateInterest} late-payment charge per month.
                  </Callout>
                  <Callout icon="account_balance_wallet" term="Bonus offset">
                    Dhwarsh may apply year-end bonuses, ex-gratia payments or
                    commissions to the outstanding balance first.
                  </Callout>
                </div>
              </Section>

              <Section index={7} title="Separation from Employment">
                <p>
                  When your employment ends — resignation, dismissal,
                  non-renewal, retirement or redundancy:
                </p>
                <Bullets>
                  <Li term="Balance falls due">
                    The unpaid principal and accrued interest become payable at
                    once.
                  </Li>
                  <Li term="Taken from final pay">
                    Recovery is made from your final settlement, including leave
                    pay, severance and service gratuity, as Kenyan law permits.
                  </Li>
                  <Li term="Any shortfall">
                    A balance left after that must be paid within{" "}
                    {TERMS.recoveryWindowDays} calendar days of your exit date.
                  </Li>
                </Bullets>
              </Section>

              <Section index={8} title="Data Protection & Credit Reporting">
                <p>
                  Under the{" "}
                  <strong className="font-semibold text-on-surface">
                    Kenya Data Protection Act, 2019
                  </strong>
                  , your loan records are confidential personal and financial
                  data.
                </p>
                <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-3.5 leading-relaxed text-on-surface-variant">
                  Dhwarsh does <strong>not</strong> report loans to a credit
                  reference bureau while you are employed.{" "}
                  <em>Exception:</em> a bureau listing may follow only if a
                  balance stays unpaid for more than {TERMS.crbThresholdDays}{" "}
                  days after you leave, and only after {TERMS.crbNoticeDays} days
                  of written notice.
                </div>
              </Section>

              <Section index={9} title="Contact HR">
                <p>
                  For questions about repayments, your balance or restructuring,
                  contact the loans desk:
                </p>
                <dl className="divide-y divide-outline-variant/20 overflow-hidden rounded-lg border border-outline-variant/30">
                  <ContactRow icon="mail" label="Email">
                    <a
                      href={`mailto:${TERMS.loansEmail}`}
                      className="font-mono font-medium text-primary hover:underline"
                    >
                      {TERMS.loansEmail}
                    </a>
                  </ContactRow>
                  <ContactRow icon="phone" label="Telephone">
                    <span className="text-on-surface">{TERMS.phone}</span>
                    <span className="block text-[11px] text-on-surface-variant">
                      {TERMS.phoneNote}
                    </span>
                  </ContactRow>
                  <ContactRow icon="location_on" label="Office">
                    <span className="text-on-surface">{TERMS.office}</span>
                    <span className="block text-[11px] text-on-surface-variant">
                      {TERMS.city}
                    </span>
                  </ContactRow>
                </dl>
              </Section>
            </div>

            {/* Acknowledge and go back */}
            <div className="mt-10 flex flex-col items-stretch justify-between gap-4 border-t border-outline-variant/30 pt-6 sm:flex-row sm:items-center print:hidden">
              <div className="flex items-center gap-2">
                <BackButton
                  fallbackHref={FALLBACK_HREF}
                  icon="check_circle"
                  variant="primary"
                  className="flex-1 sm:flex-none"
                >
                  I understand, go back
                </BackButton>
                <PrintButton />
              </div>
              <p className="text-center text-[11px] text-on-surface-variant sm:text-right">
                Version {TERMS.version} · {TERMS.lastUpdated}
              </p>
            </div>
          </article>
        </div>
      </main>

      {/* ───────────────────────────── footer ──────────────────────────── */}
      <footer className="border-t border-outline-variant/25 bg-surface-container-lowest px-4 py-6 sm:px-8 print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-on-surface-variant sm:flex-row">
          <div className="flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full bg-primary" />
            <span>© Dhwarsh Management Systems Ltd. All rights reserved.</span>
          </div>
          <a href="#top" className="text-[11px] hover:text-primary">
            Back to top
          </a>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ parts -- */

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** A numbered section. The id is what the contents list scrolls to. */
function Section({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={`section-${index}`} className="scroll-mt-24">
      <div className="mb-2.5 flex items-center gap-2">
        <span
          aria-hidden
          className="flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-container-high text-xs font-bold text-primary"
        >
          {index}
        </span>
        <h2 className="font-page-title text-[14px] font-bold leading-5 text-on-surface">
          {title}
        </h2>
      </div>
      <div className="flex flex-col gap-2.5 leading-relaxed text-on-surface-variant">
        {children}
      </div>
    </section>
  );
}

function Bullets({ children }: { children: ReactNode }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-primary">{children}</ul>
  );
}

function Li({ term, children }: { term: string; children: ReactNode }) {
  return (
    <li>
      <strong className="font-medium text-on-surface">{term}:</strong> {children}
    </li>
  );
}

function Fact({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
      <span className="block text-[11px] font-semibold text-secondary">
        {label}
      </span>
      <span className="text-sm font-bold text-primary">{value}</span>
      <span className="mt-0.5 block text-[11px] text-on-surface-variant">
        {note}
      </span>
    </div>
  );
}

function Callout({
  icon,
  term,
  children,
}: {
  icon: string;
  term: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon name={icon} className="mt-0.5 shrink-0 text-[16px] text-secondary" />
      <p className="text-xs text-on-surface-variant">
        <strong className="font-medium text-on-surface">{term}:</strong>{" "}
        {children}
      </p>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 px-3.5 py-3 sm:flex-row sm:items-start sm:gap-4">
      <dt className="flex w-32 shrink-0 items-center gap-2 font-medium text-on-surface">
        <Icon name={icon} className="text-[16px] text-primary" />
        {label}
      </dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}