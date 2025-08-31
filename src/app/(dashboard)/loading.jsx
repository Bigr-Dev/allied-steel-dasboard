import PageLoader from '@/components/ui/loader'
import { Skeleton } from '@/components/ui/skeleton'

const Loading = () => {
  return (
    <div className=" space-y-10  h-full overflow-y-auto  p-4 md:p-6 ">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 p-1">
        <Skeleton />
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 p-1">
        <Skeleton />
      </div>
      <div className="space-y-6 h-full overflow-y-auto  p-1">
        {' '}
        <Skeleton />
      </div>
    </div>
  )
}

export default Loading
