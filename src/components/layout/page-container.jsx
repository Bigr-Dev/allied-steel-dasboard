'use client'

// next
import { usePathname } from 'next/navigation'

// components
import PageLoader from '@/components/ui/loader'
import { DataTable } from '@/components/ui/data-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DetailCard from '../ui/detail-card'

// context
import { useGlobalContext } from '@/context/global-context'

// hooks
import { replaceHyphenWithUnderscore } from '@/hooks/replace-hyphen'
import { LoadAssignment } from './assignment/load-assignment'

const PageContainer = ({ children }) => {
  const pathname = usePathname().slice(1)
  let path
  if (pathname == 'load-assignment') {
    path = pathname
  } else {
    path = replaceHyphenWithUnderscore(pathname)
  }
  //const path = replaceHyphenWithUnderscore(pathname)

  const current_screen = useGlobalContext()[path]
  const { onEdit, onDelete, loading, branches, drivers, vehicles, assignment } =
    useGlobalContext()

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

  //console.log('current_screen :>> ', current_screen)
  //console.log('pathname :>> ', pathname)
  let data = current_screen?.data

  switch (pathname) {
    case 'vehicles':
      const vehicles_data = current_screen?.data?.map((v) => {
        const driver = drivers?.data?.filter(
          (d) => d.id == v.current_driver
        )?.[0]?.name
        const link = vehicles?.data?.filter(
          (link) => link.id == v.assigned_to
        )?.[0]?.fleet_number
        return { ...v, current_driver: driver, assigned_to: link }
      })
      data = vehicles_data
      // console.log('current_screen?.data :>> ', vehicles_data)
      break

    case 'drivers':
      // console.log('pathname :>> ', pathname)
      const driver_data = current_screen?.data?.map((d) => {
        const d_vehicle = vehicles?.data?.filter(
          (v) => v.id == d.current_vehicle
        )?.[0]?.fleet_number
        // console.log('d_vehicle :>> ', d_vehicle)
        return { ...d, current_vehicle: d_vehicle }
      })
      // console.log('driver_data :>> ', driver_data)
      data = driver_data
      break

    case 'load-assignment':
      data = assignment
      return (
        <>
          <DetailCard title={`${assignment?.tableInfo.title}`}>
            {assignment?.data?.plans && (
              <DataTable
                columns={assignment?.columns({
                  onEdit,
                  onDelete,
                  branches: branches?.data,
                })}
                data={assignment?.data?.plans}
                filterColumn={assignment?.tableInfo.filterColumn}
                filterPlaceholder={assignment?.tableInfo.filterPlaceholder}
                // csv_headers={current_screen?.csv_headers}
                // csv_rows={current_screen?.csv_rows}
              />
            )}
          </DetailCard>
        </>
      )
      break

    default:
      break
  }

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
                className={`grid w-full grid-cols-${current_screen?.tableInfo?.tabs?.length} gap-6`}
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
                              data?.filter(
                                (data) =>
                                  !content?.filterBy?.includes(data.type)
                              )
                            : content.filterBy
                            ? data?.filter((item) =>
                                item.type
                                  ? item.type === content?.filterBy
                                  : item?.status && content?.value === 'active'
                                  ? item.status === 'in-progress' ||
                                    item.status === 'delayed'
                                  : item?.status === content?.filterBy
                              )
                            : data
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
                data={data}
                filterColumn={current_screen?.tableInfo?.filterColumn}
                filterPlaceholder={current_screen?.tableInfo?.filterPlaceholder}
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

export default PageContainer
