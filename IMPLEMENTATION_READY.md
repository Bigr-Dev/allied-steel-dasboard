# Context Migration - Implementation Ready

## Status: ✅ READY TO IMPLEMENT

All analysis complete. One file needs updating.

## File to Update

**Path**: `src/components/single-pages/load-assignment-single.jsx`

## Exact Changes Required

### Step 1: Replace Lines 1-2 (Imports)

**Current**:
```javascript
'use client'
import { useGlobalContext } from '@/context/global-context'
import { useToast } from '@/hooks/use-toast'
```

**New**:
```javascript
'use client'
import { useAssignment } from '@/context/providers/assignment-provider'
import { useUI } from '@/context/providers/ui-provider'
import { useToast } from '@/hooks/use-toast'
```

### Step 2: Replace Lines 1050-1052 (Hook Usage)

**Current**:
```javascript
const LoadAssignmentSingle = ({ id, data }) => {
  const { assignment_preview, setAssignmentPreview, fetchData } =
    useGlobalContext()
  const { toast } = useToast()
```

**New**:
```javascript
const LoadAssignmentSingle = ({ id, data }) => {
  const { assignment_preview, setAssignmentPreview } = useAssignment()
  const { fetchData } = useUI()
  const { toast } = useToast()
```

## What Stays the Same

✅ All component logic remains unchanged
✅ All functionality works identically
✅ No behavior changes
✅ No API changes
✅ No prop changes

## What Changes

- Import source changes from `global-context` to specific providers
- Hook call splits from one `useGlobalContext()` to two specific hooks
- Each hook now clearly shows its domain

## Verification After Update

1. File should have no import errors
2. Component should render without errors
3. All drag-and-drop functionality should work
4. All assignment operations should work
5. No console errors

## Why This Matters

- **Clarity**: Clear what context each part uses
- **Performance**: Only subscribes to needed context
- **Maintainability**: Easier to understand dependencies
- **Best Practice**: Follows domain-specific context pattern
- **Future-Proof**: Easier to refactor individual domains

## Next Steps

1. Apply the two changes above
2. Test the component
3. Verify no errors in console
4. Commit the changes

## Reference Files

- `CONTEXT_AUDIT_REPORT.md` - Full audit details
- `CONTEXT_MIGRATION_GUIDE.md` - Migration reference
- `CONTEXT_FIX_PATCH.md` - Patch format
- `CONTEXT_AUDIT_COMPLETE.md` - Complete findings

---

**Total Changes**: 2 locations, 4 lines modified
**Complexity**: Low
**Risk**: Very Low (no logic changes)
**Time to Implement**: < 5 minutes
