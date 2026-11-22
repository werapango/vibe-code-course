# DESIGN — การออกแบบระบบ: ระบบจองรถส่วนกลาง (ฉบับอ้างอิง / baseline)

> ตอบคำถาม "จะสร้างอย่างไร" จาก `docs/SRS.md` · การตัดสินใจสำคัญบันทึกเป็น ADR พร้อมทางเลือกที่ไม่เลือก

## 1. บริบทและข้อจำกัด
- **ระบบนี้ต้องรองรับ:** พนักงานหลักสิบถึงหลักร้อยคน รถ 5–20 คัน ใช้จากมือถือเป็นหลัก (B1, B3, Q8)
- **ข้อจำกัด:** ไม่มีงบ ใช้บริการฟรีที่ไม่ผูกบัตร (B7) · ต้องขึ้นใช้งานได้ภายใน 1 วัน · มีระบบผู้ใช้จาก starter แล้ว

## 2. สถาปัตยกรรม
```
[พนักงาน / งานยานพาหนะ — เบราว์เซอร์บนมือถือ]
      │  HTTPS  (cookie session)
      ▼
[Cloudflare Worker: my-app]
  ├─ Static Assets  public/   index.html · app.js (starter) · booking.js (หน้าจองรถ)
  └─ Hono API       src/      /api/auth · /api/users (starter) · /api/cars · /api/bookings
      │  prepared statements
      ▼
[Cloudflare D1: app-db]       users · sessions · cars · bookings
```
- **มีอยู่แล้ว (starter):** ผู้ใช้ เข้าสู่ระบบ จัดการผู้ใช้ middleware `requireAuth` / `requireAdmin`
- **เพิ่มใน Release 1:** ตาราง cars, bookings · route `cars.ts`, `bookings.ts` · `lib/time.ts` · หน้า "จองรถ / การจองของฉัน / รถ"

## 3. การตัดสินใจทางสถาปัตยกรรม (ADR)
### ADR-01 ที่ deploy และ tech stack
- **บริบท:** ไม่มีงบ ต้องไม่ผูกบัตร ต้อง deploy ได้เร็ว ผู้ดูแลไม่มีเวลาดูแลเซิร์ฟเวอร์
- **ตัวเลือก:** (1) Cloudflare Workers + D1 (2) VPS + Node + MySQL (3) Google Sheets + Apps Script
- **ตัดสินใจ:** (1) Cloudflare Workers + Hono + D1
- **เหตุผล:** free plan ไม่ผูกบัตร · ไม่มีเซิร์ฟเวอร์ให้ดูแล · deploy ด้วยคำสั่งเดียว · มี local กับ production ที่ทำงานเหมือนกัน
- **ผลที่ตามมา:** ผูกกับแพลตฟอร์ม Cloudflare · D1 เป็น SQLite ทำงานกับข้อมูลระดับนี้ได้สบาย แต่ไม่เหมาะกับงานเขียนพร้อมกันปริมาณสูงมาก

### ADR-02 กติกาเวลาซ้อนตรวจที่เซิร์ฟเวอร์ ด้วย SQL
- **บริบท:** FR-04 คือกติกาที่สำคัญที่สุดและผิดได้เงียบที่สุด
- **ตัวเลือก:** (1) ตรวจในหน้าเว็บ (2) ตรวจที่ API ด้วย query `start_at < :end AND end_at > :start` (3) ใช้ constraint ของฐานข้อมูล
- **ตัดสินใจ:** (2) ตรวจที่ API ทุกครั้งก่อนบันทึก
- **เหตุผล:** หน้าเว็บถูกข้ามได้ (เรียก API ตรง) · SQLite ไม่มี exclusion constraint แบบช่วงเวลา · query เดียวอ่านง่ายและทดสอบด้วยตารางตัวอย่างได้ครบ
- **ผลที่ตามมา:** ถ้ามี 2 คำขอพร้อมกันในเสี้ยววินาทีเดียวกันอาจหลุดได้ (race condition) — ยอมรับได้สำหรับปริมาณการใช้ระดับนี้ บันทึกไว้เป็นความเสี่ยง R2

