# Auth Bootstrap & Service Editor Stabilization

This document explains the new auth bootstrap system and stabilized admin service editor implemented to eliminate refresh redirects and editor freezes.

## New Auth Bootstrap System

### Core Components

1. **`useAuthBootstrap`** - Replaces complex auth state management with simple loading/ready states
2. **`ProtectedRoute`** - Guards routes without race conditions 
3. **`useCanQuery`** - Prevents queries during auth bootstrap
4. **Stabilized Supabase Client** - Configured for persistent sessions

### How It Works

The new system follows a strict initialization order:

1. **Bootstrap Phase**: `useAuthBootstrap` calls `supabase.auth.getSession()` once
2. **Ready State**: Sets status to "ready" when session check completes
3. **Auth Listener**: Sets up `onAuthStateChange` for session updates
4. **Query Gate**: All data queries wait for `canQuery` to be true

### Key Improvements

- **No Race Conditions**: Session check completes before setting ready state
- **No Auth Key Cleanup**: Removed all localStorage auth key clearing that interfered with Supabase
- **Defensive Loading**: Never redirect while auth status is "loading"
- **Structured Logging**: All guard decisions logged with context

## Stabilized Service Editor

### Architecture Changes

1. **Debounced Save Pipeline**: 500ms delay with automatic coalescing
2. **Optimistic Updates**: UI updates immediately, rollback on error
3. **Error Boundaries**: Graceful error handling without crashes
4. **In-Flight Protection**: Prevents concurrent saves per service

### Save Flow

```
User types → Local state update → Queue patch → Debounce timer → Batch save → Success/Error feedback
```

### Error Handling

- **Network Errors**: Show error toast, rollback optimistic changes
- **Component Crashes**: Error boundary shows retry without losing session
- **Save Conflicts**: In-flight protection prevents "last write wins" issues

## Implementation Details

### Files Created/Modified

**New Files:**
- `src/lib/useAuthBootstrap.ts` - Core auth bootstrap hook
- `src/components/auth/ProtectedRoute.tsx` - Stable route protection
- `src/lib/dataLayer.ts` - Query enablement helpers
- `src/lib/adminServiceEditor.ts` - Debounced save system
- `src/lib/errorBoundary.tsx` - Service editor error boundary
- `src/pages/Health.tsx` - Auth status diagnostics endpoint
- `tests/auth-stability.spec.ts` - Playwright stability tests

**Modified Files:**
- `src/utils/authCleanup.ts` - Removed Supabase auth key clearing
- `src/pages/Admin.tsx` - Uses new auth system
- `src/main.tsx` - Removed old auth bootstrap
- `src/App.tsx` - Simplified with ProtectedRoute

### Database Changes

- Added `public.get_current_uid()` function for stable RLS policies
- Function uses `SECURITY DEFINER` to avoid plan cache issues

## Usage Guide

### Adding New Protected Routes

```tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

<Route 
  path="/protected-page" 
  element={
    <ProtectedRoute>
      <ProtectedPageComponent />
    </ProtectedRoute>
  } 
/>
```

### Using Data Hooks in Admin

```tsx
import { useCanQuery } from "@/lib/dataLayer";

const MyAdminComponent = () => {
  const canQuery = useCanQuery();
  
  const { data } = useQuery({
    queryKey: ['my-data'],
    queryFn: fetchData,
    enabled: canQuery  // Wait for auth ready
  });
};
```

### Service Editor Integration

```tsx
import { queueServicePatch } from "@/lib/adminServiceEditor";

const handleFieldChange = (field, value) => {
  // Update UI immediately (optimistic)
  setLocalData(prev => ({ ...prev, [field]: value }));
  
  // Queue for batch save
  queueServicePatch(serviceId, { [field]: value });
};
```

## Troubleshooting

### Common Issues

1. **Still seeing "Access Restricted"**: Check browser dev console for guard decision logs
2. **Editor not saving**: Look for network errors in dev tools, check error boundaries
3. **Slow loading**: Verify `useCanQuery` is being used in data hooks

### Debug Tools

- Visit `/health` for auth status diagnostics
- Console logs tagged with `[guard]` show all routing decisions
- Error boundaries log crashes with unique IDs

### Recovery

If auth gets stuck:
1. Open browser dev console
2. Run `window.location.reload()` 
3. Check `/health` endpoint for auth state
4. Clear browser cache if needed (auth keys are preserved)

## Testing

Run stability tests:
```bash
npx playwright test tests/auth-stability.spec.ts
```

Tests verify:
- No redirects on protected route refresh
- Responsive editor typing with debounced saves  
- Graceful network error handling
- Guard decision logging