'use client'

// components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DetailCard from '@/components/ui/detail-card'
import { Input } from '@/components/ui/input'

import { useGlobalContext } from '@/context/global-context'
import { parseUploadedCSV } from '@/lib/csv-parser'

import { useState } from 'react'

const LoadsTable = () => {
  const { loads, onCreate, onEdit, onDelete, loading } = useGlobalContext()
  const initialLoadsState = loads || {}
  const [data, setData] = useState(loads?.data || [])

  const [isLoading, setIsLoading] = useState(false)

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const parsedData = await parseUploadedCSV({
        file,
        headers: initialLoadsState.upload_headers,
        rowMap: initialLoadsState.upload_map,
      })
      setData(parsedData)
    } catch (error) {
      console.error('Error parsing file:', error)
      alert('Error parsing CSV file. Please check the format.')
    } finally {
      setIsLoading(false)
    }
  }
  // console.log('data :>> ', data)
  return (
    <div className="space-y-6 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        <DetailCard title={' Data Upload'}>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="cursor-pointer"
              />
            </div>
          </div>
          {data.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Loaded {data.length} delivery records
            </p>
          )}
        </DetailCard>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {initialLoadsState?.tableInfo?.tabs ? (
          <Tabs defaultValue="all" className="w-full">
            <TabsList
              className={`grid w-full grid-cols-${initialLoadsState?.tableInfo?.tabs.length} gap-6`}
            >
              {initialLoadsState?.tableInfo?.tabs.map((trigger, index) => {
                return (
                  <TabsTrigger key={index} value={trigger.value}>
                    <h6 className="capitalize">{trigger.title}</h6>
                  </TabsTrigger>
                )
              })}
            </TabsList>
            {initialLoadsState?.tableInfo?.tabs?.map((content, index) => {
              return (
                <TabsContent
                  key={index}
                  value={content.value}
                  className="space-y-4"
                >
                  <DetailCard title={content.title}>
                    <DataTable
                      columns={initialLoadsState?.columns({
                        onEdit,
                        onDelete,
                      })}
                      data={
                        // content.value == 'other'
                        //   ? initialLoadsState?.data.filter(
                        //       (data) => !content.filterBy.includes(data.type)
                        //     )
                        //   : content.filterBy
                        //   ? initialLoadsState?.data?.filter((item) =>
                        //       item.type
                        //         ? item.type === content.filterBy
                        //         : item?.status && content.value === 'active'
                        //         ? item.status === 'in-progress' ||
                        //           item.status === 'delayed'
                        //         : item?.status === content.filterBy
                        //     )
                        //   : initialLoadsState?.data
                        data
                      }
                      filterColumn={content.filterColumn}
                      filterPlaceholder={content.filterPlaceholder}
                      csv_headers={initialLoadsState?.csv_headers}
                      csv_rows={initialLoadsState?.csv_rows}
                    />
                  </DetailCard>
                </TabsContent>
              )
            })}
          </Tabs>
        ) : initialLoadsState?.tableInfo ? (
          <DetailCard title={initialLoadsState?.tableInfo.title}>
            <DataTable
              columns={initialLoadsState?.columns({ onEdit, onDelete })}
              data={data}
              filterColumn={initialLoadsState?.tableInfo.filterColumn}
              filterPlaceholder={initialLoadsState?.tableInfo.filterPlaceholder}
              csv_headers={initialLoadsState?.csv_headers}
              csv_rows={initialLoadsState?.csv_rows}
            />
          </DetailCard>
        ) : null}
      </div>
    </div>
  )
}

export default LoadsTable