### ADR-03 เก็บเวลาเป็นข้อความเวลาไทย
- **บริบท:** เวลาเพี้ยน 7 ชั่วโมงเป็นบั๊กที่พบบ่อยที่สุดของระบบจอง (Q11)
- **ตัวเลือก:** (1) เก็บ UTC แปลงตอนแสดง (2) เก็บข้อความเวลาไทย `YYYY-MM-DDTHH:MM`
- **ตัดสินใจ:** (2)
- **เหตุผล:** ผู้ใช้ทั้งหมดอยู่ในประเทศไทยที่ไม่มี daylight saving · ข้อความรูปแบบนี้เรียงและเทียบด้วย `<` `>` ได้ตรง · ตรงกับค่าจาก `<input type="datetime-local">`
- **ผลที่ตามมา:** ต้องคำนวณ "เวลาปัจจุบันของไทย" เอง (`nowThai()`) เพราะ Worker ทำงานด้วย UTC

## 4. ข้อมูล (Data Model)
### 4.1 Entity และความสัมพันธ์
```
users 1 ──── * bookings * ──── 1 cars
users 1 ──── * sessions
```
### 4.2 ตาราง
| ตาราง | คอลัมน์ (ชนิด) | constraint | มาจาก |
|---|---|---|---|
| cars | id, plate TEXT, name TEXT, seats INTEGER, created_at | plate UNIQUE · seats > 0 | FR-01 |
| bookings | id, car_id, user_id, start_at TEXT, end_at TEXT, destination TEXT, passengers INTEGER, purpose TEXT, created_at | FK cars (CASCADE) · FK users (CASCADE) · start_at < end_at · passengers > 0 · index (car_id, start_at, end_at) | FR-03 – FR-06 |
| users, sessions | (จาก starter) | | FR-10 |

## 5. API
| Method | Path | use case | สิทธิ์ |
|---|---|---|---|
| GET | /api/cars | UC-02 | ล็อกอิน |
| POST / PUT / DELETE | /api/cars[/:id] | UC-01 | admin |
| GET | /api/cars/:id/schedule?date= | UC-04 | ล็อกอิน |
| GET / POST | /api/bookings | UC-02, UC-03 | ล็อกอิน |
| DELETE | /api/bookings/:id | UC-03 | เจ้าของการจอง |

## 6. NFR → การออกแบบ
| NFR | แก้ด้วยอะไร |
|---|---|
| NFR-01 มือถือ 375px | layout ยืดหยุ่น (flex-wrap) · ตารางซ่อนคอลัมน์รองบนจอเล็ก |
| NFR-02 จองใน 1 นาที | หน้าจองหน้าเดียว: เลือกรถ → เห็นตารางวันนั้นทันที → กรอก → จอง |
| NFR-03 รหัสผ่าน | PBKDF2 + salt จาก starter |
| NFR-04 เห็น/ยกเลิกของคนอื่นไม่ได้ | ทุก query ของ bookings กรอง `user_id = ?` จาก session · ตาราง schedule ไม่ส่งข้อมูลผู้จอง |
| NFR-05 ฟรี | Workers + D1 free plan (ADR-01) |
| NFR-06 เวลาไทย | ADR-03 · `lib/time.ts` |

## 7. Environment และการ deploy
| environment | ใช้ทำอะไร | ฐานข้อมูล | คำสั่ง |
|---|---|---|---|
| local | พัฒนา/ทดสอบ | D1 จำลองใน `.wrangler/` | `npm run dev` · `npx wrangler d1 migrations apply app-db --local` |
| production | ผู้ใช้จริง | D1 บนคลาวด์ | `npx wrangler d1 migrations apply app-db --remote` → `npx wrangler deploy` |

ลำดับ release: smoke + trace ผ่านใน local → migration remote → deploy → smoke กับ production → ถ้าพัง `npx wrangler rollback`

## 8. ความเสี่ยง
| รหัส | ความเสี่ยง | ผลกระทบ | วิธีรับมือ |
|---|---|---|---|
| R1 | ลืม +7 ชั่วโมงตอนเทียบเวลาปัจจุบัน | กติกาห้ามจองย้อนหลังเพี้ยน | `nowThai()` จุดเดียว + AC-2.5 |
| R2 | 2 คนจองช่วงเดียวกันพร้อมกันเป๊ะ | อาจได้การจองซ้อน 1 คู่ | ยอมรับใน Release 1 · ถ้าเกิดจริงค่อยใช้ transaction/คิว |
| R3 | ลบรถแล้วการจองหายตาม | ข้อมูลการจองในอดีตหาย | เจ้าของโจทย์ยอมรับ (Q9) · FR-15 สถานะรถซ่อมจะลดการลบ |
