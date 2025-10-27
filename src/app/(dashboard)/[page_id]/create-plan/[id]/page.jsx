import LoadAssignmentPreviewSingle from '@/components/single-pages/load-assignment-preview-single'
import React from 'react'

const VehiclePreview = async ({ params }) => {
  const { id } = await params
  // console.log('params :>> ', id)
  return (
    <div>
      <LoadAssignmentPreviewSingle id={id} />
    </div>
  )
}

export default VehiclePreview
