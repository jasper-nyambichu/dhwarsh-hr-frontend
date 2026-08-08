# Google Stitch prompt kit — Dhwarsh HR

The blueprint image (purple "Employee Management Dashboard") supplies **layout DNA only**.
Colour, type and spacing come from the tokens already shipped in `src/app/globals.css`.
Never let Stitch return purple.

**How to use:** open a Stitch session, paste **Part 1** (the preamble) once, then paste one
**Part 4** screen brief per generation. Re-paste Part 1 whenever Stitch drifts or you start
a new session.

---

## Part 1 — MASTER PREAMBLE (paste at the top of every session)

````
You are designing screens for **Dhwarsh HR**, a Kenyan multi-company HR, attendance and
payroll platform. Staff, employees and labour agents each get their own portal inside one
shell. Output must be a single self-contained HTML file using Tailwind (v3 CDN + inline
`tailwind.config`), Material Symbols Outlined for icons, and Be Vietnam Pro for type.

I am extending an existing product. The design system below is FIXED. Do not invent
colours, do not change the type scale, do not substitute an icon set. Reuse these exact
Tailwind token names — the class strings are pasted straight into our codebase.

## Fonts
- Be Vietnam Pro only, weights 400/500/600/700.
  `<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">`
- Icons: Material Symbols Outlined ligatures, never SVG or Lucide.
  `<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet">`
  Use `<span class="material-symbols-outlined">group</span>`.

## tailwind.config — copy verbatim
tailwind.config = {
  darkMode: "class",
  theme: { extend: {
    colors: {
      primary:"#005592", "on-primary":"#ffffff",
      "primary-container":"#1c6eb4", "on-primary-container":"#e3eeff",
      "primary-fixed":"#d2e4ff", "primary-fixed-dim":"#9fcaff",
      "on-primary-fixed":"#001d36", "on-primary-fixed-variant":"#0B2A45",
      secondary:"#46607e", "on-secondary":"#ffffff",
      "secondary-container":"#c1dcff", "on-secondary-container":"#47617f",
      tertiary:"#395c00", "on-tertiary":"#ffffff",
      "tertiary-container":"#4a7700", "on-tertiary-container":"#c3ff75",
      error:"#ba1a1a", "on-error":"#ffffff",
      "error-container":"#ffdad6", "on-error-container":"#93000a",
      background:"#f6fafe", "on-background":"#171c1f",
      surface:"#f6fafe", "on-surface":"#171c1f",
      "surface-variant":"#dfe3e7", "on-surface-variant":"#414751",
      "surface-bright":"#f6fafe", "surface-dim":"#d6dade",
      "surface-container-lowest":"#ffffff", "surface-container-low":"#f0f4f8",
      "surface-container":"#eaeef2", "surface-container-high":"#e4e9ed",
      "surface-container-highest":"#dfe3e7",
      "inverse-surface":"#2c3134", "inverse-on-surface":"#edf1f5",
      outline:"#717782", "outline-variant":"#c1c7d2",
      navy:"#0b2a45", blue:"#1c6eb4", "blue-soft":"#e6f0f8", line:"#e9eff5",
      orange:"#f59e0b", "orange-deep":"#c9700b",
      "green-main":"#3b9a2f", "amber-main":"#f2a900",
      "chart-track":"#e4edf4", "row-line":"#e9eff5"
    },
    borderRadius: { lg:"0.5rem", xl:"0.75rem", full:"9999px", card:"14px", pin:"10px" },
    spacing: { "rail-width":"96px", "stack-sm":"8px", "stack-md":"16px",
               gutter:"20px", "card-padding":"24px", "container-margin":"32px" },
    fontFamily: {
      "body-md":["Be Vietnam Pro","sans-serif"], "page-title":["Be Vietnam Pro","sans-serif"],
      "label-rail":["Be Vietnam Pro","sans-serif"], "display-greeting":["Be Vietnam Pro","sans-serif"],
      "table-header":["Be Vietnam Pro","sans-serif"], "card-stat":["Be Vietnam Pro","sans-serif"]
    },
    fontSize: {
      "body-md":["12px",{lineHeight:"18px",fontWeight:"400"}],
      "label-rail":["10px",{lineHeight:"14px",fontWeight:"500"}],
      "table-header":["10px",{lineHeight:"12px",letterSpacing:"0.05em",fontWeight:"600"}],
      "page-title":["20px",{lineHeight:"28px",fontWeight:"700"}],
      "display-greeting":["22px",{lineHeight:"32px",fontWeight:"700"}],
      "card-stat":["22px",{lineHeight:"28px",fontWeight:"700"}]
    },
    boxShadow: {
      "ambient-1":"0 2px 8px rgba(11,42,69,.06)",
      "ambient-2":"0 8px 24px rgba(11,42,69,.10)",
      "ambient-3":"0 20px 60px rgba(11,42,69,.10)"
    }
  }}
}

