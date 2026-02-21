# Cycle #2 Roadmap

> **Start Date**: 2026-02-21 (or week of 2026-02-24)
> **Duration**: Estimated 2-3 days
> **Exit Criteria**: All tests pass, design match ≥90%, deployment successful

---

## Overview

Cycle #2 focuses on:
1. **Completing P2 features** (notifications, profile settings)
2. **Quality assurance** (automated tests)
3. **Architectural improvements** (service layer, WebSocket)

---

## Feature Matrix

### FR-11: Notifications System (HIGH PRIORITY)

**Status**: Deferred from Cycle #1 (P2)
**Effort**: 2-3 days
**Blocker**: None (can run parallel with other features)

#### Scope

- [ ] **Desktop Notifications**: Browser push notifications for new files/messages/mentions
- [ ] **In-App Notifications**: Notification center badge + dropdown
- [ ] **Database**: Add `notifications` collection to bkend.ai
- [ ] **Real-time**: WebSocket integration with notification events
- [ ] **User Settings**: Notification preferences (enable/disable by type)

#### Design Checklist

- [ ] Data model for Notification entity
  - [ ] Recipient (userId)
  - [ ] Type (file_shared, message_received, action_assigned, mention)
  - [ ] Related entity reference (fileId, messageId, actionId)
  - [ ] Read status (boolean)
  - [ ] Timestamp

- [ ] API endpoints
  - [ ] GET /collections/notifications?userId={id} (list)
  - [ ] PUT /collections/notifications/{id} (mark as read)
  - [ ] DELETE /collections/notifications/{id} (dismiss)

- [ ] Components to build
  - [ ] NotificationCenter.tsx (dropdown)
  - [ ] NotificationItem.tsx (single notification)
  - [ ] NotificationBell.tsx (header icon with badge)
  - [ ] NotificationPreferences.tsx (settings)

- [ ] Hooks
  - [ ] useNotifications.ts (fetch, subscribe to new)

#### Implementation Order

1. [ ] Create notification collection schema in bkend.ai
2. [ ] Create Notification type in types/index.ts
3. [ ] Create notification hook (useNotifications)
4. [ ] Create NotificationCenter component
5. [ ] Add NotificationBell to header
6. [ ] Wire WebSocket to notification events
7. [ ] Add notification preferences to settings page
8. [ ] Test with TanStack Query DevTools

#### Acceptance Criteria

- [ ] User receives desktop notification when teammate sends message
- [ ] In-app notification center shows all notifications (5 most recent)
- [ ] Clicking notification highlights related message/file/action
- [ ] Mark as read updates badge count
- [ ] Preferences can disable notification types
- [ ] New notifications appear within 2 seconds

---

### FR-10: Complete Profile Settings (MEDIUM PRIORITY)

**Status**: Partial from Cycle #1 (P2)
**Effort**: 1 day
**Blocker**: FR-01 (auth) — already complete

#### Current State
- ✅ UI form exists: `src/app/(main)/settings/page.tsx`
- ✅ Input fields implemented (name, profileImage)
- ❌ Save handler not wired to backend
- ❌ Profile photo upload not functional

#### Scope

- [ ] **Name Update**: Save user.name to bkend.ai users collection
- [ ] **Photo Upload**: Upload to bkend.ai file storage, store URL in user.profileImage
- [ ] **Form Validation**: Check name length (1-50 chars), image format (jpg/png)
- [ ] **Success/Error Feedback**: Toast notifications
- [ ] **Loading States**: Spinner during save

#### Implementation Order

1. [ ] Create settings hook (useSettings) with update method
2. [ ] Wire form onSubmit to useSettings.updateProfile
3. [ ] Add file upload handler for profile photo
4. [ ] Add loading + error states to form
5. [ ] Add success toast on save
6. [ ] Test with TanStack Query DevTools

#### Acceptance Criteria

- [ ] User can update name and see change persist after reload
- [ ] User can upload profile photo (jpg/png, <5MB)
- [ ] Form shows loading spinner during save
- [ ] Success toast shows on save
- [ ] Error message shows if update fails
- [ ] Updated profile appears in header/messages

---

### WebSocket Upgrade (MEDIUM PRIORITY)

**Status**: Currently uses 5-second polling
**Effort**: 1 day
**Blocker**: None (current polling works; this is optimization)

#### Current Implementation
```javascript
// Currently: 5s polling
const { data: messages } = useQuery({
  queryKey: ['chat', teamId],
  queryFn: () => bkend.collection('chat-messages').query({ teamId }),
  refetchInterval: 5000, // 5s polling
});
```

