"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Shield, Code, Rocket, Sparkles, FileCode, Layers, ArrowRight, CheckCircle, Globe } from "lucide-react"
import Image from "next/image" // Import Image component

interface LandingPageProps {
  onGetStarted: () => void
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Grid background pattern */}
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: "radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 70%)",
        }}
      />

      <div className="relative z-20">
        {/* Header */}
        <header className="container mx-auto px-6 py-8">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3 animate-fade-in">
              <Image src="/images/sriox-logo.png" alt="Sriox Logo" width={120} height={32} className="h-8 w-auto" />
              <Badge variant="secondary" className="ml-2 animate-scale-in">
                <Sparkles className="h-3 w-3 mr-1" />
                Beta
              </Badge>
            </div>
            <Button
              onClick={onGetStarted} // Keep onGetStarted for Log In
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              Log In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 text-center min-h-[calc(100vh-120px)] flex flex-col justify-center">
          <div className="max-w-4xl mx-auto animate-slide-up">
            <div className="inline-flex items-center rounded-full bg-slate-800/50 px-4 py-1 text-sm font-medium text-slate-300 mb-6 border border-slate-700 animate-fade-in delay-100">
              <Sparkles className="h-4 w-4 mr-2 text-purple-400" />
              Instant Deployment Platform
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight animate-slide-up delay-200">
              Deploy Your Web Projects
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                In Seconds.
              </span>
            </h1>

            {/* Large Logo below "Instant Deployment Platform" */}
            <div className="mb-10 animate-fade-in delay-300">
              <Image
                src="/images/sriox-logo.png"
                alt="Sriox Large Logo"
                width={300}
                height={80}
                className="mx-auto h-20 w-auto"
              />
            </div>

            <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto animate-slide-up delay-300">
              Upload multiple files, edit code live, and get your custom subdomain with HTTPS.
              <br />
              **Zero configuration. Maximum speed.**
            </p>

            {/* Removed "Start Building Now" and "View Demo" buttons from hero */}
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-slate-400 text-sm animate-fade-in delay-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Multi-file support
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Automatic HTTPS
              </div>
            </div>
          </div>
        </section>

        {/* Get Started Button above Features Grid */}
        <div className="text-center mb-16 animate-fade-in delay-600">
          <Button
            size="lg"
            onClick={onGetStarted}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6 rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Features Grid */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Everything You Need
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Professional-grade features that make web deployment effortless and powerful
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FileCode,
                title: "Multi-File Support",
                description: "Upload entire projects with HTML, CSS, JS, and assets. We handle the rest.",
                color: "from-blue-500 to-cyan-500",
                delay: "delay-100",
              },
              {
                icon: Code,
                title: "Live Code Editor",
                description: "Edit your files directly in the browser with syntax highlighting and auto-save.",
                color: "from-purple-500 to-pink-500",
                delay: "delay-200",
              },
              {
                icon: Zap,
                title: "Instant Deployment",
                description: "Your site goes live in seconds with automatic builds and optimizations.",
                color: "from-yellow-500 to-orange-500",
                delay: "delay-300",
              },
              {
                icon: Globe,
                title: "Custom Subdomains",
                description: "Get your branded subdomain like yourproject.sriox.com instantly.",
                color: "from-green-500 to-emerald-500",
                delay: "delay-100",
              },
              {
                icon: Shield,
                title: "Auto HTTPS",
                description: "SSL certificates generated automatically for secure, professional sites.",
                color: "from-red-500 to-rose-500",
                delay: "delay-200",
              },
              {
                icon: Layers,
                title: "Project Management",
                description: "Organize multiple projects with version control and easy updates.",
                color: "from-indigo-500 to-purple-500",
                delay: "delay-300",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className={`glass-effect border-slate-700 hover:border-slate-600 transition-all duration-300 transform hover:scale-105 animate-fade-in ${feature.delay} group`}
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-white group-hover:text-blue-400 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400 leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Deploy in 3 Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Upload Files",
                description: "Drag and drop your project files or select them from your computer",
                icon: FileCode,
              },
              {
                step: "02",
                title: "Choose Subdomain",
                description: "Pick your custom subdomain and we'll configure everything automatically",
                icon: Globe,
              },
              {
                step: "03",
                title: "Go Live",
                description: "Your site is deployed with HTTPS and ready to share with the world",
                icon: Rocket,
              },
            ].map((step, index) => (
              <div key={index} className={`text-center animate-slide-up delay-${(index + 1) * 100}`}>
                <div className="relative mb-8">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4 animate-glow">
                    {step.step}
                  </div>
                  <step.icon className="h-8 w-8 text-blue-400 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="glass-effect rounded-3xl p-12 border border-slate-700 animate-scale-in">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Ready to Deploy?
              </h2>
              <p className="text-xl text-slate-300 mb-8">
                Join thousands of developers who trust Sriox for instant web deployment
              </p>
              <Button
                size="lg"
                onClick={onGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-12 py-6 rounded-xl transition-all duration-300 transform hover:scale-105 animate-glow"
              >
                <Rocket className="mr-2 h-5 w-5" />
                Log In to Start Building
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-12 border-t border-slate-800">
          <div className="text-center text-slate-400">
            <p>&copy; 2024 Sriox. Built for developers, by developers.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
