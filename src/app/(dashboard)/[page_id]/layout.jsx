// next
import Image from 'next/image'

// image
import page_bg from '@/assets/page_bg.png'

export const metadata = {
  title: 'Allied Steelrode',
  description: 'Dashboard - Allied Steelrode Routing System',
}
const ArchivePageLayout = async ({ children, params }) => {
  const { page_id, id } = await params
  //  console.log('page_id :Layout>> ', page_id, id)
  return (
    // <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50  space-y-6 h-full overflow-y-auto   p-4 md:p-6">
    <div className="min-h-screen z-1    overflow-y-auto   p-4 md:p-6">
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
      <div className="relative space-y-6">{children}</div>
    </div>
  )
}

export default ArchivePageLayout
