export const metadata = {
  title: 'Motion Live',
  description: 'Motion Live Routing System',
}
const ArchivePageLayout = async ({ children, params }) => {
  const { page_id, id } = await params
  //  console.log('page_id :Layout>> ', page_id, id)
  return (
    <div className=" space-y-10  h-full overflow-y-auto  p-4 md:p-6 ">
      <div className="space-y-6 h-full overflow-y-auto  p-1">{children}</div>
    </div>
  )
}

export default ArchivePageLayout
