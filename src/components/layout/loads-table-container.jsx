'use client'
import { useGlobalContext } from '@/context/global-context'
import { replaceHyphenWithUnderscore } from '@/hooks/replace-hyphen'
import { usePathname } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import DetailCard from '../ui/detail-card'
import { DataTable } from '../ui/data-table'

const LoadsTableContainer = () => {
  const pathname = usePathname().slice(1)
  const path = replaceHyphenWithUnderscore(pathname)
  const current_screen = useGlobalContext()[path]
  const { onEdit, onDelete, loading } = useGlobalContext()

  const overDue = current_screen?.data?.filter((order) => {
    const dateStr = order?.document_due_date

    const inputDate = new Date(dateStr)
    const today = new Date()

    // Set time to 00:00:00 for accurate date comparison
    inputDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    return inputDate <= today
  })

  const tomorrowOrders = current_screen?.data?.filter((order) => {
    const dueRaw = order?.document_due_date
    if (!dueRaw) return false

    const due = new Date(dueRaw)
    if (Number.isNaN(due)) return false

    const now = new Date()
    const startTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    )
    const startDayAfter = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 2
    )

    return due >= startTomorrow && due < startDayAfter
  })

  const upComing = current_screen?.data?.filter((order) => {
    const dueRaw = order?.document_due_date
    if (!dueRaw) return false

    const due = new Date(dueRaw)
    if (Number.isNaN(due)) return false

    const now = new Date()
    const startTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    )
    const startDayAfter = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 2
    )

    return due >= startDayAfter
  })

  console.log('current_screen :LoadsTableContainer>> ', current_screen?.data)
  return (
    <>
      {loading ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-1">
          {current_screen?.tableInfo?.tabs ? (
            <Tabs
              defaultValue={current_screen?.tableInfo?.tabs?.[0]?.value}
              className="w-full"
            >
              <TabsList
                className={`grid w-full grid-cols-${current_screen?.tableInfo?.tabs.length} gap-6`}
              >
                {current_screen?.tableInfo?.tabs.map((trigger, index) => {
                  return (
                    <TabsTrigger key={index} value={trigger.value}>
                      <h6 className="capitalize font-bold">{trigger.title}</h6>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
              {current_screen?.tableInfo?.tabs?.map((content, index) => {
                // console.log('content.value :>> ', content)
                return (
                  <TabsContent
                    key={index}
                    value={content.value}
                    className="space-y-4 "
                  >
                    <DetailCard title={content.title}>
                      <DataTable
                        columns={current_screen?.columns({
                          onEdit,
                          onDelete,
                        })}
                        data={
                          content.value == 'overdue'
                            ? overDue
                            : content.value == 'tomorrow'
                            ? tomorrowOrders
                            : content.value == 'week'
                            ? upComing
                            : content.value == 'other'
                            ? // ? content.value == 'Vehicles'
                              // : current_screen?.data?.filter(
                              //     (v) => v.type == 'Del Vehicle'
                              //   )
                              current_screen?.data.filter(
                                (data) =>
                                  !content?.filterBy?.includes(data.type)
                              )
                            : content.filterBy
                            ? current_screen?.data?.filter((item) =>
                                item.type
                                  ? item.type === content.filterBy
                                  : item?.status && content.value === 'active'
                                  ? item.status === 'in-progress' ||
                                    item.status === 'delayed'
                                  : item?.status === content.filterBy
                              )
                            : current_screen?.data
                        }
                        filterColumn={content.filterColumn}
                        filterPlaceholder={content.filterPlaceholder}
                        csv_headers={current_screen?.csv_headers}
                        csv_rows={current_screen?.csv_rows}
                      />
                    </DetailCard>
                  </TabsContent>
                )
              })}
            </Tabs>
          ) : current_screen?.tableInfo ? (
            <DetailCard title={`All ${current_screen?.tableInfo.title}`}>
              <DataTable
                columns={current_screen?.columns({ onEdit, onDelete })}
                data={current_screen?.data}
                filterColumn={current_screen?.tableInfo.filterColumn}
                filterPlaceholder={current_screen?.tableInfo.filterPlaceholder}
                csv_headers={current_screen?.csv_headers}
                csv_rows={current_screen?.csv_rows}
              />
            </DetailCard>
          ) : null}
        </div>
      )}
    </>
  )
}

export default LoadsTableContainer