## Required CSS helpers
.bento-card{background:#fff;border-radius:14px;box-shadow:0 2px 8px rgba(11,42,69,.06);transition:all .2s ease-in-out}
.bento-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(11,42,69,.10)}
.card-shadow{box-shadow:0 2px 8px rgba(11,42,69,.06);transition:all .2s ease-in-out}
.card-shadow:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(11,42,69,.10)}
.sidebar-gradient{background:linear-gradient(180deg,#1c6eb4 0%,#15548c 100%)}
.data-table tbody tr{border-bottom:1px solid #e9eff5}
.data-table tbody tr:last-child{border-bottom:none}
.data-table tbody tr:hover{background:#f6fafe}
.no-scrollbar::-webkit-scrollbar{display:none}
.material-symbols-outlined{font-variation-settings:"FILL" 0,"wght" 400,"GRAD" 0,"opsz" 24}

## HARD RULES
1. **Typography is small and dense.** Body copy is `font-body-md text-body-md` = 12px/18px.
   Table headers 10px uppercase `tracking-[0.05em]` in `text-outline`. Page titles
   `font-display-greeting text-display-greeting text-primary` = 22px/700. Big numbers
   `font-card-stat text-card-stat tabular-nums` = 22px/700. Micro-captions `text-[10px]`.
   Never emit `text-sm`, `text-base`, `text-lg`, `text-xl` for content type.
2. **No colour outside the config.** No purple, violet, indigo, teal, slate, gray-*.
   Greys come from `outline`, `outline-variant`, `on-surface-variant`, `surface-container*`.
3. **Blue is the brand, not purple.** The blueprint's purple rail → `.sidebar-gradient`.
   The blueprint's purple KPI tiles → `bg-primary-container` (#1c6eb4) with `text-on-primary`.
4. **Spacing tokens only:** `gap-gutter` (20px), `p-card-padding` (24px),
   `px-container-margin` (32px), `mt-stack-md` (16px). Not `gap-5`/`p-6`.
5. **Cards** are `rounded-card` (14px) + `.bento-card`. Never `rounded-2xl`/`shadow-lg`.
6. **Charts are hand-drawn** — flex/div bars, CSS `conic-gradient` donuts, inline `<svg>`
   polylines. No Chart.js, no Recharts, no `<canvas>`.
7. **Numbers use `tabular-nums`.** Money is Kenyan Shillings: `KES 125,000.00` in tables,
   `KES 18.4M` on tiles. Dates `12 Aug 2026`. Times 24-hour `14:30`.
8. **Kenyan data.** Names (Peter Njuguna, Grace Wambui, Ali Hassan, Jane Otieno, Eunice
   Wanjiku). Branches (Nairobi CBD, Mombasa Port, Kisumu Industrial, Nakuru, Thika Road,
   Eldoret Depot). Statutory: PAYE, NSSF, SHIF, Housing Levy. Employee numbers `EMP-00412`.
9. **Every screen is desktop-first at 1440px**, responsive down to mobile. Content column
   maxes at 1600px.
10. **Status pills**: `rounded-full px-2.5 py-0.5 text-[10px] font-bold`, tinted at 10%
    over the tone colour — success `tertiary-container`, warning `amber-main`,
    danger `error`, info `primary-container`, neutral `outline`.

## The shell (identical on every portal screen — render it, we crop it)
- **Outer frame:** page `bg-background`, `p-8`. Inside, one rounded panel
  `rounded-[20px] bg-surface-container-lowest shadow-ambient-3 overflow-hidden flex h-full`
  — the "software in a window" lift.
- **Left rail:** exactly `w-rail-width` (96px), `.sidebar-gradient`, `py-6`, vertical.
  Brand block at top: a 48px `rounded-xl bg-white/20` square holding the letter "D", then
  `DHWARSH` in `font-label-rail text-label-rail font-bold uppercase tracking-wider
  text-on-primary`, then the role name in `text-[9px] text-on-primary/70`.
  Items are **icon above label**, centred, `rounded-xl p-2`, label
  `font-label-rail text-label-rail` (10px). Active item = `bg-white/20 text-on-primary`
  plus a 4px×32px `rounded-r-full bg-on-primary` marker flush to the rail's left edge.
  Inactive = `text-on-primary/70`. Footer pinned bottom: Help, Logout.
- **Topbar:** `h-20`, `bg-surface-bright/80 backdrop-blur-md`, `px-container-margin`,
  sticky. Dashboards lead with the greeting: `Hello {FirstName}` in
  `font-display-greeting text-display-greeting text-primary`, a role chip
  (`rounded-full bg-blue-soft text-primary-container text-[11px] font-bold px-2.5 py-0.5`),
  and the sub-line "Welcome back. Here's your organisation today." in
  `font-body-md text-body-md text-on-surface-variant`. Non-dashboard screens replace the
  greeting with the search field. Right side always: pill search
  (`rounded-full border border-outline-variant bg-white px-4 py-2`), bell with a
  `size-2 bg-error` dot, mail icon, then a divider and the profile block — name 12px
  semibold, role `text-[10px] text-on-surface-variant`, and a 40px
  `rounded-full bg-primary-container text-on-primary text-[11px] font-bold` initials circle.
- **Content area:** scrolls, `px-container-margin pb-container-margin pt-4`.

## Card vocabulary (build screens from these — do not invent new tile shapes)
- **StatCard** — filled KPI tile. `rounded-card bg-primary-container p-card-padding
  text-on-primary card-shadow relative overflow-hidden`. Label 12px at 90% opacity top-left,
  a 32px `rounded-lg bg-white/20` icon chip top-right, value 22px bold `mt-stack-md`, and a
  decorative 100px watermark glyph at 10% opacity clipped in the bottom-right corner.
- **MetricCard** — white KPI tile. `.bento-card p-card-padding`, label 12px
  `text-on-surface-variant`, a 32px `rounded-full bg-blue-soft text-primary-container` icon
  chip, value 22px bold, optional trend line `text-[10px]` with `trending_up` in
  `text-green-main` or `trending_down` in `text-error`. Add `border-l-4` in the tone colour
  only for deadline-bearing counts.
- **BentoCard** — the generic white panel. `.bento-card p-card-padding`, header row =
  12px semibold title + optional 10px `text-outline` subtitle on the left, and one action on
  the right (a "View All" link in `text-[10px] text-primary-container`, a period dropdown,
  or an outlined Filter button).
- **SegmentStrip** — one white `rounded-card` row split into equal cells by
  `divide-x divide-outline-variant/20`. Each cell: 10px `text-outline` label above a 12px
  bold `tabular-nums` value. Tone the value `text-amber-main` for warnings,
  `text-error` for failures. (Blueprint: Present / Late / Absent.)
- **AlertSpotlight** — the dark card. `rounded-card bg-navy text-on-primary p-card-padding
  shadow-[0_8px_24px_rgba(11,42,69,.2)]`, a leading icon in a `bg-white/10` rounded square,
  a 12px message, and a trailing `chevron_right`. One per screen, maximum.
  (Blueprint: TODAY EVENTS.)
- **Bar chart** — flex row of columns, `bg-chart-track` tracks with the value bar drawn as a
  height percentage. Highlighted column is `bg-green-main` and carries a small
  `rounded bg-navy text-on-primary text-[9px] px-1.5 py-0.5` tooltip above it. Y-axis is a
  static 10px `text-outline` column on the left; month labels 10px underneath.
- **Donut** — a `conic-gradient` circle with a white punched centre (66% of the diameter),
  legend to the right: dot + 10px label on the left of each row, 10px bold value or percent
  on the right. Segment colours in order: `#1c6eb4`, `#3b9a2f`, `#f2a900`, `#e4edf4`.
- **StackedBar** — one `h-3 rounded-full overflow-hidden` bar of proportional segments, with
  a legend row beneath: dot + count (10px bold) above a 9px `text-outline` label.
- **ProgressRows** — label + right-aligned percent on one 12px line, over an
  `h-2 rounded-full bg-surface-container-high` track.
- **Avatar list** — rows of a 32px `rounded-full bg-primary-container text-on-primary`
  initials circle, name 11px semibold, 10px `text-on-surface-variant` sub-line, and a status
  chip or date on the right. (Blueprint: Employees on Leave.)
- **Data table** — `class="data-table w-full border-collapse text-left"` inside
  `overflow-x-auto`. `<th>` = `pb-3 font-table-header text-table-header uppercase
  text-outline`. `<tbody>` = `font-body-md text-body-md`, cells `py-3`. First column pairs a
  24px tinted icon square (or avatar) with the name in `font-medium text-on-surface` above a
  10px `text-outline` code line. Money and counts are right-aligned `tabular-nums`.
  Percentages pair the figure with a `h-1 w-12 rounded-full` mini progress track.
- **Filter tabs** — a white `rounded-card p-3` strip holding pill tabs; active pill
  `bg-primary text-on-primary`, inactive `text-on-surface-variant hover:bg-surface-container-low`.
- **Primary button** — `rounded-lg bg-primary px-5 py-2.5 text-body-md font-bold
  text-on-primary hover:bg-on-primary-fixed-variant`, leading icon.
  **Secondary** — `rounded-lg border border-outline-variant/40 bg-white px-3 py-2 text-[11px]`.
  **Dark** — `rounded-lg bg-navy px-4 py-2 text-[11px] font-medium text-on-primary`.
- **Empty state** — centred in a `rounded-card border border-dashed border-outline-variant
  p-12` block: 40px `text-outline-variant` icon, 12px message, optional primary action.

## Grid rhythm (from the blueprint)
`grid grid-cols-12 gap-gutter`. Main column `col-span-8`, side column `col-span-4`.
Reading order top to bottom, exactly as the blueprint: **KPI tile row** (3 across the main
column) → **two half-width analytic cards** → **one full-width table**; side column runs
**period controls → SegmentStrip → AlertSpotlight → list card → donut card**.
Collapse to `col-span-12` under `lg`.
````

---

## Part 2 — Blueprint → token translation

| Blueprint element | Becomes |
|---|---|
| Purple sidebar | `.sidebar-gradient` (#1c6eb4 → #15548c), 96px wide |
| "Zoe" logo block | `DHWARSH` brand block, 48px `bg-white/20` rounded square |
| Purple KPI tiles (400 / 150 / 30) | `bg-primary-container` StatCards, white text, watermark glyph |
| "This Month" + Download | Secondary button + navy Download button, top of side column |
| Present / Late / Absent strip | **SegmentStrip**, tones `default` / `amber-main` / `error` |
| "Job Applied" bar chart | Bar chart card, highlight bar `bg-green-main` + navy tooltip |
| "Project Overview" + stacked bar | BentoCard: 22px stat, **StackedBar**, legend, full-width outlined action |
| "TODAY EVENTS" dark card | **AlertSpotlight** on `bg-navy` |
| "Employees on Leave" list | **Avatar list**, right chip `bg-amber-main/10 text-amber-main` |
| "Performance Listed" + Filter | **Data table** with an outlined Filter action in the card header |
| "Employees" donut | **Donut**, legend `value`, colours blue → green → amber → track |
| Bottom-right line chart | Inline `<svg>` polyline, `stroke-green-main`, soft area fill |
| Countdown promo card | **Drop it.** No equivalent in this product. |

---

## Part 3 — Archetype templates

Pick the archetype, fill the slots, paste after the preamble.

### A. Dashboard
```
Screen: {ROLE} dashboard, route {ROUTE}.
Topbar: greeting variant, role chip "{ROLE LABEL}".
Rail items (icon above label, {N} items, "{ACTIVE}" active): {ITEMS}.
Main column (col-span-8):
  1. Three StatCards: {TILE 1} | {TILE 2} | {TILE 3}.
  2. Two half-width cards: "{CHART A}" as {chart type}; "{CHART B}" as {chart type}.
  3. Full-width BentoCard "{TABLE TITLE}" with a Filter action — a data table with
     columns {COLUMNS}, {N} rows.
Side column (col-span-4):
  Period dropdown + navy Download button; SegmentStrip {A}/{B}/{C};
  AlertSpotlight "{ALERT}"; BentoCard "{LIST}" as an avatar list of {N};
  BentoCard "{DONUT}" as a donut of {SEGMENTS}.
```

### B. List / index
```
Screen: {TITLE}, route {ROUTE}.
Topbar: search variant, placeholder "{PLACEHOLDER}".
PageHeader: title "{TITLE}" (22px, text-primary), description "{ONE LINE}",
  a CountPill "{N} Active", and a primary "{ACTION}" button with a leading {icon}.
Main column (col-span-8):
  A white rounded-card p-3 strip with filter pill tabs ({TABS}) on the left and an
  outlined Sort button on the right.
  A BentoCard titled "{X}" with subtitle "{N} shown · {M} total", holding a data table:
  columns {COLUMNS}. {N} rows. First column = tinted icon square or avatar + name over a
  10px code line, linking to the detail route. Include one row demonstrating an empty or
  warning value.
Side column (col-span-4):
  SegmentStrip {A}/{B}/{C}; BentoCard "{DONUT}" as a donut; BentoCard "Needs attention"
  listing {N} rows with a right-hand amber chip.
Also draw the empty state: dashed border, {icon}, "{EMPTY MESSAGE}".
```

### C. Detail
```
Screen: {ENTITY} detail, route {ROUTE}.
PageHeader: back chevron + "{ENTITY NAME}", a StatusBadge, and actions {ACTIONS}.
Identity band: a full-width BentoCard — 64px initials avatar, name 20px bold, 12px
  sub-line "{SUB}", and 4–6 inline facts as 10px label over 12px value.
Main column (col-span-8): tab strip ({TABS}); the active tab shows {CONTENT}.
Side column (col-span-4): BentoCard "Summary" with 6 label/value rows; a MetricCard;
  a BentoCard "Recent activity" as a vertical timeline — 8px dot, 1px connector line
  in outline-variant, 11px title, 10px timestamp.
```

### D. Form / create / edit
```
Screen: {TITLE}, route {ROUTE}.
PageHeader: "{TITLE}", description "{ONE LINE}", Cancel (secondary) + "{SAVE}" (primary).
Main column (col-span-8): {N} BentoCard sections — {SECTIONS} — each a 2-column
  grid gap-gutter of fields. Field = 10px uppercase-ish label in text-on-surface-variant
  above an input `rounded-lg border border-outline-variant bg-white px-3 py-2.5
  text-body-md focus:border-primary-container focus:ring-2 focus:ring-primary-container/20`.
  Show one field in its error state: border-error plus a 10px text-error hint.
  Include selects with a trailing expand_more, a date field, and a file dropzone
  (dashed border, upload icon, "Drag and drop or browse").
Side column (col-span-4): BentoCard "Guidance" with 3 bullet hints; a summary preview card.
Sticky footer bar inside the content area: Cancel + primary submit, right-aligned.
```

### E. Report
```
Screen: {TITLE}, route {ROUTE}.
PageHeader with a date-range control and Export CSV / Export PDF buttons.
Row of 4 MetricCards: {METRICS}.
Two half-width cards: {CHART A}, {CHART B}. Then a full-width dense data table
with a totals row in `font-semibold border-t-2 border-outline-variant`.
```

### F. Kiosk (fullscreen, no rail/topbar)
```
Fullscreen 1080×1920 portrait tablet screen on bg-navy. Centred white rounded-card,
max-w-md, shadow-ambient-3. Oversized 22px+ type — this is read at arm's length.
```

---

## Part 4 — Screen briefs

Paste the preamble, then one brief. `→` marks the archetype.

### Dashboards (6)

**`/payroll/dashboard`** → A · Payroll Officer · rail: Dashboard, Runs, Payslips, Loans, Advances, Documents, Reports.
Tiles: Current Run KES 18.4M / Employees Paid 1,204 / Pending Approvals 6. Charts: "Payroll Cost Trend" bar chart over 7 months, highlight the current one; "Run Status" stacked bar (Draft / Processing / Completed / Approved). Table "Recent Payroll Runs": Period, Branch, Employees, Gross, Net, Status. Side: SegmentStrip Processed 412 / Pending 190 / On Hold 96; AlertSpotlight "2 runs are awaiting your approval."; "Loans & Advances" avatar list; donut "Deductions Split" (PAYE / NSSF / SHIF / Housing Levy).

**`/finance/dashboard`** → A · Finance Officer · rail: Dashboard, Disbursements, Invoices, Statutory, Loans, Reports.
Tiles: Disbursed This Month KES 22.1M / Pending Invoices 14 / Statutory Due KES 3.6M. Charts: "Cash Out Trend" line chart, two series (2025 / 2026); "Disbursement Status" donut (Sent / Queued / Failed). Table "Pending Disbursements": Run, Branch, Employees, Amount, Method, Status. Side: SegmentStrip Sent 388 / Queued 42 / Failed 3; AlertSpotlight "PAYE remittance is due in 4 days."; "Agent Invoices" avatar list; donut "Statutory Breakdown".

**`/audit/dashboard`** → A · Auditor · read-only, **no primary action buttons anywhere** · rail: Dashboard, Audit Logs, Payroll, Employees, Reports.
Tiles: Events Today 1,842 / Flagged Actions 7 / Users Active 63. Charts: "Activity Volume" bar chart over 7 days; "Events by Module" ProgressRows (Payroll / Employee / Leave / Auth / Settings). Table "Recent Audit Events": Timestamp, Actor, Module, Action, Entity, IP. Side: SegmentStrip Reads 1,610 / Writes 225 / Denied 7; AlertSpotlight "7 privileged actions need review."; "Most Active Users" avatar list; donut "Access Outcomes" (Allowed / Denied).

**`/branch/dashboard`** → A · Branch Manager, scoped to one branch — put the branch name in the topbar chip · rail: Dashboard, Team, Attendance, Roster, Approvals.
Tiles: Team Size 142 / Present Today 128 / Pending Approvals 5. Charts: "Attendance This Week" bar chart Mon–Sat, highlight today; "Shift Coverage" stacked bar (Morning / Afternoon / Night). Table "Team Attendance Today": Employee, Shift, Clock In, Clock Out, Hours, Status. Side: SegmentStrip Present 128 / Late 9 / Absent 5; AlertSpotlight "3 leave requests are waiting on you."; "On Leave Today" avatar list with reason and return date; donut "Department Split".

**`/agent/dashboard`** → A · Agent (external supplier). Accent this portal with `orange`/`orange-deep` on the brand block only — everything else stays blue · rail: Dashboard, Staff, Summaries, Invoices, Advances, Profile.
Tiles: Deployed Staff 86 / Outstanding Invoices KES 1.9M / Advances Approved 4. Charts: "Deployment Trend" bar chart over 6 months; "Invoice Status" donut (Paid / Pending / Overdue). Table "Recent Invoices": Invoice No, Period, Staff, Amount, Issued, Status. Side: SegmentStrip Active 86 / Ended 12 / Pending 5; AlertSpotlight "Invoice INV-0231 is 14 days overdue."; "Staff Placements" avatar list; donut "Placement by Branch".

**`/me/dashboard`** → A · Employee self-service. Warmest of the nine — lead with the person, not the org. Page background `#f4f8fc` · rail: Dashboard, Attendance, Leave, Loans, Payslips, Documents, Profile.
Tiles: Leave Balance 12 days / Net Pay (Jul) KES 68,400 / Loan Balance KES 24,000. Charts: "My Attendance" bar chart over 14 days, present/late/absent coloured; "Leave Used vs Entitlement" ProgressRows per leave type. Table "Recent Payslips": Period, Gross, Deductions, Net, Status, Download. Side: a **clock-in/out card** — big current time, today's shift window, and a full-width primary Clock In button; SegmentStrip Present 18 / Late 2 / Absent 1; AlertSpotlight "Your contract renews in 21 days."; BentoCard "My Documents" listing 4 files with type icon, name and expiry.

### HR (16)

**`/hr/employees`** → B · title "Employees", pill "1,248 Active", action "Add Employee" (`person_add`). Tabs: All / Active / Probation / On Leave / Terminated. Columns: Employee (avatar + name over EMP-00412), Department, Branch, Job Title, Employment Type, Status, Actions. Side: SegmentStrip Active / Probation / Terminated; donut "Employment Type"; "Probation Ending" list.
**`/hr/employees/new`** → D · "Add Employee". Sections: Personal Details, Employment, Compensation, Statutory (KRA PIN, NSSF No, SHIF No), Documents.
**`/hr/employees/[id]`** → C · tabs Overview / Attendance / Leave / Payslips / Documents / Loans. Facts: Employee No, Department, Branch, Job Title, Hire Date, Manager.
**`/hr/employees/[id]/edit`** → D · same sections as `new`, pre-filled, "Save Changes".
**`/hr/employees/[id]/documents`** → B · document grid: file-type icon, name, uploaded date, expiry with an amber chip when within 30 days; an upload dropzone card at the top.
**`/hr/attendance`** → B · title "Attendance", a date picker in the header. Tabs: All / Present / Late / Absent / On Leave. Columns: Employee, Branch, Shift, Clock In, Clock Out, Hours, Source (Biometric/Manual), Status. Side: SegmentStrip; "Attendance Rate" bar chart over 7 days; "Repeat Late" list.
**`/hr/attendance/[employeeId]`** → C · one employee's attendance history: a month calendar heat grid (present green, late amber, absent red, leave blue) plus a daily table.
**`/hr/biometric`** → B · title "Biometric Enrolment". Two columns: enrolled employees table (Employee, Device, Fingers Enrolled, Last Sync, Status) and an enrolment panel with a fingerprint illustration and a "Start Enrolment" primary button. Side: device health list with online/offline dots.
**`/hr/shifts`** → B · title "Shifts", action "Create Shift". Columns: Shift Name, Start, End, Break, Days, Assigned, Status. Side: donut "Coverage by Shift".
**`/hr/shifts/roster`** → B · weekly roster grid: employees down the left, Mon–Sun across the top, each cell a coloured shift chip. Sticky first column, horizontal scroll, a legend under the grid.
**`/hr/leave`** → B · title "Leave Requests", pill "8 Pending". Tabs: Pending / Approved / Rejected / All. Columns: Employee, Leave Type, From, To, Days, Stage (Manager/HR), Status, Actions (Approve/Reject inline). Side: SegmentStrip; donut "By Leave Type"; "Longest Pending" list.
**`/hr/leave/[id]`** → C · leave request detail: an approval timeline (Requested → Manager → HR → Outcome) with completed steps in `tertiary`, current in `amber-main`, pending in `outline-variant`; the reason text; a coverage panel; Approve/Reject buttons.
**`/hr/leave-types`** → B · title "Leave Types", action "Add Leave Type". Columns: Name, Code, Annual Entitlement, Carry Forward, Requires Document, Paid, Status.
**`/hr/agents`** → B · title "Labour Agents". Columns: Agent (logo square + name over code), Contact, Staff Deployed, Active Contracts, Outstanding, Status.
**`/hr/agents/[id]`** → C · agent detail: deployed staff table, contract terms, invoice history.
**`/hr/reports`** → E · "HR Reports". Metrics: Headcount, Turnover Rate, Avg Tenure, Absenteeism. Charts: headcount trend; turnover by department. A report-catalogue grid of cards, each with an icon, title, description and a Generate button.

### Payroll (12)

**`/payroll/runs`** → B · title "Payroll Runs", action "New Run". Tabs by status. Columns: Period, Branch, Employees, Gross, Deductions, Net, Status, Actions.
**`/payroll/runs/new`** → D · a 4-step wizard with a numbered stepper across the top: Select Period & Scope → Review Inputs → Preview Calculations → Confirm. Show step 3: a preview table with a totals row.
**`/payroll/runs/[runId]`** → C · run detail: summary tiles (Gross, Deductions, Net, Employees), a payslip table, an approval trail, and Approve / Reject / Export actions.
**`/payroll/payslips`** → B · title "Payslips" with period and branch filters. Columns: Employee, Period, Gross, PAYE, NSSF, SHIF, Net, Status, Download.
**`/payroll/payslips/[id]`** → C · **a printable payslip document** — a white A4-proportioned sheet: company header, employee block, then Earnings and Deductions as two facing columns, a Net Pay band in `bg-blue-soft`, and a footer note. Print and Download buttons outside the sheet.
**`/payroll/loans`** → B · title "Loans", pill "24 Active". Columns: Employee, Principal, Balance, Monthly Deduction, Started, Ends, Status. Side: donut "Loan Status"; "Largest Balances" list.
**`/payroll/loans/[id]`** → C · loan detail with a repayment schedule table (Instalment, Due, Amount, Paid, Balance) and a repayment progress bar.
**`/payroll/advances`** → B · title "Salary Advances", pill "6 Pending". Columns: Employee, Amount, Requested, Reason, Recovery Month, Status, Actions.
**`/payroll/advances/[id]`** → C · advance detail with an approval timeline and a recovery plan.
**`/payroll/documents`** → B · payroll document archive: filters by period and type (Payslip Batch, Statutory Return, Bank File), a table with Generated date, Size and Download.
**`/payroll/reports`** → E · "Payroll Reports". Metrics: Total Gross, Total Net, Statutory Remitted, Avg Cost/Employee. Charts: cost trend; deductions breakdown. Catalogue grid: Payroll Register, Bank Advice, PAYE Return, NSSF Return, SHIF Return, Housing Levy.

### Admin (11)

**`/admin/companies`** → B · title "Companies", action "Add Company". Columns: Company (logo + name over registration no), Branches, Employees, Currency, Status.
**`/admin/companies/[id]`** → C · tabs Overview / Branches / Settings / Billing.
**`/admin/branches/[id]`** → C · branch detail: manager card, headcount tiles, attendance trend, department table, assigned devices.
**`/admin/departments`** → B · title "Departments", action "Add Department". Columns: Department, Code, Company, Head, Employees, Status.
**`/admin/departments/[id]`** → C · department detail with an employee roster and a headcount trend.
**`/admin/agents`** → B · as `/hr/agents` but with write actions and a "Register Agent" button.
**`/admin/agents/[id]`** → C · agent detail with contract management.
**`/admin/users`** → B · title "Users", action "Invite User". Columns: User (avatar + name over username), Email, Role (chip), Branch, Last Login, MFA, Status. Side: donut "Users by Role".
**`/admin/devices`** → B · title "Biometric Devices", action "Register Device". Columns: Device (icon + name over serial), Branch, Model, IP, Last Sync, Firmware, Status with an online/offline dot. Side: SegmentStrip Online / Offline / Syncing; "Sync Failures" list.
**`/admin/settings`** → D · a settings screen with a **left sub-nav of sections** (Company Profile, Payroll Rules, Leave Policy, Attendance Rules, Statutory Rates, Notifications, Security) beside the active panel. Show Payroll Rules: pay cycle, cut-off day, overtime multiplier, rounding, plus toggle switches.
**`/admin/audit`** → B · read-only. Columns: Timestamp, Actor, Role, Module, Action, Entity, IP, Result. Filters for module, actor and date range. Side: "Events by Module" ProgressRows.

### Employee self-service (9)

**`/me/attendance`** → B · a month calendar heat grid plus a daily table (Date, Shift, Clock In, Clock Out, Hours, Status). Side: SegmentStrip; "Hours This Month" progress toward target.
**`/me/leave`** → B · title "My Leave", action "Request Leave". A balance card row per leave type (entitlement, used, remaining as a ring or bar), then a request history table.
**`/me/leave/new`** → D · "Request Leave". Fields: leave type, from, to, days (computed, read-only), reason, attachment. Side: a live balance preview showing the balance before and after.
**`/me/loans`** → B · title "My Loans", action "Request Loan". Active loan card with a repayment progress bar, then a history table.
**`/me/loans/new`** → D · "Request Loan". Fields: amount, repayment period, reason. Side: a live repayment schedule preview.
**`/me/payslips`** → B · payslip list with period filter and Download per row. Side: "Net Pay Trend" bar chart over 6 months.
**`/me/payslips/[id]`** → C · the same printable payslip sheet as `/payroll/payslips/[id]`, read-only.
**`/me/documents`** → B · my documents grid with type icon, name, uploaded date and expiry chip; upload dropzone.
**`/me/profile`** → C/D hybrid · profile header with avatar and Change Photo, then editable sections: Personal, Contact, Next of Kin, Bank Details, Statutory. Read-only fields (employee no, hire date, job title) shown greyed with a small lock icon.

### Agent portal (9)

**`/agent/staff`** → B · title "My Deployed Staff". Columns: Employee, Branch, Role, Deployed From, Rate, Status.
**`/agent/summaries`** → B · title "Monthly Summaries". Columns: Period, Staff, Days Worked, Gross, Commission, Status.
**`/agent/summaries/[id]`** → C · a summary breakdown per employee with a totals row.
**`/agent/invoices`** → B · title "Invoices", pill "3 Overdue". Columns: Invoice No, Period, Staff, Amount, Issued, Due, Status. Side: donut "Invoice Status"; "Overdue" list.
**`/agent/invoices/[id]`** → C · a printable invoice document: agent block, bill-to block, a line-item table, a totals block with VAT, and payment terms.
**`/agent/advances`** → B · title "Advances", action "Request Advance". Columns: Amount, Requested, Purpose, Recovery, Status.
**`/agent/advances/new`** → D · "Request Advance". Fields: amount, purpose, recovery period. Side: eligibility card.
**`/agent/profile`** → C/D hybrid · agent organisation profile: company details, contacts, bank details, contract documents.
**`/agent/dashboard`** → see Dashboards above.

### Audit (5), Branch (5), Finance (7)

**`/audit/logs`** → B · as `/admin/audit`, with an expandable row revealing a before/after JSON diff — removals in `error`, additions in `tertiary`.
**`/audit/logs/[id]`** → C · a single audit event: actor card, request metadata, and a full before/after diff panel.
**`/audit/payroll`** → B · payroll audit trail: run, actor, action, amount changed, timestamp; variance highlighted.
**`/audit/employees`** → B · employee record change history.
**`/audit/reports`** → E · compliance report catalogue.

**`/branch/team`** → B · branch-scoped employee list.
**`/branch/team/[employeeId]`** → C · team member detail, read-mostly.
**`/branch/attendance`** → B · branch-scoped attendance with a Mark Attendance action.
**`/branch/roster`** → B · the weekly roster grid, editable, with drag-affordance chips.
**`/branch/approvals`** → B · a unified approval queue: leave, overtime and advance requests as cards in one list, each with the requester avatar, type chip, summary and inline Approve/Reject.

**`/finance/disbursements`** → B · title "Disbursements", action "New Batch". Columns: Batch, Run, Branch, Employees, Amount, Method, Status.
**`/finance/disbursements/[runId]`** → C · batch detail with a per-employee payment table and failed-payment retry actions.
**`/finance/invoices`** → B · agent invoices awaiting payment; approve-and-pay actions.
**`/finance/invoices/[id]`** → C · the printable invoice document with an approval trail.
**`/finance/statutory`** → B · title "Statutory Remittances". Cards per obligation (PAYE, NSSF, SHIF, Housing Levy) showing amount due, due date and status, then a filing history table.
**`/finance/loans`** → B · loan portfolio view: outstanding balances, recovery rate, defaults.
**`/finance/reports`** → E · finance report catalogue.

### Auth + kiosk (3)

**`/forgot-password`** → matches the existing `/login` split layout: a brand column on the left (navy, logo, tagline, frosted glass panel) and the form card on the right. Single email field, "Send Reset Link" primary button, "Back to sign in" text link. Also draw the success state: green check circle, "Check your email", and a resend link.
**`/reset-password/[token]`** → same shell. Two password fields with visibility toggles, a strength meter (4 segments, red → amber → green), a live rules checklist, and an expired-token error state.
**`/kiosk/clock`** → F · fullscreen biometric clock terminal on `bg-navy`. Centre: a live 22px+ clock and date, a large fingerprint scanner circle with a pulsing ring, and the prompt "Place your finger on the scanner". Below, a small branch/device label. Draw three states: idle, success (green ring, employee name and "Clocked in at 07:58"), and error (red ring, "Not recognised — try again").

---

## Part 5 — After Stitch returns

1. Save the raw HTML under `docs/stitch/<route>.html` for reference.
2. Convert to TSX: replace the rail and topbar with the existing shell (they come from
   `(portal)/layout.tsx` — never re-implement them in a page).
3. Map card markup onto the existing components rather than pasting raw divs:
   `PageHeader`, `CountPill`, `BentoCard`, `StatCard`, `MetricCard`, `SegmentStrip`,
   `AlertSpotlight`, `ApprovalList`, `FilterTabs`, `StatusBadge`, `EmptyState`,
   `BarChart`, `DonutChart`, `StackedBar`, `ProgressRows`, `Icon`.
4. Format all values through `src/lib/format.ts` — `formatMoney`, `formatMoneyCompact`,
   `formatNumber`, `formatPercent`, `formatDate`, `formatDateTime`, `formatDuration`,
   `initials`, `humanizeEnum`. Never inline a formatted string.
5. Gate the page with `requirePermission()` / `requireAnyPermission()` from
   `src/app/lib/dal.ts` using the permission that matches the route's namespace.
6. Keep placeholder data in a typed `const` at the top of the file with the
   `DATA IS PLACEHOLDER` comment block, so the swap to a real endpoint is one line.
