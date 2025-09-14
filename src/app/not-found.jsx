'use client'

// next
import Link from 'next/link'

// components
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// assets
import Image from 'next/image'
import Contact_bg from '@/assets/contact.jpg'
import DetailCard from '@/components/ui/detail-card'

const NotFound = () => {
  return (
    <div className="flex flex-col h-screen justify-center items-center space-y-7">
      <div className="flex flex-col space-y-2 text-center z-10">
        <h1 className="text-4xl font-bold text-white tracking-tight sm:text-5xl">
          Page Not Found
        </h1>
        <p className="text-sm text-muted-foreground">
          The page you're looking for doesn't exist
        </p>
      </div>

      <div className="z-10 min-w-[50vw]">
        <DetailCard
          className="min-w-[60vw]"
          title={'404 - Not Found'}
          description={
            "The dashboard page you're looking for could not be found. It may have been moved, deleted, or you entered the wrong URL."
          }
        >
          {/* <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please check the URL and try again, or navigate back to the
              dashboard.
            </p>
          </CardContent>
          <CardContent className="flex justify-center"> */}
          <Button asChild className="w-full bg-[#003e69] hover:bg-[#428bca]">
            <Link href="/">Back to Dashboard</Link>
          </Button>
          {/* </CardContent> */}
        </DetailCard>
      </div>

      <Image
        alt="contact-bg"
        src={Contact_bg}
        placeholder="blur"
        quality={100}
        fill
        sizes="100vw"
        style={{
          objectFit: 'cover',
          zIndex: -1,
        }}
      />
      <div className="absolute top-0 right-0 h-full w-full bg-black/70 z-0"></div>
    </div>
  )
}

export default NotFound
