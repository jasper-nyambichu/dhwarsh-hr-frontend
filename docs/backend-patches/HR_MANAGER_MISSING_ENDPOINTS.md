# Backend patch — the three reads the HR_MANAGER rail is missing

**Why:** every other HR screen is now wired to a real endpoint. Three are not,
and they are not wired because no endpoint exists:

| Frontend | Today | Blocked by |
|---|---|---|
| `/hr/leave/[id]` | renders a "no endpoint returns a single leave request" notice | no `GET /leave/{id}` |
| `/hr/leave` | shows only the PENDING_HR queue | no `GET /leave` — approved/rejected history is unreachable |
| `/hr/employees` | fans out one call per branch, no server paging or search | no `GET /employees` |

This patch adds exactly three endpoints and nothing else. No entity, no
migration, no DTO change, no change to any existing response shape.

**Style note:** every snippet below is written to match what is already in the
repository — Lombok `@RequiredArgsConstructor` controllers, the `ApiResponse<T>`
envelope, `PageResponse.from(Page)` for paged reads, `Sort`/`PageRequest` built in
the service (not the controller, and never `Pageable` as a controller
parameter — see `AttendanceDashboardServiceImpl.records` as the reference), and
derived queries preferred over `@Query` except where a derived name genuinely
cannot express the query. The codebase has exactly one `@Query`
(`AttendanceRepository.findActivitySince`); this patch adds two, for the same
reason, and each is commented as such.

`HR_MANAGER_READ_ACCESS.md` (the four `@PreAuthorize` widenings) is a separate,
already-approved patch and is assumed applied.

---

# A. `GET /leave/{leaveRequestId}` — one leave request

Closes `/hr/leave/[id]`. Read-only, HR_MANAGER and SUPER_ADMIN only — the same
two roles as `approve-by-hr` and `pending/hr`, since the only reason to open a
single request is to decide it.

## A1. `controller/leave/LeaveController.java`

**Current** (line 105-106, the last mapping in the file):

```java
    @GetMapping("/my-balance")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ApiResponse<List<LeaveBalanceResponse>> getMyLeaveBalance() {
        return ApiResponse.success(leaveService.getLeaveBalances(accessGuard.currentEmployeeId()));
    }
}
```

**New:**

```java
    @GetMapping("/my-balance")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ApiResponse<List<LeaveBalanceResponse>> getMyLeaveBalance() {
        return ApiResponse.success(leaveService.getLeaveBalances(accessGuard.currentEmployeeId()));
    }

    // A single request, for the HR detail screen. Scoped to the two roles that
    // can already act on any request via approve-by-hr; opening it wider is a
    // separate decision, because a request carries a reason and a rejection
    // reason that the employee's own history endpoint is the right place for.
    @GetMapping("/{leaveRequestId}")
    @PreAuthorize("hasAnyRole('HR_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<LeaveRequestResponse> getLeaveRequest(@PathVariable Long leaveRequestId) {
        return ApiResponse.success(leaveService.getLeaveRequest(leaveRequestId));
    }
}
```

Note the literal mappings (`/types`, `/my-balance`, `/pending/hr`) still win over
this template — Spring ranks a literal pattern above a variable one, so adding it
does not shadow them.

## A2. `service/leave/LeaveService.java`

**Current:**

```java
    List<LeaveRequestResponse> getLeaveHistoryForEmployee(Long employeeId);
    List<LeaveRequestResponse> getPendingManagerApprovals(Long branchId);
    List<LeaveRequestResponse> getPendingHrApprovals();
    List<LeaveBalanceResponse> getLeaveBalances(Long employeeId);
}
```

**New:**

```java
    List<LeaveRequestResponse> getLeaveHistoryForEmployee(Long employeeId);
    List<LeaveRequestResponse> getPendingManagerApprovals(Long branchId);
    List<LeaveRequestResponse> getPendingHrApprovals();
    List<LeaveBalanceResponse> getLeaveBalances(Long employeeId);

    LeaveRequestResponse getLeaveRequest(Long leaveRequestId);
    PageResponse<LeaveRequestResponse> getLeaveRequests(Long employeeId, LeaveStatus status, int page, int size);
}
```

