'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import PageTitle from '@/components/layout/page-title'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertCircle,
  Package,
  MapPin,
  Truck,
  Users,
  CheckCircle,
} from 'lucide-react'
import { useLoadsQuery } from '@/hooks/loads/useLoadsQuery'
import { formatWeight, formatQty } from '@/lib/formatters'
import FiltersBar from '@/components/loads/FiltersBar'
import OrdersTable from '@/components/loads/OrdersTable'
import CountUp from '../ui/count-up'
import { useGlobalContext } from '@/context/global-context'

export default function LoadsPage() {
  const router = useRouter()
  const { dashboardState } = useGlobalContext()
  const YMD_UTC = (date) =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
      2,
      '0'
    )}-${String(date.getUTCDate()).padStart(2, '0')}`

  const now = new Date()
  const tomorrowUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  )
  const tomorrow = YMD_UTC(tomorrowUTC)
  const [filters, setFilters] = useState({
    branch_id: dashboardState?.value || '',
    route_name: '',
    date: tomorrow,
    status: '',
    customer_name: '',
    includeItems: true,
  })
  const [activeTab, setActiveTab] = useState('by-suburb')

  const {
    data,
    loading,
    error,
    fetchLoads,
    reset,
    results,
    count,
    hasData,
    isEmpty,
  } = useLoadsQuery()

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handleFetch = (fetchFilters) => {
    console.log('fetchFilters :>> ', fetchFilters)
    fetchLoads(fetchFilters)
  }

  const handleReset = () => {
    reset()
  }

  const handleViewOrder = (order) => {
    router.push(`/orders/${order.id}`)
  }

  const handleReassignOrder = () => {
    // Refetch data after reassignment
    fetchLoads(filters)
  }

  // Flatten all orders for the flat table view
  const flatOrders = useMemo(() => {
    // console.log('results :>> ')
    if (!results || results.length === 0) return []

    const orders = []
    results.forEach((route) => {
      route.suburbs?.forEach((suburb) => {
        suburb.load_orders?.forEach((order) => {
          orders.push({
            ...order,
            route_name: route.route_name,
            branch_name: route.branch_name,
            suburb_name: suburb.suburb_name,
            city: suburb.city,
            province: suburb.province,
            postal_code: suburb.postal_code,
          })
        })
      })
    })

    return orders
  }, [results])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!results || results.length === 0) {
      return {
        routes: 0,
        suburbs: 0,
        orders: 0,
        totalQty: 0,
        totalWeight: 0,
      }
    }

    let routes = results.length
    let suburbs = 0
    let orders = 0
    let totalQty = 0
    let totalWeight = 0

    results.forEach((route) => {
      route.suburbs?.forEach((suburb) => {
        suburbs++
        suburb.load_orders?.forEach((order) => {
          orders++
          totalQty += order.total_quantity || 0
          totalWeight += order.total_weight || 0
        })
      })
    })

    return {
      routes,
      suburbs,
      orders,
      totalQty,
      totalWeight,
    }
  }, [results])

  const screenStats = [
    {
      title: 'Active Routes',
      value: summaryStats?.routes || 0,
      icon: <Truck className="h-6 w-6 xl:h-7 xl:w-7 text-gray-500" />,
    },
    {
      title: 'Active Suburbs',
      value: summaryStats?.suburbs || 0,
      icon: <MapPin className="h-6 w-6 xl:h-7 xl:w-7 text-blue-500" />,
    },
    {
      title: 'Total Orders',
      value: summaryStats?.orders || 0,
      icon: <Package className="h-6 w-6 xl:h-7 xl:w-7 text-red-500" />,
    },
    // {
    //   title: 'Total Load Items',
    //   value: `${formatQty(summaryStats?.totalQty)}` || 0,
    //   icon: <CheckCircle className="h-6 w-6 xl:h-7 xl:w-7 text-green-500" />,
    // },
    {
      title: 'Total Weight',
      value: `${formatWeight(summaryStats?.totalWeight)}` || 0,
      icon: <Package className="h-6 w-6 xl:h-7 xl:w-7 text-green-500" />,
    },
  ]
  // console.log('summaryStats :>> ', summaryStats)

  return (
    <div className="space-y-6 ">
      {/* <div className={`grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 `}>
        {screenStats?.map((stat, index) => {
          const Icon = stat.icon

          return (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {Icon}
                    <CardTitle>{stat.title}</CardTitle>
                  </div>
                  <div className="text-2xl font-bold">
                    <CountUp value={stat.value} />
                  </div>
                </div>
              </CardHeader>
            </Card>
          )
        })}
      </div> */}

      {/* Filters */}
      <FiltersBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onFetch={handleFetch}
        onReset={handleReset}
        loading={loading}
      />

      {/* Summary Stats */}
      {/* {hasData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Routes</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats?.routes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suburbs</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats?.suburbs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats?.orders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Qty</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatQty(summaryStats?.totalQty)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Weight
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatWeight(summaryStats?.totalWeight)}
              </div>
            </CardContent>
          </Card>
        </div>
      )} */}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      )}

      {/* Empty State */}
      {isEmpty && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No loads found</h3>
            <p className="text-muted-foreground text-center">
              Adjust your filters and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
    </div>
  )
}
