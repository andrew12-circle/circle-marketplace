# Save System Architecture Issues & Solutions

## Current Problems Identified

### 1. Multiple Overlapping Save Systems
- `useUnifiedServiceSave` (ServiceManagementPanel core fields)
- `useVersionedAutosave` (ServiceFunnelEditor funnel content) 
- `useDebouncedSave` (old system)
- `useBulletproofSave` (legacy)
- `useServiceSaver` (generic)
- Direct `updateServiceById` calls (bypasses all coordination)

### 2. Specific Issues
- **ServiceFunnelEditor**: Uses both versioned autosave AND direct updateServiceById calls
- **Pricing deletion**: FunnelPricingEditor → ServiceFunnelEditor → useVersionedAutosave chain not working
- **State sync**: Multiple components have different views of service data
- **Save conflicts**: Different systems trying to save simultaneously

## Root Cause Analysis

### ServiceFunnelEditor Save Flow
```
FunnelPricingEditor.removeTier() 
  → onChange(updatedTiers) 
  → ServiceFunnelEditor.handlePricingChange() 
  → setPricingTiers(tiers)
  → useVersionedAutosave detects change via diff()
  → Calls saveFunnelPatch() RPC
```

**Problem**: The `diff()` function may not detect array changes properly.

### ServiceManagementPanel Save Flow
```
handleFieldChange() 
  → save() from useUnifiedServiceSave
  → serviceSaveCoordinator.save()
  → bulletproofSave() → RPC
```

## Solutions

### 1. Consolidate Save Systems
- Keep `useUnifiedServiceSave` for all core service fields
- Keep `useVersionedAutosave` ONLY for funnel content (not pricing)
- Remove redundant `handleFunnelSave` function
- Eliminate direct `updateServiceById` calls

### 2. Fix Pricing Save Flow
- Move pricing tiers to core service fields (saved via useUnifiedServiceSave)
- Remove pricing from versioned autosave
- Ensure FunnelPricingEditor changes trigger unified save

### 3. Improve State Synchronization
- Single source of truth for service data
- Proper prop drilling and callback handling
- Consistent state updates across components