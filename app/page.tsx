import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

async function checkSupabase() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getSession()
    return { status: error ? 'error' : 'ok', message: error?.message }
  } catch (error) {
    return { status: 'error', message: String(error) }
  }
}

async function checkOpenAI() {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'HEAD',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    })
    return { status: response.ok ? 'ok' : 'error', message: response.statusText }
  } catch (error) {
    return { status: 'error', message: String(error) }
  }
}

async function checkStripe() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    await stripe.balance.retrieve()
    return { status: 'ok' }
  } catch (error) {
    return { status: 'error', message: String(error) }
  }
}

function checkPostHog() {
  const hasKey = !!process.env.NEXT_PUBLIC_POSTHOG_KEY
  const hasHost = !!process.env.NEXT_PUBLIC_POSTHOG_HOST
  return {
    status: hasKey && hasHost ? 'ok' : 'error',
    message: hasKey && hasHost ? undefined : 'Missing environment variables',
  }
}

export default async function Home() {
  const [supabase, openai, stripe, posthog] = await Promise.all([
    checkSupabase(),
    checkOpenAI(),
    checkStripe(),
    checkPostHog(),
  ])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl space-y-6 rounded-lg bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold">Service Status</h1>

        <ServiceStatus name="Supabase" status={supabase.status} message={supabase.message} />
        <ServiceStatus name="OpenAI" status={openai.status} message={openai.message} />
        <ServiceStatus name="Stripe" status={stripe.status} message={stripe.message} />
        <ServiceStatus name="PostHog" status={posthog.status} message={posthog.message} />

        <div className="mt-8 space-y-2 border-t pt-6">
          <h2 className="text-xl font-semibold">Quick Links</h2>
          <ul className="space-y-2">
            <li>
              <a href="/auth/signup" className="text-blue-500 hover:underline">
                Sign Up
              </a>
            </li>
            <li>
              <a href="/auth/login" className="text-blue-500 hover:underline">
                Login
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function ServiceStatus({
  name,
  status,
  message,
}: {
  name: string
  status: string
  message?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-4">
      <span className="font-medium">{name}</span>
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            status === 'ok'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {status}
        </span>
        {message && <span className="text-sm text-gray-500">{message}</span>}
      </div>
    </div>
  )
}
