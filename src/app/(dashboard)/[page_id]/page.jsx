import { fetchServerData } from '@/app/api/_lib/server-fetch'
import PageContainer from '@/components/layout/page-container'
import { getAuthOrRedirect } from '@/lib/check-token'
import { redirect } from 'next/navigation'
import PageTitle from './@title/default'
import Statistics from './@statistics/default'
import RouteAssignment from '@/components/layout/route-assignment-container'
import LoadsTableContainer from '@/components/layout/loads-table-container'

const ArchivePage = async ({ params, title, statistics }) => {
  const { page_id } = await params
  console.log('page_id :ArchivePage>> ', page_id)
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 p-1">
        {<PageTitle />}
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 p-1">
        {<Statistics />}
      </div>
      <div className="space-y-6 h-full overflow-y-auto  p-1">
        {/* {<PageContainer />} */}
        {page_id !== 'load-assignment' ? (
          <PageContainer />
        ) : (
          <RouteAssignment />
        )}
      </div>
    </>
  )
}

export default ArchivePage
