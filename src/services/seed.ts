import { STORES, addTo, getMeta, setMeta, tx } from './db';
import { hashPassword } from './security';
import type { Attendance, DocumentRecord, Employee, LeaveRequest, Payroll, User } from '../types';
import { addDays, monthISO, todayISO } from '../utils/format';

export const DEMO_PASSWORD = 'Dayflow@2026';

interface SeedPerson {
  employee_id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'HR';
  department: string;
  designation: string;
  joining_date: string;
  phone: string;
  address: string;
  basic: number;
}

const PEOPLE: SeedPerson[] = [
{
  employee_id: 'HRM001',
  name: 'Priya Raghavan',
  email: 'hr@dayflow.io',
  role: 'HR',
  department: 'People Operations',
  designation: 'Head of HR',
  joining_date: '2021-03-15',
  phone: '+91 98450 11223',
  address: '14 Brigade Road, Bengaluru 560001',
  basic: 145000
},
{
  employee_id: 'EMP001',
  name: 'Arjun Mehta',
  email: 'arjun@dayflow.io',
  role: 'EMPLOYEE',
  department: 'Engineering',
  designation: 'Senior Backend Engineer',
  joining_date: '2022-01-10',
  phone: '+91 99860 44521',
  address: '221 Indiranagar, Bengaluru 560038',
  basic: 118000
},
{
  employee_id: 'EMP002',
  name: 'Neha Kulkarni',
  email: 'neha@dayflow.io',
  role: 'EMPLOYEE',
  department: 'Engineering',
  designation: 'Frontend Engineer',
  joining_date: '2023-06-05',
  phone: '+91 98220 77341',
  address: '9 Koregaon Park, Pune 411001',
  basic: 92000
},
{
  employee_id: 'EMP003',
  name: 'Daniel Okafor',
  email: 'daniel@dayflow.io',
  role: 'EMPLOYEE',
  department: 'Design',
  designation: 'Product Designer',
  joining_date: '2022-09-19',
  phone: '+91 90045 22318',
  address: '5 Residency Road, Bengaluru 560025',
  basic: 88000
},
{
  employee_id: 'EMP004',
  name: 'Sara Lindqvist',
  email: 'sara@dayflow.io',
  role: 'EMPLOYEE',
  department: 'Finance',
  designation: 'Financial Analyst',
  joining_date: '2020-11-02',
  phone: '+91 90192 55407',
  address: '77 Marine Drive, Mumbai 400020',
  basic: 105000
},
{
  employee_id: 'EMP005',
  name: 'Rahul Verma',
  email: 'rahul@dayflow.io',
  role: 'EMPLOYEE',
  department: 'Sales',
  designation: 'Account Executive',
  joining_date: '2023-02-13',
  phone: '+91 98111 60932',
  address: '31 Hauz Khas, New Delhi 110016',
  basic: 76000
},
{
  employee_id: 'EMP006',
  name: 'Ananya Iyer',
  email: 'ananya@dayflow.io',
  role: 'EMPLOYEE',
  department: 'Engineering',
  designation: 'QA Engineer',
  joining_date: '2024-04-01',
  phone: '+91 97400 18265',
  address: '18 Adyar, Chennai 600020',
  basic: 68000
},
{
  employee_id: 'EMP007',
  name: 'Marcus Bell',
  email: 'marcus@dayflow.io',
  role: 'EMPLOYEE',
  department: 'Support',
  designation: 'Customer Success Lead',
  joining_date: '2021-08-23',
  phone: '+91 96320 74158',
  address: '46 Banjara Hills, Hyderabad 500034',
  basic: 82000
},
{
  employee_id: 'EMP008',
  name: 'Fatima Sheikh',
  email: 'fatima@dayflow.io',
  role: 'EMPLOYEE',
  department: 'People Operations',
  designation: 'HR Associate',
  joining_date: '2023-10-09',
  phone: '+91 93720 41186',
  address: '12 Salt Lake, Kolkata 700091',
  basic: 61000
},
{
  employee_id: 'EMP009',
  name: 'Vikram Nair',
  email: 'vikram@dayflow.io',
  role: 'EMPLOYEE',
  department: 'Design',
  designation: 'Design Systems Lead',
  joining_date: '2022-05-30',
  phone: '+91 90876 33291',
  address: '3 Panampilly Nagar, Kochi 682036',
  basic: 99000
},
{
  employee_id: 'EMP010',
  name: 'Grace Mwangi',
  email: 'grace@dayflow.io',
  role: 'EMPLOYEE',
  department: 'Sales',
  designation: 'Sales Development Rep',
  joining_date: '2024-07-15',
  phone: '+91 91234 88710',
  address: '58 Viman Nagar, Pune 411014',
  basic: 54000
},
{
  employee_id: 'EMP011',
  name: 'Tanvi Desai',
  email: 'tanvi@dayflow.io',
  role: 'EMPLOYEE',
  department: 'Finance',
  designation: 'Payroll Specialist',
  joining_date: '2021-12-06',
  phone: '+91 99303 21764',
  address: '24 Satellite, Ahmedabad 380015',
  basic: 71000
}];


