import Link from 'next/link';
import { ArrowRight, Bitcoin, CreditCard, Zap, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">CX</span>
            </div>
            <span className="font-bold text-xl text-slate-900">Clexpay</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">Features</Link>
            <Link href="#crypto" className="text-sm font-medium text-slate-600 hover:text-slate-900">Crypto</Link>
            <Link href="#bills" className="text-sm font-medium text-slate-600 hover:text-slate-900">Bills</Link>
            <Link href="#giftcards" className="text-sm font-medium text-slate-600 hover:text-slate-900">Gift Cards</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
                <Zap className="h-4 w-4" />
                Demo Mode Available
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                The Future of <span className="text-emerald-600">Fintech</span> is Here
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
                Trade crypto, pay bills, and send gift cards - all in one powerful platform. 
                Built for Africa, designed for everyone.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="xl" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                    Start Trading Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto">
                    Try Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything You Need</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                A complete financial platform that puts you in control of your money
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl border bg-gradient-to-br from-amber-50 to-amber-100/50">
                <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center mb-4">
                  <Bitcoin className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Crypto Trading</h3>
                <p className="text-slate-600">Buy, sell, and swap Bitcoin, Ethereum, and USDT with instant execution and low fees.</p>
              </div>
              <div className="p-6 rounded-2xl border bg-gradient-to-br from-blue-50 to-blue-100/50">
                <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Bill Payments</h3>
                <p className="text-slate-600">Pay airtime, data, electricity, cable TV, and betting bills instantly.</p>
              </div>
              <div className="p-6 rounded-2xl border bg-gradient-to-br from-purple-50 to-purple-100/50">
                <div className="h-12 w-12 rounded-xl bg-purple-500 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Gift Cards</h3>
                <p className="text-slate-600">Buy and sell gift cards from top brands worldwide at competitive rates.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Secure & Reliable</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <Shield className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Bank-Level Security</h4>
                      <p className="text-slate-600">Your funds and data are protected with industry-leading encryption and security measures.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <Zap className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Instant Transactions</h4>
                      <p className="text-slate-600">No waiting around. Your deposits, trades, and payments are processed instantly.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-6xl font-bold mb-2">$0</div>
                    <div className="text-emerald-100">Transaction Fees (Demo)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-emerald-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
              Join thousands of users who trust Clexpay for their daily financial needs
            </p>
            <Link href="/register">
              <Button size="xl" variant="outline" className="bg-white text-emerald-600 border-white hover:bg-emerald-50">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-12 bg-slate-900 text-slate-400">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">CX</span>
              </div>
              <span className="font-bold text-xl text-white">Clexpay</span>
            </div>
            <p className="text-sm">© 2024 Clexpay. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
