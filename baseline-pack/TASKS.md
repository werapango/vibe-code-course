# TASKS — Work Breakdown Structure (ฉบับอ้างอิง / baseline)

> 1 task = 1 prompt ให้ agent · แก้ 1–3 ไฟล์ · ตรวจได้ด้วย AC ใน SPEC.md
> สั่ง agent ทีละ task: `ทำ task T1.1 ใน TASKS.md`

## Epic 0: Starter (มีให้แล้ว)
- [x] **T0.1** โครง Worker + Hono + หน้าเว็บ + `/api/health` — AC-0.1
- [x] **T0.2** ผู้ใช้ + เข้าสู่ระบบ + จัดการผู้ใช้ (admin) — AC-A1.1 – AC-A4.6 (FR-10)
- [x] **T0.3** smoke test + traceability check

## Epic 1: รถส่วนกลาง (US-1)
- [ ] **T1.1** migration `0002_cars.sql` + API `src/routes/cars.ts` (GET ทุกคนที่ล็อกอิน · POST/PUT/DELETE admin) + เคส smoke — depends: – — AC-1.1 – AC-1.6
- [ ] 👤 `npx wrangler d1 migrations apply app-db --local` → `npm run smoke` → `npm run trace` → commit
- [ ] **T1.2** หน้าเว็บ "รถ": รายการรถ + ฟอร์มเพิ่ม/แก้/ลบ (เฉพาะ admin) ใน `public/` — depends: T1.1 — AC-1.1, AC-1.5

## Epic 2: การจอง (US-2, US-3, US-4)
- [ ] **T2.1** migration `0003_bookings.sql` + `src/lib/time.ts` + `POST /api/bookings` พร้อมกติกาทั้งหมด + เคส smoke จาก**ตารางตัวอย่าง #1–#8** — depends: T1.1 — AC-2.1 – AC-2.7
- [ ] 👤 migration local → smoke → trace → commit
- [ ] **T2.2** `GET /api/bookings` (ของฉัน) + `DELETE /api/bookings/:id` (ของฉันเท่านั้น) + เคส smoke — depends: T2.1 — AC-3.1 – AC-3.3
- [ ] **T2.3** `GET /api/cars/:id/schedule?date=` + เคส smoke — depends: T2.1 — AC-4.1, AC-4.2
- [ ] **T2.4** หน้าเว็บ "จองรถ" (ฟอร์ม + ตารางรถรายวัน) และ "การจองของฉัน" (ยกเลิกได้) — depends: T2.2, T2.3 — AC-2.1, AC-3.2, AC-4.1

## 👤 งานของคน
- [ ] ทุก task: `npm run smoke` + `npm run trace` ผ่าน → อ่าน `git diff` → commit
- [ ] Release: `npx wrangler d1 migrations apply app-db --remote` → `npx wrangler deploy` → smoke กับ production
- [ ] ตรวจ NFR-01/02 ด้วยการสาธิตบนมือถือ · NFR-03/05/06 ด้วยการตรวจ (inspection)
- [ ] ตรวจรับกับ "ผู้ใช้" เทียบกับโจทย์ต้นฉบับ
