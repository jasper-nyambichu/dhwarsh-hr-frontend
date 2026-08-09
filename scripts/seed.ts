/**
 * Seeds the reference data every portal route needs, through the real REST
 * API rather than SQL — so the POST/PUT paths get exercised on the way in and
 * anything the backend rejects surfaces here instead of at first page load.
 *
 * Idempotent by natural key: re-running skips branches, departments and
 * employees that already exist. Company uses PUT, which is upsert by design.
 *
 *   npx tsx scripts/seed.ts [username] [password]
 */
import { readFileSync } from "node:fs";

function envValue(key: string): string {
  const file = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const match = new RegExp(`^${key}="?([^"\\n]*)"?$`, "m").exec(file);
  if (!match) throw new Error(`${key} missing from .env.local`);
  return match[1];
}

const API = envValue("API_BASE_URL").replace(/\/$/, "");

let token = "";

async function call<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const envelope = await response.json().catch(() => undefined);

  if (!response.ok || envelope?.success === false) {
    const detail = envelope?.data ? ` ${JSON.stringify(envelope.data)}` : "";
    throw new Error(
      `${method} ${path} -> ${response.status}: ${envelope?.message ?? "no body"}${detail}`,
    );
  }

  return envelope?.data as T;
}

/* ------------------------------------------------------------------ data -- */

const COMPANY = {
  name: "Dhwarsh Group Limited",
  address: "Kimathi Street, Nairobi",
  phone: "+254 20 221 4400",
  email: "info@dhwarsh.co.ke",
  website: "https://dhwarsh.co.ke",
  kraPin: "P051234567X",
  shifNumber: "SHIF-004821",
  nssfNumber: "NSSF-119043",
  nitaNumber: "NITA-77120",
  currency: "KES",
  timezone: "Africa/Nairobi",
};

const BRANCHES = [
  { name: "Nairobi CBD", code: "NRB", address: "Kimathi Street, Nairobi", phone: "+254 20 221 4400", email: "nairobi@dhwarsh.co.ke" },
  { name: "Mombasa", code: "MSA", address: "Moi Avenue, Mombasa", phone: "+254 41 222 3311", email: "mombasa@dhwarsh.co.ke" },
  { name: "Nakuru", code: "NKR", address: "Kenyatta Avenue, Nakuru", phone: "+254 51 221 7788", email: "nakuru@dhwarsh.co.ke" },
];

/** Per-branch department names; every branch gets the same set. */
const DEPARTMENTS = ["Operations", "Finance", "Human Resources", "Security"];

type Seed = {
  fullName: string;
  branch: string;
  department: string;
  position: string;
  employmentType: "PERMANENT" | "CONTRACT" | "CASUAL" | "OUTSOURCED";
  basicSalary: number;
  gender: "MALE" | "FEMALE";
  nationalId: string;
  phone: string;
};

const EMPLOYEES: Seed[] = [
  { fullName: "Alice Wanjiru Njoroge", branch: "NRB", department: "Operations", position: "Cashier", employmentType: "PERMANENT", basicSalary: 48000, gender: "FEMALE", nationalId: "29104871", phone: "+254 712 440 118" },
  { fullName: "Brian Otieno Ochieng", branch: "NRB", department: "Operations", position: "Stock Clerk", employmentType: "PERMANENT", basicSalary: 42000, gender: "MALE", nationalId: "30218844", phone: "+254 722 118 903" },
  { fullName: "Caroline Mueni Mutiso", branch: "NRB", department: "Human Resources", position: "HR Assistant", employmentType: "PERMANENT", basicSalary: 65000, gender: "FEMALE", nationalId: "27889112", phone: "+254 733 901 447" },
  { fullName: "Daniel Kiprop Ruto", branch: "NRB", department: "Finance", position: "Accounts Clerk", employmentType: "CONTRACT", basicSalary: 58000, gender: "MALE", nationalId: "31447209", phone: "+254 701 552 380" },
  { fullName: "Esther Akinyi Odhiambo", branch: "MSA", department: "Operations", position: "Supervisor", employmentType: "PERMANENT", basicSalary: 72000, gender: "FEMALE", nationalId: "28336570", phone: "+254 715 226 704" },
  { fullName: "Francis Mwangi Kamau", branch: "MSA", department: "Security", position: "Security Officer", employmentType: "OUTSOURCED", basicSalary: 35000, gender: "MALE", nationalId: "32009184", phone: "+254 726 883 015" },
  { fullName: "Grace Chebet Kirui", branch: "MSA", department: "Finance", position: "Cashier", employmentType: "PERMANENT", basicSalary: 46000, gender: "FEMALE", nationalId: "29774031", phone: "+254 738 440 662" },
  { fullName: "Henry Barasa Wekesa", branch: "NKR", department: "Operations", position: "Branch Coordinator", employmentType: "PERMANENT", basicSalary: 81000, gender: "MALE", nationalId: "26551908", phone: "+254 705 337 219" },
  { fullName: "Irene Nasimiyu Simiyu", branch: "NKR", department: "Human Resources", position: "Recruitment Officer", employmentType: "CONTRACT", basicSalary: 61000, gender: "FEMALE", nationalId: "31882447", phone: "+254 719 664 508" },
  { fullName: "Joseph Mutua Nzioka", branch: "NKR", department: "Security", position: "Security Officer", employmentType: "CASUAL", basicSalary: 32000, gender: "MALE", nationalId: "33120765", phone: "+254 748 209 331" },
];

