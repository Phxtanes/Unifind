# 📊 UniFind — System Diagrams

ไฟล์รวม Diagram ทั้งหมดของระบบ UniFind (Lost & Found System) สำหรับมหาวิทยาลัยหอการค้าไทย (UTCC)

---

## 1. Activity Diagrams

### Flow 1: รับของที่มีคนนำมาส่ง (Receive Found Item)

```mermaid
flowchart TD
    Start([🟢 เริ่มต้น]) --> A[ผู้นำส่งนำสิ่งของมาที่เคาน์เตอร์]
    A --> B[เจ้าหน้าที่รับสิ่งของและซักถามข้อมูล]
    B --> C{ผู้นำส่งให้ข้อมูลครบหรือไม่?}
    C -- ไม่ครบ --> D[ขอข้อมูลเพิ่มเติมจากผู้นำส่ง]
    D --> C
    C -- ครบ --> E[บันทึกข้อมูลผู้นำส่ง\nลงในระบบ Person]
    E --> F[กรอกรายละเอียดสิ่งของ\nชื่อ / หมวดหมู่ / สถานที่พบ / วันที่พบ]
    F --> G[ถ่ายรูปสิ่งของ\nและอัปโหลดรูป]
    G --> H[บันทึกสิ่งของลงตาราง FoundItem\nสถานะ = RECEIVED]
    H --> I{มีตู้ล็อคเกอร์ว่างหรือไม่?}
    I -- มี --> J[จัดสรร Locker ให้สิ่งของ\nอัปเดต locker_id ใน FoundItem]
    I -- ไม่มี --> K[วางสิ่งของในพื้นที่จัดเก็บชั่วคราว]
    J --> L[อัปเดตสถานะ FoundItem\nเป็น STORED]
    K --> L
    L --> M[ระบบรัน Matching Service\nค้นหา LostItem ที่ตรงกัน]
    M --> N{พบการจับคู่หรือไม่?}
    N -- พบ --> O[บันทึก Match Record\nแจ้งเตือนเจ้าหน้าที่]
    N -- ไม่พบ --> P[สิ่งของรอการค้นหา\nสถานะยังคงเป็น STORED]
    O --> End([🔴 สิ้นสุด])
    P --> End
```

---

### Flow 2: แจ้งของหาย (Report Lost Item)

```mermaid
flowchart TD
    Start([🟢 เริ่มต้น]) --> A[ผู้ใช้ / เจ้าของของหายมาติดต่อ]
    A --> B[เจ้าหน้าที่ตรวจสอบข้อมูลผู้แจ้ง\nในระบบ Person]
    B --> C{พบข้อมูลผู้แจ้งในระบบหรือไม่?}
    C -- ไม่พบ --> D[ลงทะเบียนข้อมูลผู้แจ้งใหม่\nบันทึกลงตาราง Person]
    C -- พบ --> E[ใช้ข้อมูลเดิมจากระบบ]
    D --> F[กรอกรายละเอียดของที่หาย\nชื่อ / หมวดหมู่ / สถานที่หาย / วันที่ประมาณ]
    E --> F
    F --> G[แนบรูปภาพของที่หาย\nหากมี]
    G --> H[บันทึกลงตาราง LostItem\nสถานะ = PENDING]
    H --> I[ระบบรัน Matching Service\nเปรียบเทียบกับ FoundItem ทั้งหมด]
    I --> J{พบสิ่งของที่ตรงกันหรือไม่?}
    J -- พบ --> K[สร้าง Match Record\nสถานะ = PENDING\nบันทึกลงตาราง Match]
    J -- ไม่พบ --> L[แจ้งผู้ใช้ว่ายังไม่พบของ\nระบบจะแจ้งเตือนเมื่อพบ]
    K --> M[แสดงผลการจับคู่ให้เจ้าหน้าที่ตรวจสอบ]
    M --> N{เจ้าหน้าที่ยืนยันการจับคู่?}
    N -- ยืนยัน --> O[อัปเดต Match สถานะ = CONFIRMED\nอัปเดต FoundItem สถานะ = MATCHED]
    N -- ปฏิเสธ --> P[อัปเดต Match สถานะ = REJECTED\nระบบค้นหาคู่จับใหม่]
    O --> Q[แจ้งผู้แจ้งของหายให้มารับคืน]
    P --> L
    L --> End([🔴 สิ้นสุด])
    Q --> End
```

