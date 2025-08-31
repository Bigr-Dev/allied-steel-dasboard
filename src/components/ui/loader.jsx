'use client'

import ClipLoader from 'react-spinners/ClipLoader'

const PageLoader = () => {
  return (
    <div className="fixed w-full h-full flex items-center justify-center bg-white/30 z-50">
      <ClipLoader color="#000" size={50} />
    </div>
  )
}

export default PageLoader
