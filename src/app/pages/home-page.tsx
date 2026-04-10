import { motion } from "motion/react";
import { Link } from "react-router";
import {
  Target, Shield, Users, TrendingUp, CheckCircle2, ArrowRight,
  Brain, Heart, Lightbulb, Award, Lock, Zap, Star, MessageCircle,
  BookOpen, Trophy, GraduationCap,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

function MentorshipIllustration() {
  return (
    <div className="relative w-full aspect-[4/3] flex items-center justify-center p-6">
      <div className="absolute inset-0 rounded-2xl bg-white/5" />
      <div className="relative w-full h-full flex items-end justify-center gap-8 pb-4">
        {/* Mentor figure */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 border-4 border-white/30 flex items-center justify-center shadow-xl">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#00A651] rounded-full flex items-center justify-center border-2 border-white/40">
              <span className="text-white text-[9px] font-bold">M</span>
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/20">
            <p className="text-white text-xs font-semibold">Mentor</p>
            <p className="text-white/60 text-[10px]">Brian K.</p>
          </div>
        </div>

        {/* Center connection */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
            <div className="flex flex-col gap-2">
              {[
                { icon: Target, label: "Goals Set", val: "12" },
                { icon: TrendingUp, label: "Progress", val: "87%" },
                { icon: Trophy, label: "Badges", val: "5" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#00A651]/80 flex items-center justify-center">
                    <item.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-white/70 text-[10px]">{item.label}</span>
                  <span className="text-white text-[10px] font-bold ml-auto">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 h-0.5 bg-white/30 rounded" />
            <MessageCircle className="w-4 h-4 text-white/50" />
            <div className="w-8 h-0.5 bg-white/30 rounded" />
          </div>
        </div>

        {/* Mentee figure */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 border-4 border-white/30 flex items-center justify-center shadow-xl">
              <BookOpen className="w-9 h-9 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white/40">
              <span className="text-white text-[9px] font-bold">Y</span>
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/20">
            <p className="text-white text-xs font-semibold">Mentee</p>
            <p className="text-white/60 text-[10px]">IronWill</p>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute top-4 left-4 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-green-300" />
          <span className="text-white text-xs font-medium">Verified Mentors</span>
        </div>
      </div>
      <div className="absolute top-4 right-4 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
        <div className="flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-blue-300" />
          <span className="text-white text-xs font-medium">100% Private</span>
        </div>
      </div>
    </div>
  );
}

const stats = [
  { label: "Active Mentors", value: "500+", icon: Users },
  { label: "Young Men Mentored", value: "2,000+", icon: Target },
  { label: "Success Rate", value: "95%", icon: TrendingUp },
  { label: "Cities Covered", value: "15+", icon: Award },
];

const features = [
  { icon: Users,     title: "Expert Mentor Matching",  description: "Get paired with experienced mentors who align with your goals, interests, and career aspirations.", color: "from-[#00A651] to-[#006B3C]" },
  { icon: Lock,      title: "Anonymous & Safe",         description: "Discuss sensitive topics freely with our anonymous username system that protects your privacy.", color: "from-[#2E7D32] to-[#00A651]" },
  { icon: Brain,     title: "Personal Growth Tracking", description: "Monitor your progress, set goals, and achieve measurable development with mentor feedback.", color: "from-[#4CAF50] to-[#2E7D32]" },
  { icon: Heart,     title: "Mental Health Support",    description: "Get guidance on anxiety, stress, and identity struggles from mentors who truly care.", color: "from-[#00A651] to-[#4CAF50]" },
  { icon: Lightbulb, title: "Career Guidance",          description: "Navigate education decisions, career paths, and professional growth with expert advice.", color: "from-[#006B3C] to-[#2E7D32]" },
  { icon: Zap,       title: "Accountability System",    description: "Stay committed to your goals with regular check-ins and peer accountability groups.", color: "from-[#2E7D32] to-[#006B3C]" },
];

const values = [
  { title: "Discipline",  description: "Building habits and self-control necessary for success", icon: Target },
  { title: "Integrity",   description: "Promoting honesty, responsibility, and ethical leadership", icon: Shield },
  { title: "Brotherhood", description: "Creating supportive communities of men who uplift one another", icon: Users },
  { title: "Growth",      description: "Encouraging continuous learning and personal development", icon: TrendingUp },
];

const testimonials = [
  { name: "David K.", role: "University Student, 21", quote: "LeadHouse helped me overcome my addiction to gaming. My mentor gave me practical strategies and held me accountable. I am now focused on my studies.", stars: 5 },
  { name: "James M.", role: "Career Seeker, 19",      quote: "I was lost after high school. My mentor helped me discover my passion for technology. Now I am pursuing software development with confidence.", stars: 5 },
  { name: "Brian O.", role: "Entrepreneur, 24",        quote: "The financial literacy guidance I got from my mentor changed how I think about money. I have started my first business at 24.", stars: 5 },
];

export function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-[#00A651] via-[#006B3C] to-[#2E7D32] text-white overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] bg-repeat" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-56 h-56 bg-white/5 rounded-full blur-2xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20">
                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                Empowering Young Men Since 2026
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
                Discipline.<br/>Direction.<br/>
                <span className="text-green-200">Leadership.</span>
              </h1>
              <p className="text-xl text-white/85 leading-relaxed max-w-lg">
                Connect with experienced mentors who will guide you through life's challenges, help you build discipline, and unlock your full potential.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/dashboard">
                  <Button size="lg" className="bg-white text-[#00A651] hover:bg-green-50 text-lg px-8 py-6 shadow-xl font-semibold">
                    Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button size="lg" variant="outline" className="border-2 border-white/60 text-white hover:bg-white/10 text-lg px-8 py-6 backdrop-blur-sm">
                    How It Works
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap gap-8 pt-2">
                {[{ v: "2,000+", l: "Mentees" }, { v: "500+", l: "Mentors" }, { v: "95%", l: "Success Rate" }].map(s => (
                  <div key={s.l}>
                    <p className="text-2xl font-bold">{s.v}</p>
                    <p className="text-sm text-white/70">{s.l}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
              <div className="relative rounded-3xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
                <MentorshipIllustration />
              </div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7 }}
                className="absolute -bottom-5 -left-5 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-gray-100 dark:border-gray-700">
                <div className="w-11 h-11 bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-[#006B3C] dark:text-[#00A651]">95%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Success Rate</p>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.9 }}
                className="absolute -top-5 -right-5 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-gray-100 dark:border-gray-700">
                <div className="w-11 h-11 bg-gradient-to-br from-[#2E7D32] to-[#00A651] rounded-full flex items-center justify-center shrink-0">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#006B3C] dark:text-[#00A651]">Live Mentoring</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">1-on-1 sessions</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center group">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#E8F5E9] to-[#81C784]/40 dark:from-[#00A651]/20 dark:to-[#006B3C]/20 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-[#006B3C] dark:text-[#00A651]" />
                  </div>
                  <p className="text-3xl lg:text-4xl font-extrabold text-[#006B3C] dark:text-[#00A651] mb-1">{stat.value}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 bg-gradient-to-b from-white to-[#E8F5E9] dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#E8F5E9] dark:bg-[#00A651]/20 text-[#006B3C] dark:text-[#00A651] rounded-full text-sm font-semibold mb-4">Why LeadHouse</span>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-[#006B3C] dark:text-[#00A651] mb-4">Built for Your Growth</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">A comprehensive mentorship platform designed specifically for young men seeking guidance, accountability, and personal growth.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <Card className="h-full hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 group hover:-translate-y-1">
                    <CardContent className="p-7 space-y-4">
                      <div className={"w-14 h-14 bg-gradient-to-br " + f.color + " rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg"}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{f.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{f.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#E8F5E9] dark:bg-[#00A651]/20 text-[#006B3C] dark:text-[#00A651] rounded-full text-sm font-semibold mb-4">Our Foundation</span>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-[#006B3C] dark:text-[#00A651] mb-4">Core Values</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">The principles that guide every mentorship relationship on our platform</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div key={v.title} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center group">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg mb-5">
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#006B3C] dark:text-[#00A651] mb-2">{v.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{v.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-gradient-to-b from-[#E8F5E9] to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#E8F5E9] dark:bg-[#00A651]/20 text-[#006B3C] dark:text-[#00A651] rounded-full text-sm font-semibold mb-4">Success Stories</span>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-[#006B3C] dark:text-[#00A651] mb-4">Lives Transformed</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">Real stories from young men who found their direction through LeadHouse</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-7 space-y-5">
                    <div className="flex gap-1">
                      {Array.from({ length: t.stars }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-[#00A651] text-[#00A651]" />
                      ))}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic text-sm">"{t.quote}"</p>
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00A651] to-[#006B3C] flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS PREVIEW */}
      <section className="py-24 bg-gradient-to-br from-[#00A651] to-[#006B3C] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] bg-repeat" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-white/15 rounded-full text-sm font-semibold mb-4">Simple Process</span>
            <h2 className="text-3xl lg:text-5xl font-extrabold mb-4">Getting Started is Easy</h2>
            <p className="text-xl text-white/85 max-w-2xl mx-auto">Join thousands of young men who are transforming their lives through mentorship.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              { step: "01", title: "Create Your Profile", desc: "Sign up with an anonymous username and share your goals", icon: Users },
              { step: "02", title: "Get Matched",         desc: "We pair you with the perfect mentor based on your needs", icon: Target },
              { step: "03", title: "Start Growing",       desc: "Begin your transformation journey with guided mentorship", icon: TrendingUp },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                  className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center hover:bg-white/15 transition-colors">
                  <div className="text-6xl font-black text-white/15 absolute top-4 right-6">{item.step}</div>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-bold text-xl mb-2">{item.title}</h4>
                  <p className="text-white/80 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
          <div className="text-center">
            <Link to="/how-it-works">
              <Button size="lg" className="bg-white text-[#00A651] hover:bg-green-50 text-lg px-10 py-6 shadow-xl font-semibold">
                Learn More <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-3xl flex items-center justify-center mx-auto shadow-xl">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-[#006B3C] dark:text-[#00A651]">Ready to Transform Your Life?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Join LeadHouse today and connect with mentors who will help you build the disciplined, purpose-driven life you deserve.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button size="lg" className="bg-[#00A651] hover:bg-[#006B3C] text-white text-lg px-10 py-6 shadow-xl font-semibold">
                  Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="border-2 border-[#00A651] text-[#00A651] hover:bg-[#E8F5E9] dark:hover:bg-[#00A651]/10 text-lg px-10 py-6 font-semibold">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">*Users under 18 require parental or guardian consent</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