#### Target Implementation
```javascript
// Target: True WebSocket
useEffect(() => {
  bkend.socket.on('chat-message', (message) => {
    queryClient.setQueryData(['chat', teamId], (old) => [...old, message]);
  });
}, [teamId]);
```

#### Scope

- [ ] Replace polling with WebSocket subscription
- [ ] Keep fallback to polling if WebSocket unavailable
- [ ] Apply to: chat messages, action items, file uploads
- [ ] Improve perceived real-time responsiveness

#### Implementation Order

1. [ ] Review bkend.ai WebSocket documentation
2. [ ] Create socket.ts utility with connection/reconnection logic
3. [ ] Replace polling with WebSocket in useChat hook
4. [ ] Replace polling with WebSocket in useActions hook
5. [ ] Add "connected" indicator in header
6. [ ] Test with DevTools (network tab)

#### Acceptance Criteria

- [ ] Messages appear instantly when teammate sends (not 5s delay)
- [ ] Actions update in real-time
- [ ] If WebSocket disconnects, fallback to polling + "Reconnecting..." UI
- [ ] No memory leaks (socket cleaned up on unmount)
- [ ] Network tab shows WebSocket messages (not continuous polling)

---

## Testing Strategy (HIGH PRIORITY)

**Goal**: Add 80%+ test coverage
**Tools**: Vitest + React Testing Library + Playwright
**Effort**: 2 days

### Phase 1: Unit Tests (1 day)

**Target**: Business logic hooks and utilities

```
[ ] useAuth.ts
[ ] useTeam.ts
[ ] useFiles.ts
[ ] useChat.ts
[ ] useActions.ts
[ ] utils.ts (formatDate, formatFileSize)
```

**Example Test**:
```typescript
describe('useChat', () => {
  it('sends message and updates query cache', async () => {
    const { result } = renderHook(() => useChat('team-123'));
    act(() => {
      result.current.sendMessage('Hello world');
    });
    await waitFor(() => {
      expect(result.current.messages).toContainEqual(
        expect.objectContaining({ content: 'Hello world' })
      );
    });
  });
});
```

### Phase 2: Component Tests (1 day)

**Target**: User interactions

```
[ ] ChatRoom.tsx (message input/display)
[ ] ActionConverter.tsx (message → action)
[ ] FileList.tsx (filter/search)
[ ] Dashboard.tsx (stats display)
[ ] LoginForm.tsx (auth flow)
```

**Example Test**:
```typescript
it('converts message to todo on button click', async () => {
  render(<ActionConverter messageId="msg-1" content="Do this" />);

  const todoButton = screen.getByRole('button', { name: /todo/i });
  await userEvent.click(todoButton);

  expect(screen.getByText(/converted to todo/i)).toBeInTheDocument();
});
```

### Phase 3: E2E Tests (1 day)

**Target**: Critical user journeys (with Playwright)

```
[ ] Full signup → team creation → send message → convert action
[ ] File upload → search → download
[ ] Profile update → see change in header
```

**Example Test**:
```typescript
test('signup to action conversion flow', async ({ page }) => {
  await page.goto('/register');

  // Signup
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'password123');
  await page.click('button:has-text("Sign up")');

  // Create team
  await page.fill('[name=teamName]', 'Test Team');
  await page.click('button:has-text("Create")');

  // Send message
  await page.fill('[name=message]', 'Review proposal by Friday');
  await page.click('button:has-text("Send")');

  // Convert to action
  await page.click('button:has-text("...")'); // message menu
  await page.click('text=Todo');

  // Verify dashboard
  await page.goto('/dashboard');
  expect(page.locator('text=Review proposal')).toBeVisible();
});
```

### Testing Checklist

- [ ] Create `src/__tests__/` directory
- [ ] Set up Vitest config in `vite.config.ts`
- [ ] Set up React Testing Library
- [ ] Create test utilities (render with providers)
- [ ] Write unit tests for hooks (1 day)
- [ ] Write component tests (1 day)
- [ ] Write E2E tests with Playwright (1 day)
- [ ] Set up CI/CD to run tests on push
- [ ] Achieve 80%+ coverage

---

## Architectural Improvements (OPTIONAL - Cycle #3)

If time permits in Cycle #2, consider:

### Service Layer Pattern

**Current (Anti-pattern)**:
```typescript
// In component
import { bkend } from '@/lib/bkend';

export function MyComponent() {
  const sendMessage = async (msg) => {
    await bkend.collection('chat-messages').create({...});
  };
}
```

