import { Skeleton } from '@/components/ui/skeleton'
import page_bg from '@/assets/page_bg.png'
import Image from 'next/image'

export default function Loading() {
  return (
    <div className=" flex-1 min-h-screen ">
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
  )
}
