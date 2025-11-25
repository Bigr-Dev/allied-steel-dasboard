  const handleCustomerReorder = async (active, over, dragData) => {
    if (!over) return
    const overData = over.data.current
    if (!overData || overData.type !== 'sortable-customer') return

    const { unitId, customerIds } = dragData
    const activeCustomerId = dragData.customerId
    const overCustomerId = overData.customerId

    if (
      !Array.isArray(customerIds) ||
      customerIds.length === 0 ||
      activeCustomerId === overCustomerId
    ) {
      return
    }

    const oldIndex = customerIds.findIndex(
      (id) => String(id) === String(activeCustomerId)
    )
    const newIndex = customerIds.findIndex(
      (id) => String(id) === String(overCustomerId)
    )

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

    const newCustomerIds = arrayMove(customerIds, oldIndex, newIndex)

    const planId = plan?.id || data?.plan?.id
    if (!planId) {
      toast({ title: 'Error', description: 'Plan ID not found' })
      return
    }

    const assignments = []

    setAssignedUnits((prev) =>
      prev.map((u) => {
        if (String(u.planned_unit_id) !== String(unitId)) return u

        const existingCustomers = u.customers || []
        const customerMap = new Map(
          existingCustomers.map((c) => [String(c.customer_id), c])
        )

        // Reorder ALL customers in the unit globally
        const reorderedCustomers = newCustomerIds
          .map((cid, idx) => {
            const key = String(cid)
            const existing = customerMap.get(key)
            if (!existing) return null

            const customerIndex = idx + 1 // 1-based position in unit

            const updatedOrders = (existing.orders || []).map(
              (order, orderIdx) => {
                const orderIndex = orderIdx + 1
                const newSeq = customerIndex * 1000 + orderIndex

                assignments.push({
                  order_id: order.order_id,
                  stop_sequence: newSeq,
                  sales_order_number:
                    order.sales_order_number ||
                    order.items?.[0]?.order_number ||
                    null,
                })

                return {
                  ...order,
                  stop_sequence: newSeq,
                }
              }
            )

            return {
              ...existing,
              orders: updatedOrders,
            }
          })
          .filter(Boolean)

        // Merge reordered customers back into the full list
        const updatedById = new Map(
          (reorderedCustomers || []).map((c) => [String(c.customer_id), c])
        )

        const finalCustomers = existingCustomers.map((c) => {
          const overridden = updatedById.get(String(c.customer_id))
          return overridden || c
        })

        // Also update flat orders view to stay in sync
        const flatOrders = finalCustomers.flatMap((c) => c.orders || [])

        return {
          ...u,
          customers: finalCustomers,
          orders: flatOrders.length ? flatOrders : u.orders,
        }
      })
    )

    if (!assignments.length) return

    try {
      const res = await fetchData(`plans/${planId}/bulk-assign`, 'POST', {
        plan_id: planId,
        assignments: [
          {
            planned_unit_id: unitId,
            orders: assignments.map((o) => ({
              order_id: o.order_id,
              stop_sequence: o.stop_sequence,
              sales_order_number: o.sales_order_number,
            })),
          },
        ],
      })

      // KEEP the duplicate-fix pattern: sync assignment_preview when res is available
      if (typeof setAssignmentPreview === 'function' && res) {
        setAssignmentPreview({
          units: res?.units,
          unassigned_orders: res?.unassigned_orders,
          plan: res?.plan,
        })
      }

      toast({
        title: 'Saved',
        description: 'Customer sequence updated',
      })
    } catch (error) {
      handleAPIError(error, toast)
    }
  }
