# MangaFlow — Project Documentation

> **Version:** 1.0 | **Last updated:** Day 1 Phase 2 | **Status:** 🟡 In Progress

---

## 1. Project Goal

Web app cho phép user cào manga từ các trang truyện về cloud storage, đọc online mượt mà không bị vỡ ảnh, không load lại trang.

**Core constraints:**
- Mỗi user tối đa **12 truyện** đồng thời
- Muốn thêm mới phải xóa truyện cũ (quota system)
- Ảnh lưu trên cloud, phục vụ qua CDN

**4 chức năng chính:** Scrape · Read · Download · Delete

---

## 2. System Architecture

### Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | ReactJS + Vite + shadcn/ui + Tailwind | UI, 4 màn hình chính |
| Backend | NestJS (Node.js) | REST API, business logic, Auth guard |
| Task Queue | BullMQ + Redis | Xử lý job cào ngầm, tránh block server |
| Crawler | Playwright (Chromium headless) | Giả lập browser, bypass anti-scrape |
| Auth | Firebase Authentication | Google + Email/Password login |
| Database | Firestore (Firebase) | Metadata truyện, quota user |
| Storage | Firebase Storage | Lưu ảnh manga sau khi cào (CDN) |
| Cache | Redis | Job status, read progress |

### Flow tổng quát

```
User nhập URL
  → Frontend gọi POST /api/manga         (tạo record)
  → Backend enqueue BullMQ job
  → Worker pick up job
  → Playwright crawl trang truyện
  → Download ảnh → upload Firebase Storage
  → Cập nhật Firestore metadata
  → Frontend polling status → hiển thị kết quả
```

### Monorepo Structure

```
mangacloud/
├── apps/
│   ├── backend/          # NestJS
│   │   └── src/
│   │       ├── firebase/     # Admin SDK init
│   │       ├── auth/         # Guard + Decorator
│   │       ├── manga/        # CRUD + quota logic
│   │       └── scraper/      # BullMQ processor + Playwright
│   └── frontend/         # React + Vite
│       └── src/
│           ├── pages/        # Home, Library, Reader, Download
│           ├── components/   # shadcn/ui components
│           └── lib/          # Firebase client, API hooks
├── packages/
│   └── shared/           # Shared TypeScript types
├── docker-compose.yml    # Redis local
└── pnpm-workspace.yaml
```

---

## 3. Database Schema (Firestore)

### Collection: `mangas`

```ts
{
  id: string               // auto Firestore ID
  userId: string           // Firebase Auth UID
  title: string
  sourceUrl: string        // URL trang truyện gốc
  coverUrl: string         // Firebase Storage URL
  status: 'pending' | 'scraping' | 'done' | 'error'
  totalChapters: number
  deleted: boolean         // soft delete để giải phóng quota
  createdAt: string        // ISO timestamp
  deletedAt?: string
}
```

### Collection: `chapters`

```ts
{
  id: string
  mangaId: string          // ref → mangas.id
  chapterNumber: number
  title: string
  imageUrls: string[]      // Firebase Storage URLs
  scrapedAt: string
}
```

### Collection: `users`

```ts
{
  id: string               // = Firebase Auth UID
  email: string
  quotaUsed: number        // cache, tính từ mangas collection
  createdAt: string
}
```

### Quota Logic

```
quota.used    = COUNT(mangas WHERE userId = uid AND deleted = false)
quota.limit   = 12
quota.remaining = limit - used
→ Nếu remaining = 0 → throw 400 BadRequest
```

### Firebase Security Rules

- **Backend (Admin SDK):** bypass hoàn toàn rules
- **Frontend (Client SDK):** chỉ READ, mọi WRITE qua Backend API
- Firestore rules: user chỉ read/write data của chính `uid` mình
- Storage rules: read nếu auth, write = false (chỉ backend)

---

## 4. API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/manga` | ✅ | Danh sách manga của user |
| GET | `/api/manga/quota` | ✅ | Quota hiện tại |
| GET | `/api/manga/:id` | ✅ | Chi tiết manga + chapters |
| POST | `/api/manga` | ✅ | Tạo manga mới |
| DELETE | `/api/manga/:id` | ✅ | Xóa mềm manga |
| POST | `/api/scrape/:id` | ✅ | Enqueue scrape job |
| GET | `/api/scrape/:jobId/status` | ✅ | Polling job status |

**Auth header:** `Authorization: Bearer <Firebase ID Token>`

---

## 5. Shared Types (`packages/shared`)

```ts
interface Manga {
  id: string; title: string; coverUrl: string
  sourceUrl: string; totalChapters: number
  status: 'pending' | 'scraping' | 'done' | 'error'
  createdAt: string; userId: string
}

interface Chapter {
  id: string; mangaId: string; chapterNumber: number
  title: string; imageUrls: string[]; scrapedAt: string
}

interface UserQuota { used: number; limit: number; remaining: number }

interface ScrapeJob {
  jobId: string; mangaId: string
  status: 'waiting' | 'active' | 'completed' | 'failed'
  progress: number; error?: string
}
```

---

## 6. Progress Tracker

### ✅ Done

- [x] Monorepo setup (pnpm workspaces)
- [x] NestJS backend scaffold
- [x] React + Vite + Tailwind + shadcn/ui (preset: Nova)
- [x] Docker Compose cho Redis local
- [x] Playwright Chromium installed
- [x] `packages/shared` — shared types
- [x] Firebase project tạo xong (Auth + Firestore + Storage)
- [x] Firestore & Storage Security Rules configured
- [x] `FirebaseModule` — Admin SDK init (`@Global`)
- [x] `AuthGuard` — verify Firebase ID Token
- [x] `AuthDecorator` — `@CurrentUser()`
- [x] `MangaService` — CRUD + quota check logic
- [x] `MangaController` — 5 REST endpoints
- [x] `AppModule` wired up

### 🔄 In Progress

- [ ] Test backend start + 401 response verify (Thunder Client)

### 📋 Up Next

**Phase 3 — BullMQ + Scraper (Day 1 tối)**
- [ ] `ScraperModule` setup với BullMQ
- [ ] `ScraperProcessor` — Playwright crawl logic
- [ ] Upload ảnh lên Firebase Storage
- [ ] Cập nhật Firestore status real-time

**Phase 4 — Frontend (Day 2)**
- [ ] Firebase Auth UI (Login page)
- [ ] Library page (danh sách manga + quota bar)
- [ ] Scrape dialog + polling progress
- [ ] Reader page (infinite scroll, lazy load ảnh)
- [ ] Download chapter (ZIP export)

---

## 7. Environment Variables

### Backend (`apps/backend/.env`)

```env
PORT=3000
FIREBASE_PROJECT_ID=your-project-id
REDIS_HOST=localhost
REDIS_PORT=6379
FRONTEND_URL=http://localhost:5173
```

### Frontend (`apps/frontend/.env`)

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=http://localhost:3000/api
```

---

## 8. Key Technical Decisions

| Decision | Lý do |
|---|---|
| BullMQ thay vì xử lý trực tiếp | Cào truyện mất 30s–5 phút, không thể block HTTP request |
| Playwright thay vì axios/cheerio | Nhiều trang truyện dùng JS render, cần headless browser |
| Soft delete thay vì hard delete | Giữ lại metadata để tránh re-scrape, dễ restore |
| Firebase Admin SDK ở backend | Bypass security rules, full quyền, không lộ credentials |
| pnpm workspaces monorepo | Share types giữa FE/BE, quản lý dependencies tập trung |
