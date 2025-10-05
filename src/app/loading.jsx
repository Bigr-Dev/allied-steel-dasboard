import PageLoader from '@/components/ui/loader'
import {
  Sidebar,
  SidebarHeader,
  SidebarProvider,
} from '@/components/ui/sidebar-provider'
import { Skeleton } from '@/components/ui/skeleton'
import allied_logo from '@/assets/steel_logo.png'
import Image from 'next/image'
import { Bell, Truck } from 'lucide-react'

// image
import page_bg from '@/assets/allied_plain_bg.png'
import header_bg from '@/assets/Allied-Steelrode-Background-1.png'

const Loading = () => {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="z-30  group ">
        <SidebarHeader className=" h-16 justify-center  bg-[#101a27]  shadow-md ">
          <div className="flex aspect-square size-7 items-center justify-center rounded-lg  text-white">
            <Truck className="size-4" />
          </div>
        </SidebarHeader>
      </Sidebar>
      <main className=" flex-1 min-h-screen ">
        <div className="sticky  h-16 top-0 z-10 px-4  md:px-6 bg-gray-100 dark:bg-gray-900 backdrop-blur supports-[backdrop-filter]:bg-[#003e69] dark:supports-[backdrop-filter]:bg-gray-900/60 flex shrink-0 justify-between items-center shadow-lg ">
          <div className="flex flex-col flex-1/3 ">
            <Skeleton className="text-l text-white font-bold tracking-tight capitalize" />
            <Skeleton className="text-white text-sm" />
          </div>
          <div className="flex  aspect-square size-13 self-center items-center justify-center ">
            <Image
              src={allied_logo}
              alt="Allied Steelrode"
              style={{ objectFit: 'contain', zIndex: 1 }}
            />
          </div>
          <div className=" flex flex-1/3  justify-end space-x-4 items-center z-10">
            <Bell size={20} color="#fff" />
          </div>
          <div className="fixed inset-0 -z-10 pointer-events-none">
            <Image
              src={header_bg}
              alt="motion-live-bg"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className=" overflow-y-auto  ">
          {/* <div className="  flex-1 min-h-screen ">
            <div className="flex-1  overflow-y-auto p-4 md:p-6">
              <div className="space-y-6 h-full overflow-y-auto">
                <div className="flex flex-col md:flex-row justify-end items-center gap-4">
                  <Skeleton className="h-[42px] w-[140px] rounded-xl bg-white" />
                </div>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                  <Skeleton className="h-[125px] w-[100%] rounded-xl bg-white" />
                  <Skeleton className="h-[125px] w-[100%] rounded-xl bg-white" />
                  <Skeleton className="h-[125px] w-[100%] rounded-xl bg-white" />
                  <Skeleton className="h-[125px] w-[100%] rounded-xl bg-white" />
                </div>
                <div className="">
                  <Skeleton className="h-[42px] w-[140px] rounded-xl bg-white" />
                </div>
                <div className="">
                  <Skeleton className="h-[40vh] w-[100%] rounded-xl bg-white" />
                </div>
              </div>
            </div>
          </div> */}
          <div className="flex-1  overflow-y-auto p-4 md:p-6">
            <div className="space-y-6 h-full overflow-y-auto">
              <div className="flex flex-row justify-between items-center">
                <div className="p-1 space-y-2 ">
                  <Skeleton className="h-[24px] w-[200px] " />
                  <Skeleton className="h-[16px] w-[200px]" />
                </div>

                <div className="flex flex-col md:flex-row justify-end items-center gap-4 p-1">
                  <Skeleton className="h-[42px] w-[140px] rounded-xl bg-white" />
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-[80px] w-[100%] rounded-xl bg-white" />
                <Skeleton className="h-[80px] w-[100%] rounded-xl bg-white" />
                <Skeleton className="h-[80px] w-[100%] rounded-xl bg-white" />
                <Skeleton className="h-[80px] w-[100%] rounded-xl bg-white" />
              </div>
              <div className="">
                <Skeleton className="h-[42px] w-full rounded-xl bg-white" />
              </div>
              <div className="">
                <Skeleton className="h-[40vh] w-[100%] rounded-xl bg-white" />
              </div>
            </div>
          </div>
        </div>
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <Image
            src={page_bg}
            alt="motion-live-bg"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </main>
    </SidebarProvider>
  )
}

export default Loading
