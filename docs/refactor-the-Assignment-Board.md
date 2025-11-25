# Task: Refactor Assignment Board to Use a Reducer Pattern

The Assignment Board is implemented under `src/components/layout/assignment/`:

- `AssignmentBoard.jsx`
- `VehicleCard.jsx`
- `UnassignedList.jsx`
- `DraggableItemRow.jsx`
- `ItemRow.jsx`
- `load-assignment.jsx` wrapper :contentReference[oaicite:18]{index=18} :contentReference[oaicite:19]{index=19}

It uses **@dnd-kit** for drag-and-drop, global context for `assignment_preview`, and calls APIs to move orders between vehicles. :contentReference[oaicite:20]{index=20}

There are known issues where:

- Moving an order succeeds on the backend but the UI doesn’t update correctly (state mismatch / stale state).

## Goal

Refactor `AssignmentBoard` and related components to use a **centralised reducer-based state** for the board, so that all drag-and-drop actions funnel through:

```js
dispatch({ type: 'MOVE_ORDER', payload: { orderId, fromUnitId, toUnitId } })
```