**Target (Clean Architecture)**:
```typescript
// In service
// src/lib/services/chat.service.ts
export async function sendMessage(teamId, content) {
  return bkend.collection('chat-messages').create({...});
}

// In hook
import { sendMessage } from '@/lib/services/chat.service';

export function useChat() {
  return useMutation({
    mutationFn: (msg) => sendMessage(teamId, msg),
  });
}

// In component (clean!)
function MyComponent() {
  const { mutate: sendMessage } = useChat();
}
```

**Implementation**:
- [ ] Create `src/lib/services/` folder
- [ ] Extract bkend calls into service layer
- [ ] Update hooks to use services
- [ ] Update components to use hooks (no direct bkend)

---

## Deployment Checklist

Before marking Cycle #2 complete:

- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No lint errors (`npm run lint`)
- [ ] Environment variables configured in Vercel dashboard
- [ ] Vercel deployment successful
- [ ] Manual smoke test (signup → chat → action → dashboard)
- [ ] Error handling tested (network offline, API errors)

---

## Sprint Planning Template

### Day 1: FR-11 + Tests Setup

**Morning (2 hours)**:
- [ ] Set up Vitest + RTL
- [ ] Create test utilities
- [ ] Write first hook test (useAuth)

**Afternoon (2 hours)**:
- [ ] Create notification schema in bkend.ai
- [ ] Create Notification type
- [ ] Start NotificationCenter component

### Day 2: FR-11 Complete + More Tests

**Morning (2 hours)**:
- [ ] Finish notification UI
- [ ] Wire WebSocket to notifications
- [ ] Write component tests (NotificationCenter)

**Afternoon (2 hours)**:
- [ ] Complete profile settings save logic
- [ ] Write E2E test for critical flow
- [ ] Test file

### Day 3: WebSocket + Finish

**Morning (2 hours)**:
- [ ] Implement WebSocket upgrade
- [ ] Replace polling with real-time
- [ ] Performance test (DevTools)

**Afternoon (2 hours)**:
- [ ] Final testing + bug fixes
- [ ] Documentation updates
- [ ] Prepare Cycle #2 completion report

---

## Known Issues to Address

From Cycle #1 analysis:

1. **Clean Architecture**: 6 direct bkend imports in Presentation → Refactor to service layer
2. **Testing**: No automated tests → Add unit + E2E tests
3. **WebSocket**: Currently polling → Upgrade to true WebSocket
4. **Documentation**: API docs not auto-generated → Consider OpenAPI/Swagger

---

## Success Criteria

Cycle #2 will be PASS when:

- ✅ FR-11 fully implemented and tested
- ✅ FR-10 save logic wired and tested
- ✅ WebSocket working (or polling still acceptable if time-constrained)
- ✅ 80%+ test coverage achieved
- ✅ Design match ≥90% in analysis
- ✅ Build succeeds, zero lint errors
- ✅ Deployment successful to Vercel

---

## PDCA Commands for Cycle #2

Once ready to start:

```bash
# Plan
/pdca plan team-share-notifications

# Design
/pdca design team-share-notifications

# Do (implementation)
/pdca do team-share-notifications

# Check (gap analysis)
/pdca analyze team-share-notifications

# If gaps > 10%
/pdca iterate team-share-notifications

# Completion
/pdca report team-share-notifications
```

---

## Notes & Blockers

### No Known Blockers
- All previous work is complete (FR-01 to FR-09)
- bkend.ai fully operational
- Infrastructure (Vercel, bkend.ai) ready

### Dependencies
- FR-11 notifications: Independent (no other features depend)
- FR-10 profile: Depends on FR-01 (auth) — already complete
- WebSocket: Depends on nothing (optional enhancement)
- Tests: No dependencies (can run in parallel)

### Risk Mitigation
| Risk | Mitigation |
|------|-----------|
| Tests take longer than expected | Skip optional Cycle #3 refactoring; focus on critical flows |
| WebSocket has issues | Fall back to polling (current implementation works) |
| Profile photo upload fails | Store URL only (skip photo for MVP, add in v2.0) |

---

## Timeline Estimate

| Task | Days | Start | End |
|------|------|-------|-----|
| FR-11 Notifications | 2 | +1 | +2 |
| FR-10 Profile Settings | 1 | +1.5 | +2.5 |
| Testing (unit + E2E) | 2 | +1 | +3 |
| WebSocket Upgrade | 1 | +2 | +3 |
| **Total** | **2-3** | 2026-02-21 | 2026-02-23/24 |

---

**Next Steps**:
1. Review this roadmap with team
2. Adjust priorities if needed
3. Create GitHub issues for each feature
4. Start Cycle #2 planning when ready: `/pdca plan notifications`

**Report Date**: 2026-02-20
**For**: team-share Cycle #2