/* ------------------------------------------------------------------ main -- */

type Identified = { id: number; name: string; code?: string };

async function main() {
  const [username = "admin", password = "Admin@12345"] = process.argv.slice(2);

  const auth = await call<{ accessToken: string; role: string }>(
    "POST",
    "/auth/login",
    { username, password },
  );
  token = auth.accessToken;
  console.log(`✓ authenticated as ${username} (${auth.role})`);

  await call("PUT", "/company", COMPANY);
  console.log(`✓ company: ${COMPANY.name}`);

  // Branch codes feed employee-number generation (EMP-{code}-0001), so they
  // have to exist before any employee is created.
  const existingBranches = await call<Identified[]>("GET", "/branches");
  const branchesByCode = new Map(
    existingBranches.map((b) => [b.code as string, b.id]),
  );

  for (const branch of BRANCHES) {
    if (branchesByCode.has(branch.code)) {
      console.log(`· branch ${branch.code} already exists`);
      continue;
    }
    const created = await call<Identified>("POST", "/branches", branch);
    branchesByCode.set(branch.code, created.id);
    console.log(`✓ branch ${branch.code} — ${branch.name}`);
  }

  const departmentsByKey = new Map<string, number>();

  for (const [code, branchId] of branchesByCode) {
    const existing = await call<Identified[]>(
      "GET",
      `/departments/by-branch/${branchId}`,
    );
    for (const dept of existing) {
      departmentsByKey.set(`${code}:${dept.name}`, dept.id);
    }

    for (const name of DEPARTMENTS) {
      if (departmentsByKey.has(`${code}:${name}`)) continue;
      const created = await call<Identified>("POST", "/departments", {
        name,
        branchId,
      });
      departmentsByKey.set(`${code}:${name}`, created.id);
      console.log(`✓ department ${code}/${name}`);
    }
  }

  let created = 0;
  let skipped = 0;

  for (const seed of EMPLOYEES) {
    const branchId = branchesByCode.get(seed.branch);
    const departmentId = departmentsByKey.get(`${seed.branch}:${seed.department}`);

    if (!branchId || !departmentId) {
      throw new Error(`missing branch/department for ${seed.fullName}`);
    }

    try {
      const employee = await call<{ id: number; employeeNumber: string }>(
        "POST",
        "/employees",
        {
          fullName: seed.fullName,
          nationalId: seed.nationalId,
          gender: seed.gender,
          phone: seed.phone,
          email: `${seed.fullName.split(" ")[0].toLowerCase()}.${seed.fullName.split(" ").at(-1)!.toLowerCase()}@dhwarsh.co.ke`,
          branchId,
          departmentId,
          position: seed.position,
          employmentType: seed.employmentType,
          basicSalary: seed.basicSalary,
          dateHired: "2024-03-01",
        },
      );
      created++;
      console.log(`✓ employee ${employee.employeeNumber} — ${seed.fullName}`);
    } catch (error) {
      // National ID is unique; a re-run hits DuplicateResourceException.
      if (error instanceof Error && /already exists/i.test(error.message)) {
        skipped++;
        continue;
      }
      throw error;
    }
  }

  console.log(`\nDone. ${created} employees created, ${skipped} already present.`);
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  process.exit(1);
});
