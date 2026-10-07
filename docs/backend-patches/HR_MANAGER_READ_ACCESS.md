# Backend patch — grant HR_MANAGER read access to branches and agents

**Why:** the Add Employee form and the HR employee directory cannot work without
these two reads. `POST /employees` already accepts `HR_MANAGER`, but the form has
to populate a Branch dropdown (and optionally an Agent dropdown) first, and
`GET /branches` and `GET /agents` are currently closed to the role. The failure
is a 403 on page load, which reads to the user as "the dashboard is broken".

**Scope:** exactly four `@PreAuthorize` annotations, all on `GET` mappings. No new
endpoints, no writes, no service or DTO changes. `PUT`/`POST`/`DELETE` on both
controllers are untouched — HR still cannot create, edit or deactivate a branch or
an agent.

Apply by hand or drop these two files over the originals. The repository lives at
`hrpayroll_backend/`.

---

## 1. `src/main/java/com/company/hrpayroll/controller/branch/BranchController.java`

### 1a. `getBranchById` — line 45

```diff
     // Super Admin/Admin see any branch by ID; a Branch Manager can only
     // fetch their own — this is AccessGuard.isSameBranch() doing exactly
     // what it was built for back in the security phase.
+    // HR_MANAGER reads any branch: the Add Employee form and the per-branch
+    // employee directory both need to resolve branch names, and HR writes
+    // employees into any of them.
     @GetMapping("/{id}")
-    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN') or @accessGuard.isSameBranch(#id)")
+    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER') or @accessGuard.isSameBranch(#id)")
     public ApiResponse<BranchResponse> getBranchById(@PathVariable Long id) {
```

### 1b. `getAllBranches` — line 60

```diff
     @GetMapping
-    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
+    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')")
     public ApiResponse<List<BranchResponse>> getAllBranches() {
```

---

## 2. `src/main/java/com/company/hrpayroll/controller/agent/AgentController.java`

### 2a. `getAgentById` — line 43

```diff
     @GetMapping("/{id}")
-    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PAYROLL_OFFICER') or @accessGuard.isSameAgent(#id)")
+    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PAYROLL_OFFICER', 'HR_MANAGER') or @accessGuard.isSameAgent(#id)")
     public ApiResponse<AgentResponse> getAgentById(@PathVariable Long id) {
```

### 2b. `getAllAgents` — line 55

```diff
     @GetMapping
-    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PAYROLL_OFFICER')")
+    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PAYROLL_OFFICER', 'HR_MANAGER')")
     public ApiResponse<List<AgentResponse>> getAllAgents() {
```

---

## Note on `agent:write`

`src/config/roles.ts` gives `HR_MANAGER` the `agent:write` permission, but no agent
write endpoint admits the role — `POST`/`PUT /agents` are SUPER_ADMIN/ADMIN and
`PUT /agents/{id}/deactivate` is SUPER_ADMIN. This patch deliberately does **not**
change that. Until it is reconciled, HR screens must not render an agent
create/edit/deactivate control. Tracked as a follow-up.

## Verify after applying

```
cd hrpayroll_backend
mvn -q spring-boot:run     # or docker compose up
```

Then, with an `HR-MANAGER` token:

```
GET /branches      -> 200, success:true, a non-empty list
GET /branches/1    -> 200
GET /agents        -> 200
GET /agents/1      -> 200
```

Each must return 200 rather than 403. The frontend `/hr/employees/new` page
populating its Branch dropdown is the end-to-end confirmation.