---

### Flow 3: รับคืนสิ่งของ (Claim / Return Item)

```mermaid
flowchart TD
    Start([🟢 เริ่มต้น]) --> A[ผู้อ้างสิทธิ์มาติดต่อรับสิ่งของคืน]
    A --> B[เจ้าหน้าที่ค้นหาข้อมูลผู้อ้างสิทธิ์\nในระบบ Person]
    B --> C{ระบุตัวตนผู้รับคืนได้หรือไม่?}
    C -- ไม่ได้ --> D[ปฏิเสธการรับคืน\nแจ้งให้นำหลักฐานมาเพิ่มเติม]
    D --> End([🔴 สิ้นสุด])
    C -- ได้ --> E[เจ้าหน้าที่นำสิ่งของออกจาก Locker\nหรือพื้นที่จัดเก็บ]
    E --> F[ตรวจสอบสิ่งของร่วมกับผู้รับคืน]
    F --> G{ผู้รับคืนยืนยันว่าเป็นของตนเอง?}
    G -- ไม่ใช่ --> H[บันทึกเหตุการณ์\nส่งสิ่งของกลับไปจัดเก็บ]
    H --> End
    G -- ใช่ --> I[บันทึกข้อมูลการรับคืน\nลงตาราง Claim\nclaimer_id / claim_date / remark]
    I --> J[อัปเดตสถานะ FoundItem\nเป็น RETURNED]
    J --> K[อัปเดตสถานะ Locker\nเป็น AVAILABLE]
    K --> L[อัปเดตสถานะ LostItem\nเป็น RESOLVED]
    L --> M[พิมพ์ใบรับมอบสิ่งของ\nหรือบันทึกหลักฐานการรับ]
    M --> End([🔴 สิ้นสุด])
```

---

## 2. ER Diagram (Entity Relationship Diagram)

```mermaid
erDiagram
    Person {
        int id PK
        string name
        string student_id
        string university_email
        string phone
        enum person_type "STUDENT | STAFF | EXTERNAL"
    }

    Category {
        int id PK
        string name
    }

    Locker {
        int id PK
        string locker_code
        string location
        enum status "AVAILABLE | IN_USE | MAINTENANCE"
    }

    FoundItem {
        int id PK
        string item_name
        int category_id FK
        string found_location
        date found_date
        text description
        string image_url
        int locker_id FK
        enum status "RECEIVED | STORED | MATCHED | CLAIMED | RETURNED"
        int finder_id FK
        timestamp created_at
    }

    LostItem {
        int id PK
        string item_name
        int category_id FK
        string lost_location
        date estimated_lost_date
        text description
        string image_url
        int owner_id FK
        enum status "PENDING | MATCHED | RESOLVED | CLOSED"
        timestamp created_at
    }

    Match {
        int id PK
        int found_item_id FK
        int lost_item_id FK
        float match_score
        enum status "PENDING | CONFIRMED | REJECTED"
        timestamp matched_at
    }

    Claim {
        int id PK
        int found_item_id FK
        int claimer_id FK
        date claim_date
        text remark
    }

    %% Relationships
    Person ||--o{ FoundItem : "finder (นำส่ง)"
    Person ||--o{ LostItem : "owner (เจ้าของ)"
    Person ||--o{ Claim : "claimer (รับคืน)"

    Category ||--o{ FoundItem : "จัดหมวดหมู่"
    Category ||--o{ LostItem : "จัดหมวดหมู่"

    Locker ||--o| FoundItem : "จัดเก็บสิ่งของ"

    FoundItem ||--o{ Match : "จับคู่จาก"
    LostItem ||--o{ Match : "จับคู่กับ"

    FoundItem ||--o{ Claim : "ถูกเคลม"
```

