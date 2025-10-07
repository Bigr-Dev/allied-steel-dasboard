'use client'

import ClipLoader from 'react-spinners/ClipLoader'
import page_bg from '@/assets/allied_plain_bg.png'
import Image from 'next/image'

const PageLoader = () => {
  return (
    <div className="fixed w-full h-full flex items-center justify-center bg-white/30 z-50">
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
      <ClipLoader color="#003e69" size={80} />
    </div>
  )
}

export default PageLoader