Two imports to add at the top of the same file, after the existing
`dto.response.leave.LeaveTypeResponse` import:

```java
import com.company.hrpayroll.dto.response.PageResponse;
import com.company.hrpayroll.entity.leave.LeaveStatus;
```

## A3. `service/leave/impl/LeaveServiceImpl.java`

**Current** (the tail of the file, from `getLeaveBalances`'s closing brace):

```java
    private LeaveRequest findOrThrow(Long id) {
```

**New** (inserted immediately before it):

```java
    @Override
    public LeaveRequestResponse getLeaveRequest(Long leaveRequestId) {
        return toResponseWithNames(findOrThrow(leaveRequestId));
    }

    @Override
    public PageResponse<LeaveRequestResponse> getLeaveRequests(
            Long employeeId, LeaveStatus status, int page, int size) {

        Pageable pageable = PageRequest.of(
                Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "startDate"));

        Page<LeaveRequest> result = leaveRequestRepository.search(employeeId, status, pageable);
        return PageResponse.from(result.map(this::toResponseWithNames));
    }

    private LeaveRequest findOrThrow(Long id) {
```

`findOrThrow` already exists and already throws
`ResourceNotFoundException("Leave request not found with id: " + id)`, which the
global handler turns into a 404 — so A1 needs no error handling of its own.

Four imports to add, keeping the existing alphabetical order:

```java
import com.company.hrpayroll.dto.response.PageResponse;          // after LeaveTypeResponse
import org.springframework.data.domain.Page;                     // after lombok.RequiredArgsConstructor
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
```

## A4. `repository/leave/LeaveRequestRepository.java`

**Current:**

```java
import com.company.hrpayroll.entity.leave.LeaveRequest;
import com.company.hrpayroll.entity.leave.LeaveStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByEmployeeId(Long employeeId);

    List<LeaveRequest> findByStatus(LeaveStatus status);
```

**New:**

```java
import com.company.hrpayroll.entity.leave.LeaveRequest;
import com.company.hrpayroll.entity.leave.LeaveStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByEmployeeId(Long employeeId);

    List<LeaveRequest> findByStatus(LeaveStatus status);

    // The HR leave register. Two optional filters plus paging cannot be spelled
    // as a derived method name without one finder per combination, so this is
    // the second @Query in the repository layer — same reason as
    // AttendanceRepository.findActivitySince. A null argument means "do not
    // filter on this column".
    @Query("""
            select lr from LeaveRequest lr
            where (:employeeId is null or lr.employeeId = :employeeId)
              and (:status is null or lr.status = :status)
            """)
    Page<LeaveRequest> search(@Param("employeeId") Long employeeId,
                              @Param("status") LeaveStatus status,
                              Pageable pageable);
```

---

# B. `GET /employees` — the company-wide directory

Closes the fan-out in `/hr/employees` (one `by-branch` call per branch, merged
client-side, no paging, no sorting, no search).

**Scoping is the whole point of this one.** Every existing employee read is
scoped — `by-branch`, `by-agent`, `by-department` — and `by-branch` carries
`or @accessGuard.isSameBranch(#branchId)` precisely so a BRANCH_MANAGER cannot
read another branch. A company-wide list must not quietly undo that, so this
endpoint is restricted to the four roles already trusted with every branch and
deliberately **excludes** BRANCH_MANAGER and AGENT. They keep their scoped
endpoints.

Returns `EmployeeSummaryResponse` — the same thin shape as every other list read,
so salary and statutory identifiers still never appear in a listing.

## B1. `controller/employee/EmployeeController.java`

**Current** (line 55-61):

```java
    // The real branch boundary — a Branch Manager can only list employees
    // for their own branch.
    @GetMapping("/by-branch/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER') or @accessGuard.isSameBranch(#branchId)")
    public ApiResponse<List<EmployeeSummaryResponse>> getEmployeesByBranch(@PathVariable Long branchId) {
        return ApiResponse.success(employeeService.getEmployeesByBranch(branchId));
    }
```

**New** (inserted before it, directly after `getEmployeeById`):

```java
    // The company-wide directory. Unlike every other employee read this is not
    // scoped to a branch, so BRANCH_MANAGER and AGENT are deliberately absent —
    // a company-wide list would hand them the whole company and undo the
    // per-branch and per-agent guards on the by-* endpoints below.
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER')")
    public ApiResponse<PageResponse<EmployeeSummaryResponse>> getEmployees(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long agentId,
            @RequestParam(required = false) String employmentStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        return ApiResponse.success(
                employeeService.getEmployees(q, branchId, departmentId, agentId, employmentStatus, page, size));
    }

    // The real branch boundary — a Branch Manager can only list employees
    // for their own branch.
    @GetMapping("/by-branch/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER') or @accessGuard.isSameBranch(#branchId)")
    public ApiResponse<List<EmployeeSummaryResponse>> getEmployeesByBranch(@PathVariable Long branchId) {
        return ApiResponse.success(employeeService.getEmployeesByBranch(branchId));
    }
```

Import to add:

```java
import com.company.hrpayroll.dto.response.PageResponse;
```

## B2. `service/employee/EmployeeService.java`

**Current:**

```java
public interface EmployeeService {
    EmployeeResponse createEmployee(EmployeeRequest request);
    EmployeeResponse updateEmployee(Long id, EmployeeRequest request);
    EmployeeResponse getEmployeeById(Long id);
    List<EmployeeSummaryResponse> getEmployeesByBranch(Long branchId);
```

**New:**

```java
public interface EmployeeService {
    EmployeeResponse createEmployee(EmployeeRequest request);
    EmployeeResponse updateEmployee(Long id, EmployeeRequest request);
    EmployeeResponse getEmployeeById(Long id);
    PageResponse<EmployeeSummaryResponse> getEmployees(String query, Long branchId, Long departmentId,
                                                       Long agentId, String employmentStatus, int page, int size);
    List<EmployeeSummaryResponse> getEmployeesByBranch(Long branchId);
```

Import to add:

```java
import com.company.hrpayroll.dto.response.PageResponse;
```

## B3. `service/employee/impl/EmployeeServiceImpl.java`

**Current** (line 67-72):

```java
    @Override
    public List<EmployeeSummaryResponse> getEmployeesByBranch(Long branchId) {
        return employeeRepository.findByBranchId(branchId).stream()
                .map(this::toSummaryResponse)
                .toList();
    }
```

**New** (a paged method inserted before it):

```java
    @Override
    public PageResponse<EmployeeSummaryResponse> getEmployees(
            String query, Long branchId, Long departmentId, Long agentId,
            String employmentStatus, int page, int size) {

        Pageable pageable = PageRequest.of(
                Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.ASC, "fullName"));

        Page<Employee> result = employeeRepository.search(
                (query == null || query.isBlank()) ? null : query.trim(),
                branchId, departmentId, agentId,
                (employmentStatus == null || employmentStatus.isBlank()) ? null : employmentStatus,
                pageable);

        // One branch lookup for the whole page rather than one per row — the
        // same batching AttendanceDashboardServiceImpl.records uses.
        Map<Long, String> branchNames = branchRepository
                .findAllById(result.getContent().stream()
                        .map(Employee::getBranchId)
                        .collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(Branch::getId, Branch::getName));

        return PageResponse.from(result.map(employee ->
                employeeMapper.toEmployeeSummaryResponse(employee, branchNames.get(employee.getBranchId()))));
    }

    @Override
    public List<EmployeeSummaryResponse> getEmployeesByBranch(Long branchId) {
        return employeeRepository.findByBranchId(branchId).stream()
                .map(this::toSummaryResponse)
                .toList();
    }
```

Imports to add:

```java
import com.company.hrpayroll.dto.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Map;
import java.util.stream.Collectors;
```

## B4. `repository/employee/EmployeeRepository.java`

**Current:**

```java
import com.company.hrpayroll.entity.employee.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByEmployeeNumber(String employeeNumber);
```

**New:**

```java
import com.company.hrpayroll.entity.employee.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByEmployeeNumber(String employeeNumber);

    // The company-wide directory. Four optional filters plus a free-text search
    // would be sixteen derived finders; a null argument means "do not filter on
    // this column" instead.
    @Query("""
            select e from Employee e
            where (:branchId is null or e.branchId = :branchId)
              and (:departmentId is null or e.departmentId = :departmentId)
              and (:agentId is null or e.agentId = :agentId)
              and (:employmentStatus is null or e.employmentStatus = :employmentStatus)
              and (:query is null
                   or lower(e.fullName) like lower(concat('%', :query, '%'))
                   or lower(e.employeeNumber) like lower(concat('%', :query, '%')))
            """)
    Page<Employee> search(@Param("query") String query,
                          @Param("branchId") Long branchId,
                          @Param("departmentId") Long departmentId,
                          @Param("agentId") Long agentId,
                          @Param("employmentStatus") String employmentStatus,
                          Pageable pageable);
```

---

# Follow-up, not in this patch

Two frontend permissions still have no endpoint behind them. Neither blocks an
HR screen, so neither is patched here — recorded so the mismatch is not
rediscovered later.

- **`leave:type:manage`** — `roles.ts` grants it to HR_MANAGER; `LeaveController`
  exposes `GET /leave/types` only. Creating or editing a leave type is a
  database change today, and `/hr/leave-types` says so on the page.
- **`agent:write`** — `roles.ts` grants it to HR_MANAGER; `POST`/`PUT /agents`
  are SUPER_ADMIN/ADMIN and `PUT /agents/{id}/deactivate` is SUPER_ADMIN.
  `/hr/agents` is therefore read-only, and `HR_MANAGER_READ_ACCESS.md` notes the
  same thing.

# Verify after applying

```
cd hrpayroll_backend
mvn -q spring-boot:run     # or docker compose up
```

Flyway must report no new migration (this patch adds none) and
`ddl-auto: validate` must pass unchanged — no entity field is touched.

Then, with an `HR-MANAGER` token:

```
GET /leave/1                      -> 200, or 404 if no such request
GET /leave                        -> 200, pageNumber/pageSize/totalElements present
GET /leave?status=APPROVED        -> 200, only APPROVED rows
GET /leave?page=1&size=5          -> 200, 5 rows, pageNumber 1
GET /employees                    -> 200, paged
GET /employees?q=njoroge          -> 200, name match, case-insensitive
GET /employees?branchId=1         -> 200, only that branch
GET /employees?employmentStatus=TERMINATED -> 200
```

And the two that must **fail**, proving B did not widen anything:

```
GET /employees      as BRANCH_MANAGER  -> 403
GET /employees      as AGENT           -> 403
GET /leave/1        as EMPLOYEE        -> 403
```

A bad enum on the filter is a 400, not a silent empty page — worth confirming,
since it is the one place a typo is indistinguishable from "no results" if the
conversion is ever relaxed:

```
GET /leave?status=NONSENSE        -> 400
```

## Two things this patch knowingly does not fix

- **`toResponseWithNames` is still per-row.** The paged register calls it once
  per row, so a 100-row page issues 200 lookups. That is exactly what
  `getPendingHrApprovals` already does, so the patch stays consistent rather than
  introducing one optimised method beside five unoptimised ones. Batching it is
  a worthwhile follow-up across all of `LeaveServiceImpl`, not a fix to slip
  into this one.
- **`employmentStatus` is a free `String`** on both the entity and the request,
  with no enum to validate against. The filter therefore accepts any value.
  Introducing an `EmploymentStatus` enum is an entity change with a migration
  behind it, which is out of scope here.