---

## 3. Sequence Diagram: การแจ้งของหาย (Report Lost Item)

```mermaid
sequenceDiagram
    actor User as 👤 ผู้แจ้งของหาย
    participant FE as 🖥️ Frontend (Nuxt 3)
    participant BE as ⚙️ Backend (Express API)
    participant DB as 🗄️ Database (Supabase)
    participant MS as 🤖 Matching Service (Gemini AI)

    User->>FE: กรอกแบบฟอร์มแจ้งของหาย\n(ชื่อของ, หมวดหมู่, สถานที่, วันที่)
    FE->>FE: Validate ข้อมูลฝั่ง Client

    alt ข้อมูลไม่ครบ
        FE-->>User: แสดง Error ให้กรอกข้อมูลให้ครบ
    else ข้อมูลครบ
        FE->>BE: POST /api/lost-items\n{ item_name, category_id, lost_location, ... }
        BE->>BE: ตรวจสอบ JWT Token\n(Middleware Authentication)

        alt Token ไม่ถูกต้อง
            BE-->>FE: 401 Unauthorized
            FE-->>User: แจ้งให้ Login ใหม่
        else Token ถูกต้อง
            BE->>DB: INSERT INTO LostItem\nสถานะ = PENDING
            DB-->>BE: LostItem ID ที่สร้างใหม่

            BE->>MS: ส่ง LostItem ข้อมูลเพื่อค้นหาคู่จับ\n(item_name, category, description)
            MS->>DB: SELECT FoundItem WHERE status = STORED
            DB-->>MS: รายการ FoundItem ทั้งหมด
            MS->>MS: คำนวณ match_score\nเปรียบเทียบด้วย AI / Keyword

            alt พบการจับคู่ที่ score สูง
                MS->>DB: INSERT INTO Match\n(found_item_id, lost_item_id, match_score, PENDING)
                DB-->>MS: Match ID
                MS-->>BE: ส่งผล Match กลับ
                BE-->>FE: 201 Created + ผล Match
                FE-->>User: ✅ แจ้งของหายสำเร็จ\n"พบสิ่งของที่อาจตรงกัน กรุณารอการยืนยัน"
            else ไม่พบการจับคู่
                MS-->>BE: ไม่พบคู่จับ
                BE-->>FE: 201 Created + ไม่มี Match
                FE-->>User: ✅ แจ้งของหายสำเร็จ\n"ระบบจะแจ้งเตือนเมื่อพบสิ่งของ"
            end
        end
    end
```

---

## 4. State Diagram: สถานะของ "ของที่พบ" (FoundItem Status)

```mermaid
stateDiagram-v2
    [*] --> RECEIVED : เจ้าหน้าที่รับสิ่งของ\nจากผู้นำส่ง

    RECEIVED --> STORED : จัดสรร Locker\nและจัดเก็บสิ่งของ

    STORED --> MATCHED : ระบบ Matching\nพบเจ้าของที่ตรงกัน\n(Match CONFIRMED)

    MATCHED --> CLAIMED : เจ้าของมายืนยัน\nและรับคืนสิ่งของ\n(Claim บันทึกแล้ว)

    CLAIMED --> RETURNED : เจ้าหน้าที่ส่งมอบ\nสิ่งของคืนเรียบร้อย

    RETURNED --> [*]

    %% กรณีพิเศษ
    STORED --> RETURNED : กรณีเจ้าของมาพิสูจน์\nสิทธิ์โดยตรงโดยไม่ผ่าน Match

    MATCHED --> STORED : Match ถูก REJECTED\nกลับสู่การรอจับคู่ใหม่

    note right of RECEIVED
        สถานะเริ่มต้น
        เมื่อรับสิ่งของเข้าระบบ
    end note

    note right of STORED
        สิ่งของอยู่ใน Locker
        รอการค้นหาเจ้าของ
    end note

    note right of MATCHED
        พบเจ้าของที่เป็นไปได้
        รอการยืนยันตัวตน
    end note

    note right of RETURNED
        ปิดเคส สำเร็จ
        Locker ว่างพร้อมใช้งาน
    end note
```

