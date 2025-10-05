import { fetchServerData } from '@/app/api/_lib/server-fetch'
import LoadAssignmentSingle from '@/components/single-pages/load-assignment-single'
import React from 'react'

const SingleItemPage = async ({ params }) => {
  const { page_id, id, slug } = await params
  //console.log('slug :>> ', `plans/${slug?.[0]}/units/${id}`)

  switch (page_id) {
    case 'load-assignment':
      const unit_assignment = await fetchServerData(
        `plans/${slug?.[0]}/units/${id}`,
        'GET'
      )
      console.log('unit_assignment :>> ', unit_assignment?.data)
      return <LoadAssignmentSingle id={id} data={unit_assignment?.data} />

    default:
      return <div>hi</div>
  }
}

export default SingleItemPage
