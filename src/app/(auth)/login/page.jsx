import SignInForm from '@/components/forms/signin-form'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import Hero_bg from '@/assets/motion_hero.jpg'
import Image from 'next/image'
const Login = () => {
  return (
    <div className="">
      <ScrollArea className="h-screen w-full ">
        <SignInForm />
      </ScrollArea>

      <Image
        alt="motion-live-bg"
        src={Hero_bg}
        placeholder="blur"
        quality={100}
        fill
        sizes="100vw"
        style={{
          objectFit: 'cover',
          zIndex: -1,
        }}
      />
      <div className="absolute top-0 right-0 h-full w-full bg-black/10 z-0"></div>
    </div>
  )
}

export default Login
