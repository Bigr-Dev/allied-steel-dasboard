import { fetchServerData } from '@/app/api/_lib/server-fetch'
import LoadAssignmentSingle from '@/components/single-pages/load-assignment-single'
import React from 'react'

const SingleItemPage = async ({ params }) => {
  const { page_id, id, slug } = await params
  //console.log('slug :>> ', `plans/${slug?.[0]}/units/${id}`)

  switch (page_id) {
    case 'load-assignment':
      // const unit_assignment = await fetchServerData(`plans`, 'POST', {
      //   plan_id: slug?.[0], // required
      //   include_nested: true, // false => plan header only
      //   include_idle: true, // only if include_nested=true
      //   unit_id: id, // optional: return nested for THIS unit only
      // })
      // console.log('unit_assignment :>> ', unit_assignment?.data)
      return <LoadAssignmentSingle id={id} />

    default:
      return <div>hi</div>
  }
}

export default SingleItemPage
