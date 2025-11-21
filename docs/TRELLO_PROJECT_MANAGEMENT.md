# Trello Project Management - Sạp Phim

> **Dự án**: Sạp Phim - Nền tảng streaming phim + mạng xã hội  
> **Phương pháp**: Agile Scrum với Kanban Board  
> **Cập nhật**: 15/11/2025  
> **Team**: 4 thành viên (1 Product Owner, 1 Scrum Master, 2 Developers)

---

## 📋 Mục lục

1. [Tổng quan Trello Board](#tổng-quan-trello-board)
2. [Cấu trúc Board chi tiết](#cấu-trúc-board-chi-tiết)
3. [Labels và Priority](#labels-và-priority)
4. [Card Template](#card-template)
5. [Workflow Process](#workflow-process)
6. [Sprint Planning](#sprint-planning)
7. [Daily Standup Checklist](#daily-standup-checklist)
8. [Best Practices](#best-practices)

---

## 🎯 Tổng quan Trello Board

### Board Hierarchy

```
Workspace: Sạp Phim Development
├── Board 1: Product Backlog (Tổng quan dự án)
├── Board 2: Sprint Planning (Sprint hiện tại)
├── Board 3: Frontend Development
├── Board 4: Backend Development
├── Board 5: Database & Infrastructure
└── Board 6: Testing & QA
```

### Team Roles & Permissions

| Vai trò | Quyền hạn | Trách nhiệm |
|---------|-----------|-------------|
| **Product Owner** | Admin | Quản lý backlog, prioritize features, review |
| **Scrum Master** | Admin | Tổ chức sprint, daily standup, remove blockers |
| **Frontend Developer** | Member | Develop UI/UX, components, pages |
| **Backend Developer** | Member | Develop API, database, services |
| **QA Tester** | Observer | Test features, report bugs |

---

## 📊 Cấu trúc Board chi tiết

### Board 1: Product Backlog

**Mục đích**: Quản lý tất cả yêu cầu tính năng và roadmap dự án

#### Lists Structure:

```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 Product Vision & Goals                                      │
├─────────────────────────────────────────────────────────────────┤
│  📝 Feature Requests (Unsorted)                                 │
├─────────────────────────────────────────────────────────────────┤
│  🔍 Under Review                                                │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Approved Backlog                                            │
├─────────────────────────────────────────────────────────────────┤
│  📅 Next Sprint Candidates                                      │
├─────────────────────────────────────────────────────────────────┤
│  🚀 Current Sprint (In Progress)                                │
├─────────────────────────────────────────────────────────────────┤
│  ✔️ Completed Features                                          │
├─────────────────────────────────────────────────────────────────┤
│  ❌ Rejected / Postponed                                        │
└─────────────────────────────────────────────────────────────────┘
```

#### Sample Cards:

**🎯 Product Vision & Goals**
- Card: "Tầm nhìn dự án 2025-2026"
  - Mô tả: Trở thành nền tảng streaming #1 Việt Nam
  - Checklist: OKRs Q1, Q2, Q3, Q4
  - Due date: 31/12/2025

**📝 Feature Requests**
- Card: "Hệ thống Reels (Short Videos)"
  - Priority: High
  - Story Points: 13
  - Labels: Frontend, Backend, New Feature

**✅ Approved Backlog**
- Card: "Admin Dashboard - Quản lý phim"
- Card: "Real-time Comment System"
- Card: "Friend System với Privacy Settings"
- Card: "Video Player với Multiple Quality"

---

### Board 2: Sprint Planning

**Mục đích**: Quản lý sprint hiện tại (2 tuần/sprint)

#### Lists Structure:

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 Sprint Backlog (14 Story Points)                            │
├─────────────────────────────────────────────────────────────────┤
│  🔜 To Do (Not Started)                                         │
├─────────────────────────────────────────────────────────────────┤
│  🏃 In Progress (WIP Limit: 3)                                  │
├─────────────────────────────────────────────────────────────────┤
│  👀 Code Review                                                 │
├─────────────────────────────────────────────────────────────────┤
│  🧪 Testing / QA                                                │
├─────────────────────────────────────────────────────────────────┤
│  🚧 Blocked (Need Help)                                         │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Done (Ready for Deploy)                                     │
├─────────────────────────────────────────────────────────────────┤
│  🚀 Deployed to Production                                      │
└─────────────────────────────────────────────────────────────────┘
```

#### Sprint Info Card Template:

```markdown
# Sprint 5: Authentication & Social Features
**Sprint Goal**: Hoàn thiện hệ thống đăng nhập và kết bạn

📅 **Timeline**: 01/11/2025 - 14/11/2025 (14 ngày)
👥 **Team**: 4 members
🎯 **Capacity**: 40 Story Points (10 SP/person)
📊 **Committed**: 36 Story Points

## Sprint Goals
- [ ] Social Login (Google, Facebook, GitHub)
- [ ] Friend System (Send, Accept, Reject)
- [ ] Privacy Settings
- [ ] Real-time Notifications

## Daily Standup Notes
- **01/11**: Sprint kickoff, task assignment
- **04/11**: Firebase integration complete
- **07/11**: Friend API endpoints done
- **10/11**: Frontend components 80% complete

## Burndown Chart
- Day 1: 36 SP remaining
- Day 5: 28 SP remaining
- Day 10: 15 SP remaining
- Day 14: 0 SP (Goal)

## Retrospective (14/11)
- ✅ What went well: Good collaboration, clear requirements
- ❌ What didn't: Redis caching issues, testing delays
- 💡 Action items: Add Redis to local setup, more unit tests
```

---

### Board 3: Frontend Development

#### Lists Structure:

```
┌─────────────────────────────────────────────────────────────────┐
│  📝 Backlog (Prioritized)                                       │
├─────────────────────────────────────────────────────────────────┤
│  🎨 Design Review                                               │
├─────────────────────────────────────────────────────────────────┤
│  💻 Development                                                 │
├─────────────────────────────────────────────────────────────────┤
│  🧩 Component Library                                           │
├─────────────────────────────────────────────────────────────────┤
│  🔌 API Integration                                             │
├─────────────────────────────────────────────────────────────────┤
│  🐛 Bug Fixes                                                   │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Testing (Unit + E2E)                                        │
├─────────────────────────────────────────────────────────────────┤
│  ✔️ Done                                                        │
└─────────────────────────────────────────────────────────────────┘
```

#### Sample Cards with Details:

**Card 1: Admin Movie Form Component**
```markdown
## 📋 Task Description
Tạo form đa bước để admin tạo/sửa phim với upload ảnh và metadata

## 📝 Acceptance Criteria
- [ ] Step 1: Basic Info (title, slug, description)
- [ ] Step 2: Media Upload (poster, backdrop images)
- [ ] Step 3: Metadata (genres, country, release date, cast)
- [ ] Form validation với Yup schema
- [ ] Progress indicator (1/3, 2/3, 3/3)
- [ ] Draft save functionality

## 🛠️ Technical Requirements
- React Context cho shared state
- Multer upload endpoint integration
- Sharp image preview
- Error handling với toast notifications

## 📦 Dependencies
- API: POST /api/movies (Backend Card #45)
- Design: Figma mockup approved
- Components: Button, Input, ImageUpload, Dropdown

## ⏰ Estimate: 5 Story Points
## 👤 Assigned: Frontend Dev 1
## 📅 Due Date: 10/11/2025
## 🏷️ Labels: Frontend, Admin Panel, High Priority

## 📎 Attachments
- Figma Design: [Link]
- API Spec: docs/API.md#movies

## 💬 Comments
- @frontend-dev: Started Step 1, form layout done
- @scrum-master: Looks good, remember to add loading states
```

**Card 2: Friend Request Notification**
```markdown
## 📋 Task Description
Hiển thị real-time notification khi nhận lời mời kết bạn

## 📝 Acceptance Criteria
- [ ] Socket.IO listener cho event `friend:request`
- [ ] Toast notification với avatar + tên người gửi
- [ ] Button "Accept" và "Reject" trong toast
- [ ] Update Redux state sau khi accept/reject
- [ ] Invalidate React Query cache

## 🛠️ Technical Stack
- Socket.IO Client
- Redux Toolkit (friendSlice)
- TanStack Query (invalidateQueries)
- React Hot Toast

## ⏰ Estimate: 3 Story Points
## 🏷️ Labels: Frontend, Real-time, Medium Priority
```

---

### Board 4: Backend Development

#### Lists Structure:

```
┌─────────────────────────────────────────────────────────────────┐
│  📝 API Backlog                                                 │
├─────────────────────────────────────────────────────────────────┤
│  🗄️ Database Schema Design                                      │
├─────────────────────────────────────────────────────────────────┤
│  ⚙️ Service Logic Development                                   │
├─────────────────────────────────────────────────────────────────┤
│  🔌 Route & Controller                                          │
├─────────────────────────────────────────────────────────────────┤
│  🔐 Authentication & Authorization                              │
├─────────────────────────────────────────────────────────────────┤
│  🧪 Unit Tests                                                  │
├─────────────────────────────────────────────────────────────────┤
│  🐛 Bug Fixes                                                   │
├─────────────────────────────────────────────────────────────────┤
│  ✔️ Done (Documented)                                           │
└─────────────────────────────────────────────────────────────────┘
```

#### Sample Cards:

**Card 1: Friend System API**
```markdown
## 📋 Task Description
Xây dựng API đầy đủ cho hệ thống kết bạn

## 📝 API Endpoints
- [ ] POST /api/friends/request - Gửi lời mời
- [ ] PUT /api/friends/:id/accept - Chấp nhận
- [ ] PUT /api/friends/:id/reject - Từ chối
- [ ] DELETE /api/friends/:id - Hủy kết bạn
- [ ] GET /api/friends - Lấy danh sách bạn bè
- [ ] GET /api/friends/requests - Lấy lời mời chờ
- [ ] GET /api/friends/suggestions - Gợi ý kết bạn

## 🗄️ Database
- Model: Friendship (senderId, receiverId, status, createdAt)
- Status enum: pending, accepted, rejected, blocked
- Indexes: [senderId, receiverId], status, createdAt

## 🔐 Middleware
- verifyToken (required)
- authorizeRoles (optional for admin features)
- friend.validation (express-validator)

## ⚡ Business Logic
- Check duplicate requests
- Prevent self-friending
- Bidirectional relationship (A friends B = B friends A)
- Redis cache invalidation
- Socket.IO emit to both users

## 🧪 Testing
- [ ] Unit tests: service layer (Jest)
- [ ] Integration tests: API endpoints (Supertest)
- [ ] Test cases: success, duplicate, self-friend, not found

## ⏰ Estimate: 8 Story Points
## 👤 Assigned: Backend Dev 1
## 🏷️ Labels: Backend, API, High Priority
```

**Card 2: Redis Caching Layer**
```markdown
## 📋 Task Description
Implement Redis caching cho các query thường xuyên

## 📝 Cache Keys
- `user:${userId}:friends` - Danh sách bạn bè (TTL: 300s)
- `user:${userId}:privacy_settings` - Cài đặt riêng tư (TTL: 600s)
- `search:users:${userId}:${query}` - Kết quả tìm kiếm (TTL: 180s)
- `movie:${movieId}:details` - Chi tiết phim (TTL: 900s)

## ⚙️ Implementation
- Redis client with fallback (app works without Redis)
- Helper functions: get, set, del, invalidate
- Pattern-based invalidation (e.g., `user:123:*`)

## 🔄 Invalidation Strategy
- After friend accept: invalidate both users' friend lists
- After privacy update: invalidate user privacy cache
- After movie update: invalidate movie detail cache

## ⏰ Estimate: 5 Story Points
## 🏷️ Labels: Backend, Performance, Medium Priority
```

---

### Board 5: Database & Infrastructure

#### Lists Structure:

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 Schema Design                                               │
├─────────────────────────────────────────────────────────────────┤
│  🔧 Migrations                                                  │
├─────────────────────────────────────────────────────────────────┤
│  🗃️ Seeders                                                     │
├─────────────────────────────────────────────────────────────────┤
│  🔍 Indexes & Optimization                                      │
├─────────────────────────────────────────────────────────────────┤
│  🚀 DevOps & Deployment                                         │
├─────────────────────────────────────────────────────────────────┤
│  📊 Monitoring & Logs                                           │
├─────────────────────────────────────────────────────────────────┤
│  ✔️ Done                                                        │
└─────────────────────────────────────────────────────────────────┘
```

#### Sample Cards:

**Card: ERD Design - Module 1 (User & Auth)**
```markdown
## 📋 Tables
- Users (20 columns với JSON fields)
- Roles (id, name, permissions)
- LoginHistory (user tracking)
- RefreshTokens (JWT rotation)

## 🔗 Relationships
- Users N:M Roles (via user_roles)
- Users 1:N LoginHistory
- Users 1:N RefreshTokens

## 📝 Constraints
- email UNIQUE
- uuid UNIQUE
- Foreign keys với ON DELETE CASCADE

## ⏰ Estimate: 3 Story Points
```

---

### Board 6: Testing & QA

#### Lists Structure:

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 Test Plan                                                   │
├─────────────────────────────────────────────────────────────────┤
│  🧪 Unit Tests (Jest)                                           │
├─────────────────────────────────────────────────────────────────┤
│  🔗 Integration Tests (Supertest)                               │
├─────────────────────────────────────────────────────────────────┤
│  🌐 E2E Tests (Cypress/Playwright)                              │
├─────────────────────────────────────────────────────────────────┤
│  🐛 Bug Reports                                                 │
├─────────────────────────────────────────────────────────────────┤
│  🔍 Under Investigation                                         │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Fixed & Verified                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏷️ Labels và Priority

### Priority Labels

```
🔴 Critical (P0)   - Blocker, must fix immediately
🟠 High (P1)       - Important, schedule ASAP
🟡 Medium (P2)     - Normal priority
🟢 Low (P3)        - Nice to have, backlog
```

### Type Labels

```
🎨 Frontend        - UI/UX, Components
⚙️ Backend         - API, Services, Database
🗄️ Database        - Schema, Migration, Seeding
🔐 Security        - Auth, Authorization, Encryption
🚀 DevOps          - CI/CD, Deployment, Monitoring
🐛 Bug             - Bug fix
✨ Feature         - New feature
📝 Documentation   - Docs update
🧪 Testing         - Test writing
♻️ Refactor        - Code refactoring
⚡ Performance     - Optimization
```

### Status Labels

```
⏸️ Blocked         - Waiting for dependency
👀 Review          - Needs code review
🚧 In Progress     - Currently working
✅ Ready           - Ready for deployment
```

---

## 📝 Card Template

### Standard Card Structure

```markdown
# [Component/Feature Name]

## 📋 Description
[Chi tiết mô tả task]

## 🎯 User Story
As a [role], I want [feature] so that [benefit]

## 📝 Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## 🛠️ Technical Details
- Tech stack: [React, Redux, etc.]
- API endpoints: [List]
- Dependencies: [Card links]

## 📦 Subtasks
- [ ] Subtask 1 (2 hours)
- [ ] Subtask 2 (3 hours)
- [ ] Subtask 3 (1 hour)

## ⏰ Estimate: [Story Points]
## 👤 Assigned: [Developer Name]
## 📅 Due Date: [DD/MM/YYYY]
## 🏷️ Labels: [Priority, Type]

## 📎 Attachments
- Design mockup
- API documentation
- Related tickets

## ✅ Definition of Done
- [ ] Code complete
- [ ] Unit tests written (80% coverage)
- [ ] Code reviewed and approved
- [ ] Merged to main branch
- [ ] Deployed to staging
- [ ] QA tested and approved
- [ ] Documentation updated

## 💬 Comments
[Team discussion, updates, questions]
```

---

## 🔄 Workflow Process

### 1. Sprint Planning (Thứ 2 đầu sprint)

```
1. Product Owner prioritize backlog
2. Team review top priority items
3. Story point estimation (Planning Poker)
4. Commit to sprint goal (14 story points/person)
5. Break down stories into tasks
6. Assign owners to cards
```

### 2. Daily Standup (Hằng ngày 9:00 AM)

```markdown
## Daily Standup Template (Comment trên Sprint Board)

**Date**: 05/11/2025

### 👤 [Developer Name]
- ✅ **Yesterday**: Completed Friend Request API endpoint
- 🏃 **Today**: Working on Accept/Reject logic
- 🚧 **Blockers**: Need Redis running locally for cache testing

### 👤 [Developer Name]
- ✅ **Yesterday**: Designed Friend List component
- 🏃 **Today**: Integrate API and add real-time updates
- 🚧 **Blockers**: None
```

### 3. Weekly Review (Thứ 6 cuối tuần)

```
1. Demo completed features (live demo)
2. Update burndown chart
3. Review blocked items
4. Adjust sprint if needed
```

### 4. Sprint Review & Retrospective (Thứ 6 cuối sprint)

```markdown
## Sprint Retrospective Template

### ✅ What went well?
- Good communication in daily standups
- All features deployed on time
- Zero production bugs

### ❌ What didn't go well?
- Unit test coverage only 60% (target: 80%)
- Redis setup confusion on local env
- Late design changes caused rework

### 💡 Action Items for Next Sprint
1. Add Redis Docker setup to README
2. Enforce 80% test coverage in CI/CD
3. Freeze design 1 week before sprint
4. Pair programming for complex features

### 📊 Sprint Metrics
- Planned: 36 Story Points
- Completed: 34 Story Points
- Velocity: 94%
- Bugs found: 3
- Bugs fixed: 3
```

---

## 🎯 Sprint Planning

### Sprint Timeline (2 weeks)

```
Week 1:
├── Mon: Sprint Planning (2 hours)
├── Tue-Fri: Development (Daily Standup 15 min)
└── Fri: Weekly Review (30 min)

Week 2:
├── Mon-Thu: Development (Daily Standup 15 min)
├── Thu: Code Freeze, Testing
└── Fri: Sprint Review (1 hour) + Retrospective (1 hour)
```

### Story Point Estimation

| Story Points | Complexity | Time Estimate |
|--------------|------------|---------------|
| 1 | Trivial | 1-2 hours |
| 2 | Easy | Half day |
| 3 | Medium | 1 day |
| 5 | Complex | 2-3 days |
| 8 | Very Complex | 1 week |
| 13 | Epic | 2+ weeks (break down!) |

### Capacity Planning

```
Team Capacity = Members × Days × Hours/Day × Focus Factor

Example:
- 4 members
- 10 working days (2 weeks)
- 6 productive hours/day
- 0.7 focus factor (meetings, breaks, etc.)

Total Capacity = 4 × 10 × 6 × 0.7 = 168 hours
Story Points = 168 hours / 4 hours per SP = 42 SP per sprint
```

---

## ✅ Daily Standup Checklist

### Scrum Master Preparation

```
- [ ] Check Trello board for updates
- [ ] Note blocked cards
- [ ] Prepare burndown chart update
- [ ] Set up meeting (Google Meet/Zoom)
- [ ] Timebox: 15 minutes strict
```

### Meeting Format

```
1. Quick board review (1 min)
2. Each member answers 3 questions (2 min/person)
   - What did you complete yesterday?
   - What will you do today?
   - Any blockers?
3. Identify blockers (5 min)
4. Parking lot (side conversations after meeting)
```

### Post-Meeting Actions

```
- [ ] Update card statuses
- [ ] Create blocker resolution cards
- [ ] Update burndown chart
- [ ] Schedule pair programming if needed
```

---

## 🎨 Best Practices

### 1. Card Writing

✅ **DO:**
- Write clear, actionable titles
- Include acceptance criteria
- Estimate story points
- Link related cards
- Add screenshots/mockups
- Update progress in comments
- Use checklists for subtasks

❌ **DON'T:**
- Vague descriptions ("Fix bug")
- No acceptance criteria
- No estimates
- Duplicate cards
- Ignore comments

### 2. Board Management

✅ **DO:**
- Review board daily
- Archive completed cards weekly
- Keep WIP limit (3 cards/person)
- Use labels consistently
- Update due dates
- Link to GitHub PRs

❌ **DON'T:**
- Let cards go stale
- Hoard too many cards
- Skip code reviews
- Forget to update status

### 3. Communication

✅ **DO:**
- Comment on card updates
- Tag relevant team members (@mention)
- Use emojis for quick status (✅ ❌ 🚧)
- Document decisions
- Share blockers immediately

❌ **DON'T:**
- Use Trello as chat (use Slack/Discord)
- Assume others know context
- Leave blockers unresolved

### 4. Sprint Hygiene

✅ **DO:**
- Start sprint with clear goals
- Break down large tasks (>8 SP)
- Review velocity each sprint
- Celebrate wins 🎉
- Learn from mistakes

❌ **DON'T:**
- Overcommit (set realistic goals)
- Add scope mid-sprint
- Skip retrospectives
- Blame individuals

---

## 📊 Trello Power-Ups (Recommended)

### Essential Power-Ups

1. **Calendar** - Visualize due dates
2. **Card Repeater** - Recurring tasks (Daily Standup)
3. **Burndown for Trello** - Sprint progress tracking
4. **GitHub** - Link PRs to cards
5. **Custom Fields** - Story Points, Priority, Severity
6. **Voting** - Team prioritization
7. **Butler** - Automation rules

### Automation Examples

```
Butler Rules:

1. When card moved to "Done" → Add green "Completed" label
2. When due date approaches (1 day) → Send notification
3. When card added to "Blocked" → Notify Scrum Master
4. Every Monday 9:00 AM → Create "Daily Standup" card
5. When PR linked → Move card to "Code Review"
```

---

## 🔗 Integration với Tools khác

### GitHub Integration

```
Commit message format:
feat(frontend): add friend request component [TRELLO-123]

PR description:
Closes TRELLO-123
- Implemented friend request UI
- Added Socket.IO listener
- Unit tests written (85% coverage)
```

### Slack Notifications

```
Trello → Slack webhooks:
- Card moved to "Blocked" → #dev-blockers
- Sprint created → #team-announcements
- Card overdue → #scrum-master
```

---

## 📚 Tài liệu Tham khảo

### Templates

- [Sprint Planning Template](https://trello.com/templates/sprint-planning)
- [Kanban Board Template](https://trello.com/templates/kanban)
- [Bug Tracking Template](https://trello.com/templates/bug-tracking)

### Scrum Resources

- [Scrum Guide](https://scrumguides.org/)
- [Story Point Estimation](https://www.mountaingoatsoftware.com/agile/planning-poker)
- [Definition of Done](https://www.scrum.org/resources/definition-done)

---

## 📈 Metrics & Reporting

### Sprint Metrics

```
1. Velocity: Story Points completed per sprint
2. Burndown: Remaining work over time
3. Cycle Time: Time from "To Do" to "Done"
4. Lead Time: Time from creation to done
5. WIP: Work in progress count
```

### Quality Metrics

```
1. Bug rate: Bugs per feature
2. Code coverage: Unit test percentage
3. Review time: Time in "Code Review"
4. Deployment frequency: Releases per sprint
```

---

**Cập nhật lần cuối**: 15/11/2025  
**Tạo bởi**: Scrum Master - Hoàng Văn Nghĩa (MSSV: 2351220040)  
**Team**: Sạp Phim Development Team
