# Graph Report - D:\task_manager  (2026-06-09)

## Corpus Check
- 99 files · ~71,234 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 257 nodes · 251 edges · 55 communities detected
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]

## God Nodes (most connected - your core abstractions)
1. `POST()` - 29 edges
2. `GET()` - 26 edges
3. `PATCH()` - 11 edges
4. `getSession()` - 7 edges
5. `DELETE()` - 6 edges
6. `proxy()` - 4 edges
7. `formatDateRange()` - 4 edges
8. `buildActivitySentence()` - 4 edges
9. `hasPermission()` - 4 edges
10. `formatDateShort()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `AllTasksContent()` --calls--> `GET()`  [INFERRED]
  D:\task_manager\src\app\(dashboard)\all-tasks\page.tsx → D:\task_manager\src\app\api\users\route.ts
- `GET()` --calls--> `fetchNotifications()`  [INFERRED]
  D:\task_manager\src\app\api\users\route.ts → D:\task_manager\src\components\layout\TopNav.tsx
- `POST()` --calls--> `signToken()`  [INFERRED]
  D:\task_manager\src\app\api\users\route.ts → D:\task_manager\src\lib\auth.ts
- `proxy()` --calls--> `GET()`  [INFERRED]
  D:\task_manager\src\proxy.ts → D:\task_manager\src\app\api\users\route.ts
- `MyTasksContent()` --calls--> `GET()`  [INFERRED]
  D:\task_manager\src\app\(dashboard)\my-tasks\page.tsx → D:\task_manager\src\app\api\users\route.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (7): sendEmailTaskReminder(), sendWelcomeEmail(), MyTasksContent(), emptyHML(), GET(), POST(), sendWhatsAppTaskReminder()

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (6): pauseRecording(), resumeRecording(), startRecording(), startTimer(), stopRecording(), stopTimer()

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (9): signToken(), verifyToken(), ProfilePage(), proxy(), canAccess(), hasPermission(), DELETE(), PATCH() (+1 more)

### Community 3 - "Community 3"
Cohesion: 0.21
Nodes (6): fetchOnboardingData(), handleAddChecklistItem(), handleCreateTemplate(), handleRemoveChecklistItem(), handleUpdateTemplate(), resetForm()

### Community 4 - "Community 4"
Cohesion: 0.2
Nodes (3): clearSearch(), fetchNotifications(), handleTaskClick()

### Community 5 - "Community 5"
Cohesion: 0.33
Nodes (6): pauseRecording(), resumeRecording(), startRecording(), startTimer(), stopRecording(), stopTimer()

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (0): 

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (0): 

### Community 8 - "Community 8"
Cohesion: 0.43
Nodes (5): buildActivitySentence(), formatDate(), formatDateRange(), formatDateShort(), formatTime()

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 0.4
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 0.4
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 0.5
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 0.67
Nodes (2): fetchNotifications(), handleMarkAllAsRead()

### Community 15 - "Community 15"
Cohesion: 0.5
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 0.67
Nodes (2): ScoreBar(), scorePct()

### Community 17 - "Community 17"
Cohesion: 0.5
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 0.5
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 0.67
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (1): AllTasksContent()

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (2): fetchDepartmentsData(), handleCreateDepartment()

### Community 22 - "Community 22"
Cohesion: 0.67
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 0.67
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 0.67
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 25`** (2 nodes): `seed.ts`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `layout.tsx`, `RootLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `page.tsx`, `Home()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (2 nodes): `layout.tsx`, `DashboardRouteLayout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `page.tsx`, `fetchAuditLogs()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `page.tsx`, `DelegatedByPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `page.tsx`, `handleSubmit()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `handleSubmit()`, `AddEmployeeModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `Sidebar.tsx`, `handleLogout()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `ThemeToggle.tsx`, `ThemeToggle()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `Toast.tsx`, `handleDismiss()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `UserAvatar.tsx`, `UserAvatar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `useTimeTheme.ts`, `useTimeTheme()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `prisma.ts`, `makePrismaClient()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `useTaskStore.ts`, `filterTasks()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `eslint.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `postcss.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `prisma.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `DashboardLayout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `Badge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `Button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `FormField.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `uploadthing-client.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `uploadthing.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `useThemeStore.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GET()` connect `Community 0` to `Community 2`, `Community 20`, `Community 4`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `POST()` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `fetchNotifications()` connect `Community 4` to `Community 0`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `POST()` (e.g. with `signToken()` and `getSession()`) actually correct?**
  _`POST()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `GET()` (e.g. with `proxy()` and `AllTasksContent()`) actually correct?**
  _`GET()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `PATCH()` (e.g. with `getSession()` and `hasPermission()`) actually correct?**
  _`PATCH()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `getSession()` (e.g. with `GET()` and `POST()`) actually correct?**
  _`getSession()` has 6 INFERRED edges - model-reasoned connections that need verification._