---

## 5. System Architecture Diagram

```mermaid
graph TB
    subgraph CLIENT["🖥️ Client Layer"]
        direction LR
        Browser["Web Browser\n(Staff Portal)"]
    end

    subgraph FRONTEND["🎨 Frontend Service (Port 3000)"]
        direction TB
        Nuxt["Nuxt 3 / Vue 3\n(Composition API)"]
        Pinia["Pinia\n(State Management)"]
        Tailwind["TailwindCSS\n(UI Styling)"]
        Axios["Axios\n(HTTP Client)"]
        Nuxt --- Pinia
        Nuxt --- Tailwind
        Nuxt --- Axios
    end

    subgraph BACKEND["⚙️ Backend Service (Port 5000)"]
        direction TB
        Express["Express.js\n(REST API Server)"]
        JWT["JWT Middleware\n(Authentication)"]
        Multer["Multer\n(File Upload)"]
        WSServer["WebSocket Server\n(Real-time)"]
        Express --- JWT
        Express --- Multer
        Express --- WSServer
    end

    subgraph AI["🤖 AI / Matching Service"]
        Gemini["Google Gemini AI\n(@google/genai)\nItem Matching & Description"]
    end

    subgraph DATABASE["🗄️ Database Layer (Supabase)"]
        direction TB
        Supabase["Supabase\n(PostgreSQL)"]
        subgraph TABLES["Tables"]
            T1["FoundItem"]
            T2["LostItem"]
            T3["Person"]
            T4["Category"]
            T5["Locker"]
            T6["Match"]
            T7["Claim"]
        end
        Supabase --- TABLES
    end

    subgraph STORAGE["📁 File Storage"]
        Uploads["Local /uploads/\n(Docker Volume)\nรูปภาพสิ่งของ"]
    end

    subgraph INFRA["🐳 Infrastructure (Docker Compose)"]
        DC["docker-compose.yml"]
    end

    %% Connections
    Browser <-->|"HTTP / HTTPS"| FRONTEND
    FRONTEND <-->|"REST API Calls\n(Axios)"| BACKEND
    BACKEND <-->|"supabase-js\nClient"| DATABASE
    BACKEND <-->|"AI API\nHTTPS"| AI
    BACKEND <-->|"multer\nFile I/O"| STORAGE
    FRONTEND <-->|"WebSocket\nwss://"| WSServer

    INFRA -.->|"Orchestrates"| FRONTEND
    INFRA -.->|"Orchestrates"| BACKEND

    style CLIENT fill:#1e293b,color:#f8fafc,stroke:#334155
    style FRONTEND fill:#0f172a,color:#f8fafc,stroke:#3b82f6
    style BACKEND fill:#0f172a,color:#f8fafc,stroke:#10b981
    style AI fill:#0f172a,color:#f8fafc,stroke:#a855f7
    style DATABASE fill:#0f172a,color:#f8fafc,stroke:#f59e0b
    style STORAGE fill:#0f172a,color:#f8fafc,stroke:#ef4444
    style INFRA fill:#0f172a,color:#f8fafc,stroke:#6b7280
```

---

## 📌 สรุป Status ทั้งหมดในระบบ

| Entity | Status ที่เป็นไปได้ |
|---|---|
| **FoundItem** | `RECEIVED` → `STORED` → `MATCHED` → `CLAIMED` → `RETURNED` |
| **LostItem** | `PENDING` → `MATCHED` → `RESOLVED` / `CLOSED` |
| **Match** | `PENDING` → `CONFIRMED` / `REJECTED` |
| **Locker** | `AVAILABLE` → `IN_USE` → `AVAILABLE` |

---

*เอกสารนี้สร้างโดย AI Assistant สำหรับโปรเจกต์ UniFind — UTCC*
