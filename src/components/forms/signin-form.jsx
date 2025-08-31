'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import Hero_bg from '@/assets/motion_hero.jpg'
import Image from 'next/image'
// import { useAuth } from '@/context/auth-context/context'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/initial-states/auth-state'
import allied_logo from '@/assets/Allied-logo.png'
import { Eye, EyeOff } from 'lucide-react'
import PageLoader from '../ui/loader'

const SignInForm = () => {
  const { login, loading } = useAuth()

  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)

  const [disabled, setDisabled] = useState(true)

  useEffect(() => {
    if (email.includes('@') && password.length > 6) {
      setDisabled(false)
    } else {
      setDisabled(true)
    }
  }, [email, password])

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError(null)
    try {
      const userData = {
        email,
        password,
      }
      login(userData)
      // router.push('/') // or dashboard
    } catch (err) {
      setError('Invalid email or password.')
      toast({
        title: 'Invalid email or password.',
        description: 'Please enter valid email and password.',
      })
    }
  }

  return (
    <div className="flex flex-col h-screen justify-center items-center space-y-4 relative">
      <div className="flex  aspect-square size-30 self-center items-center justify-center ">
        <Image
          src={allied_logo}
          alt="Allied Steelrode"
          style={{ objectFit: 'contain', zIndex: 1 }}
        />
      </div>

      <form onSubmit={handleSubmit} className=" z-10">
        <Card className="min-w-[500px] space-y-2">
          <CardHeader>
            <CardTitle className="text-xl text-center text-[#003e69] ">
              Sign In
            </CardTitle>
            <CardDescription className={'text-[#428bca] text-center'}>
              Access the fleet management dashboard to manage your vehicles,
              drivers, and trips.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className={'font-semibold text-[#003e69]'}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="relative border-[#428bca]"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className={'font-semibold text-[#003e69]'}
                >
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#428bca] hover:text-[#003e69]"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="relative border-[#428bca]"
                  required
                />

                <button
                  type="button"
                  className="absolute right-2 top-2 text-sm text-blue-600 "
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeOff
                      size={18}
                      className=" text-[#428bca] hover:text-[#003e69]"
                    />
                  ) : (
                    <Eye
                      size={18}
                      className=" text-[#428bca] hover:text-[#003e69]"
                    />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" className={'border-[#428bca]'} />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[#428bca] hover:text-[#003e69]"
              >
                Remember me
              </label>
            </div>
            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              className={`w-full hover:bg-[#428bca] ${
                disabled ? 'bg-[#428bca]' : 'bg-[#003e69]'
              }`}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {loading && <PageLoader />}

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

export default SignInForm
