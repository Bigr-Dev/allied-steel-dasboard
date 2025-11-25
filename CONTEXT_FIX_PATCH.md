# Context Fix Patch

## File: src/components/single-pages/load-assignment-single.jsx

### Change 1: Update Imports (Lines 1-2)

**REMOVE:**
```javascript
import { useGlobalContext } from '@/context/global-context'
```

**ADD:**
```javascript
import { useAssignment } from '@/context/providers/assignment-provider'
import { useUI } from '@/context/providers/ui-provider'
```

### Change 2: Update Hook Usage (Lines 1050-1052)

**FIND:**
```javascript
const LoadAssignmentSingle = ({ id, data }) => {
  const { assignment_preview, setAssignmentPreview, fetchData } =
    useGlobalContext()
  const { toast } = useToast()
```

**REPLACE WITH:**
```javascript
const LoadAssignmentSingle = ({ id, data }) => {
  const { assignment_preview, setAssignmentPreview } = useAssignment()
  const { fetchData } = useUI()
  const { toast } = useToast()
```

## Summary

- **Lines Changed**: 2 locations
- **Total Lines Modified**: 4 lines
- **Imports Removed**: 1
- **Imports Added**: 2
- **Hook Calls Changed**: 1 (split into 2)

## Verification

After applying the patch:
1. No import errors should occur
2. `assignment_preview` and `setAssignmentPreview` come from `useAssignment()`
3. `fetchData` comes from `useUI()`
4. All functionality remains the same
5. Component renders without errors

## Why This Change

- **Clarity**: Each hook clearly shows what context it uses
- **Performance**: Only subscribes to needed context
- **Maintainability**: Easier to understand dependencies
- **Best Practice**: Follows domain-specific context pattern