function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function isoAt(date: string, hour: number, minute: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

let seeding: Promise<void> | null = null;

export function ensureSeeded(): Promise<void> {
  if (!seeding) seeding = seed();
  return seeding;
}

async function seed(): Promise<void> {
  if (await getMeta<boolean>('seeded')) return;

  const password_hash = await hashPassword(DEMO_PASSWORD);
  const today = todayISO();
  const random = seededRandom(20260822);

  await tx(
    [
    STORES.users,
    STORES.employees,
    STORES.attendance,
    STORES.leave_requests,
    STORES.payroll,
    STORES.documents,
    STORES.notifications,
    STORES.audit_logs],

    'readwrite',
    async (t) => {
      const stamp = new Date().toISOString();

      for (const person of PEOPLE) {
        const userId = (await addTo(t, STORES.users, {
          employee_id: person.employee_id,
          email: person.email,
          password_hash,
          role: person.role,
          is_verified: true,
          verification_code: '',
          created_at: stamp,
          updated_at: stamp
        } as Omit<User, 'user_id'>)) as number;

        await addTo(t, STORES.employees, {
          employee_id: person.employee_id,
          user_id: userId,
          name: person.name,
          phone: person.phone,
          address: person.address,
          department: person.department,
          designation: person.designation,
          joining_date: person.joining_date,
          profile_picture: null,
          created_at: stamp,
          updated_at: stamp
        } as Employee);

        // 60 days of attendance history, weekdays only.
        for (let i = 59; i >= 0; i -= 1) {
          const date = addDays(today, -i);
          const weekday = new Date(`${date}T00:00:00`).getDay();
          if (weekday === 0 || weekday === 6) continue;
          if (date > today) continue;
          const roll = random();
          let status: Attendance['status'] = 'PRESENT';
          if (roll > 0.955) status = 'ABSENT';else
          if (roll > 0.9) status = 'LEAVE';else
          if (roll > 0.85) status = 'HALF_DAY';
          if (date === today && i === 0) status = 'ABSENT';

          const startHour = 9;
          const startMinute = Math.floor(random() * 45);
          const worked = status === 'PRESENT' ? 8 + random() * 1.2 : status === 'HALF_DAY' ? 4 : 0;
          const checkIn =
          status === 'PRESENT' || status === 'HALF_DAY' ? isoAt(date, startHour, startMinute) : null;
          const checkOut =
          checkIn && !(date === today) ?
          new Date(new Date(checkIn).getTime() + worked * 3_600_000).toISOString() :
          null;

          await addTo(t, STORES.attendance, {
            employee_id: person.employee_id,
            date,
            check_in: checkIn,
            check_out: checkOut,
            working_hours: checkOut ? Math.round(worked * 100) / 100 : 0,
            status,
            created_at: stamp,
            updated_at: stamp
          } as Omit<Attendance, 'attendance_id'>);
        }

        // Payroll for the last 3 months.
        for (let m = 2; m >= 0; m -= 1) {
          const d = new Date();
          d.setDate(1);
          d.setMonth(d.getMonth() - m);
          const allowances = Math.round(person.basic * 0.22);
          const deductions = Math.round(person.basic * 0.11);
          await addTo(t, STORES.payroll, {
            employee_id: person.employee_id,
            month: monthISO(d),
            basic_salary: person.basic,
            allowances,
            deductions,
            net_salary: person.basic + allowances - deductions,
            created_at: stamp,
            updated_at: stamp
          } as Omit<Payroll, 'payroll_id'>);
        }

        for (const name of ['Offer Letter.pdf', 'ID Proof.pdf', 'Latest Payslip.pdf']) {
          await addTo(t, STORES.documents, {
            employee_id: person.employee_id,
            document_name: name,
            document_path: `/secure/docs/${person.employee_id}/${name}`,
            uploaded_at: stamp
          } as Omit<DocumentRecord, 'document_id'>);
        }

        await addTo(t, STORES.notifications, {
          user_id: userId,
          title: 'Welcome to Dayflow',
          message: `Signed in as ${person.role === 'HR' ? 'HR Officer' : 'Employee'} ${person.employee_id}.`,
          is_read: false,
          created_at: stamp
        });
      }

      // A spread of leave requests, some awaiting HR.
      const leaves: Array<Omit<LeaveRequest, 'leave_id'>> = [
      {
        employee_id: 'EMP001',
        leave_type: 'PAID',
        start_date: addDays(today, 4),
        end_date: addDays(today, 6),
        remarks: 'Family wedding out of town.',
        status: 'PENDING',
        hr_comment: null,
        approved_by: null,
        created_at: stamp,
        updated_at: stamp
      },
      {
        employee_id: 'EMP003',
        leave_type: 'SICK',
        start_date: addDays(today, 1),
        end_date: addDays(today, 2),
        remarks: 'Recovering from a viral fever, doctor advised rest.',
        status: 'PENDING',
        hr_comment: null,
        approved_by: null,
        created_at: stamp,
        updated_at: stamp
      },
      {
        employee_id: 'EMP006',
        leave_type: 'UNPAID',
        start_date: addDays(today, 10),
        end_date: addDays(today, 14),
        remarks: 'Extended personal travel, no paid balance remaining.',
        status: 'PENDING',
        hr_comment: null,
        approved_by: null,
        created_at: stamp,
        updated_at: stamp
      },
      {
        employee_id: 'EMP002',
        leave_type: 'PAID',
        start_date: addDays(today, -12),
        end_date: addDays(today, -10),
        remarks: 'Short break after the release cycle.',
        status: 'APPROVED',
        hr_comment: 'Approved — handover completed.',
        approved_by: 'HRM001',
        created_at: stamp,
        updated_at: stamp
      },
      {
        employee_id: 'EMP005',
        leave_type: 'SICK',
        start_date: addDays(today, -20),
        end_date: addDays(today, -19),
        remarks: 'Migraine, unable to work.',
        status: 'APPROVED',
        hr_comment: 'Take care.',
        approved_by: 'HRM001',
        created_at: stamp,
        updated_at: stamp
      },
      {
        employee_id: 'EMP010',
        leave_type: 'UNPAID',
        start_date: addDays(today, -6),
        end_date: addDays(today, -3),
        remarks: 'Personal reasons.',
        status: 'REJECTED',
        hr_comment: 'Quarter-end coverage required — please re-plan for next month.',
        approved_by: 'HRM001',
        created_at: stamp,
        updated_at: stamp
      }];

      for (const leave of leaves) await addTo(t, STORES.leave_requests, leave);

      await addTo(t, STORES.audit_logs, {
        user_id: 1,
        actor: 'system@dayflow.io',
        action: 'DATABASE_INITIALISED',
        entity: 'SYSTEM',
        entity_id: 'seed',
        timestamp: stamp
      });
    }
  );

  await setMeta('seeded', true);
  await setMeta('schema_version', 1);
}