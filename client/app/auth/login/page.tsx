'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, Github, Wand2 } from 'lucide-react'
//
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Separator } from '~/components/ui/separator'
import { authClient } from '~/lib/auth'
import { API_URL } from '../../../lib/constants'

type FormValues = {
  email: string
  password: string
}

type MagicLinkFormValues = {
  email: string
}

// Extract login form to its own component
function LoginForm() {
  const [isGithubLoading, setIsGithubLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false)
  const [isFormBlurred, setIsFormBlurred] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  // Check if this is an OIDC authorization request
  const isOIDCFlow = searchParams.get('client_id') !== null;

  // Password login form
  const form = useForm<FormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Magic link form
  const magicLinkForm = useForm<MagicLinkFormValues>({
    defaultValues: {
      email: '',
    },
  })

  const { isSubmitting } = form.formState
  const { isSubmitting: isMagicLinkSubmitting } = magicLinkForm.formState

  const onSubmit = async (data: FormValues) => {
    // Blur the form and show spinner
    setIsFormBlurred(true)
    
    // Sign in with email and password
    await authClient.signIn.email(data, {
      onSuccess: () => {
        toast.success('Welcome back!', {
          description: 'You have successfully logged in.',
        })
        if (isOIDCFlow) {
          // For OIDC flow, redirect to continue the authorization process
          // Preserve all original OIDC parameters
          const currentUrl = new URL(window.location.href);
          const authorizationUrl = new URL('/api/auth/oauth2/authorize', API_URL);
          
          // Copy all OIDC parameters from current URL to authorization URL
          ['response_type', 'redirect_uri', 'client_id', 'nonce', 'state', 'scope', 'code_challenge', 'code_challenge_method'].forEach(param => {
            const value = currentUrl.searchParams.get(param);
            if (value) {
              authorizationUrl.searchParams.set(param, value);
            }
          });
  
          // Keep form blurred since we're redirecting elsewhere
          window.location.href = authorizationUrl.toString();
          return;
        }
        // Unblur form for normal redirect
        setIsFormBlurred(false)
        router.push(callbackUrl)
      },
      onError: ({ error }) => {
        console.error(error)
        setIsFormBlurred(false)
        toast.error('Login failed', {
          description: 'Invalid email or password. Please try again.',
        })
      },
    })
  }

  const onMagicLinkSubmit = async (data: MagicLinkFormValues) => {
    try {
      await authClient.signIn.magicLink(
        {
          email: data.email,
          callbackURL: `${window.location.origin}${callbackUrl}`,
        },
        {
          onSuccess: () => {
            setIsMagicLinkSent(true)
            toast.success('Magic link sent', {
              description: 'Check your email for a login link.',
            })
          },
          onError: ({ error }) => {
            toast.error('Failed to send magic link', {
              description:
                error.message || 'There was a problem sending the magic link',
            })
          },
        }
      )
    } catch (error) {
      console.error(error)
      toast.error('Failed to send magic link', {
        description:
          'There was a problem sending the magic link. Please try again.',
      })
    }
  }

  // Handle GitHub login
  const handleGithubLogin = async () => {
    setIsGithubLoading(true)
    await authClient.signIn.social(
      {
        provider: 'github',
        callbackURL: window.location.origin,
      },
      {
        onError: ({ error }) => {
          console.error(error)
          toast.error('GitHub login failed', {
            description: 'Could not authenticate with GitHub.',
          })

          setIsGithubLoading(false)
        },
      }
    )
  }

  // Handle Google login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    await authClient.signIn.social(
      {
        provider: 'google',
        callbackURL: window.location.origin,
      },
      {
        onError: ({ error }) => {
          console.error(error)
          toast.error('Google login failed', {
            description: 'Could not authenticate with Google.',
          })

          setIsGoogleLoading(false)
        },
      }
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center p-4'>
      <Card className={`w-full max-w-md border-orange-200 relative ${isFormBlurred ? 'blur-sm' : ''}`}>
        <CardHeader className='text-center'>
          <div className='mx-auto rounded-full flex items-center justify-center'>
            <Image src='/logo.jpg' alt='Creators Cloud' width={48} height={48} />
          </div>
          <CardTitle className='text-2xl font-bold text-orange-700'>
            Login
          </CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-6'>
            <div className='grid grid-cols-2 gap-4 hidden'>
              <Button
                variant='outline'
                type='button'
                className='border-orange-200'
                onClick={handleGithubLogin}
                disabled={isGithubLoading}
              >
                {isGithubLoading ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Github className='mr-2 h-4 w-4' />
                )}
                GitHub
              </Button>
              <Button
                variant='outline'
                type='button'
                className='border-orange-200'
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <svg className='mr-2 h-4 w-4' viewBox='0 0 24 24'>
                    <path
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                      fill='#4285F4'
                    />
                    <path
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                      fill='#34A853'
                    />
                    <path
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                      fill='#FBBC05'
                    />
                    <path
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                      fill='#EA4335'
                    />
                    <path d='M1 1h22v22H1z' fill='none' />
                  </svg>
                )}
                Google
              </Button>
            </div>
            <div className='relative hidden'>
              <div className='absolute inset-0 flex items-center'>
                <Separator className='w-full' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-white px-2 text-muted-foreground'>
                  Or continue with
                </span>
              </div>
            </div>

            <Tabs defaultValue='password' className='w-full'>
              <TabsList className='grid w-full grid-cols-2 hidden'>
                <TabsTrigger value='password'>Password</TabsTrigger>
                <TabsTrigger value='magic-link'>Magic Link</TabsTrigger>
              </TabsList>

              <TabsContent value='password' className='mt-4'>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className='space-y-4'
                  >
                    <FormField
                      control={form.control}
                      name='email'
                      rules={{
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='name@example.com'
                              {...field}
                              className='border-orange-200 focus-visible:ring-orange-500'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='password'
                      rules={{
                        required: 'Password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters',
                        },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <div className='flex items-center justify-between'>
                            <FormLabel>Password</FormLabel>
                            <Link
                              href='/auth/forgot-password'
                              className='text-xs text-orange-600 hover:underline'
                            >
                              Forgot password?
                            </Link>
                          </div>
                          <FormControl>
                            <Input
                              type='password'
                              autoComplete='current-password'
                              {...field}
                              className='border-orange-200 focus-visible:ring-orange-500'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type='submit'
                      className='w-full bg-orange-600 hover:bg-orange-700'
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Logging in...
                        </>
                      ) : (
                        'Login with Password'
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value='magic-link' className='mt-4'>
                {!isMagicLinkSent ? (
                  <Form {...magicLinkForm}>
                    <form
                      onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)}
                      className='space-y-4'
                    >
                      <div className='bg-orange-50 p-3 rounded-md mb-4 text-sm text-orange-700 border border-orange-100'>
                        <p>
                          We&apos;ll send you a magic link to your email. Click the
                          link to login without a password.
                        </p>
                      </div>
                      <FormField
                        control={magicLinkForm.control}
                        name='email'
                        rules={{
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                          },
                        }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type='email'
                                placeholder='name@example.com'
                                autoComplete='email'
                                {...field}
                                className='border-orange-200 focus-visible:ring-orange-500'
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type='submit'
                        className='w-full bg-orange-600 hover:bg-orange-700'
                        disabled={isMagicLinkSubmitting}
                      >
                        {isMagicLinkSubmitting ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Sending magic link...
                          </>
                        ) : (
                          <>
                            <Wand2 className='mr-2 h-4 w-4' />
                            Send Magic Link
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <div className='space-y-4'>
                    <div className='bg-green-50 p-4 rounded-md border border-green-100 text-green-700'>
                      <h3 className='font-medium text-green-800 mb-1'>
                        Magic link sent!
                      </h3>
                      <p className='text-sm'>
                        We&apos;ve sent a magic link to your email. Check your inbox
                        and click the link to login instantly.
                      </p>
                    </div>
                    <div className='text-sm text-gray-500'>
                      <p>
                        Didn&apos;t receive the email? Check your spam folder or try
                        again in a few minutes.
                      </p>
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      className='w-full border-orange-200'
                      onClick={() => setIsMagicLinkSent(false)}
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
        <CardFooter className='flex flex-col space-y-4 pt-0'>
          <div className='text-center text-sm'>
            Don&apos;t have an account?{' '}
            <Link
              href='/auth/register'
              className='text-orange-600 hover:underline'
            >
              Register
            </Link>
          </div>
          <Link
            href='/'
            className='text-orange-600 hover:underline text-sm flex items-center justify-center'
          >
            <ArrowLeft className='mr-1 h-3 w-3' />
            Back to home
          </Link>
        </CardFooter>
      </Card>
      {isFormBlurred && (
        <div className='absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-lg'>
          <div className='text-center'>
            <Loader2 className='h-8 w-8 animate-spin mx-auto text-orange-500' />
            <p className='mt-2 text-orange-700 text-sm'>Logging in...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Main exported component wrapped in Suspense
export default function Login() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center p-4'>
          <div className='text-center'>
            <Loader2 className='h-8 w-8 animate-spin mx-auto text-orange-500' />
            <p className='mt-2 text-orange-700'>Loading...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
