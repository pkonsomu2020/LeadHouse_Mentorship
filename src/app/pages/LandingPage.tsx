﻿import { motion } from "motion/react";
import { Link } from "react-router";
import {
  ArrowRight, CheckCircle2, Users, Target, TrendingUp, Award, Shield,
  Lock, Brain, Heart, Lightbulb, Zap, Star, MessageCircle, BookOpen,
  Trophy, GraduationCap, Clock, DollarSign, Smartphone, Check,
  ChevronDown, ChevronUp, HelpCircle, User,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useState } from "react";

// â"€â"€ Reusable section label â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
function SectionLabel({ text }: { text: string }) {
  return (
    <span className="inline-block px-4 py-1.5 bg-[#E8F5E9] dark:bg-[#00A651]/20 text-[#006B3C] dark:text-[#00A651] rounded-full text-sm font-semibold mb-4">
      {text}
    </span>
  );
}

// â"€â"€ Hero illustration â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
function HeroIllustration() {
  return (
    <div className="relative w-full aspect-[4/3] flex items-center justify-center p-6">
      <div className="absolute inset-0 rounded-2xl bg-white/5" />
      <div className="relative w-full h-full flex items-end justify-center gap-6 pb-4">
        {/* Mentor */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 border-4 border-white/30 flex items-center justify-center shadow-xl">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#00A651] rounded-full flex items-center justify-center border-2 border-white/40">
              <span className="text-white text-[9px] font-bold">M</span>
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/20 text-center">
            <p className="text-white text-xs font-semibold">Mentor</p>
            <p className="text-white/60 text-[10px]">Brian K.</p>
          </div>
        </div>
        {/* Dashboard card */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl min-w-[140px]">
            {[{ icon: Target, label: "Goals Set", val: "12" }, { icon: TrendingUp, label: "Progress", val: "87%" }, { icon: Trophy, label: "Badges", val: "5" }].map(item => (
              <div key={item.label} className="flex items-center gap-2 mb-2 last:mb-0">
                <div className="w-6 h-6 rounded-lg bg-[#00A651]/80 flex items-center justify-center">
                  <item.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-white/70 text-[10px]">{item.label}</span>
                <span className="text-white text-[10px] font-bold ml-auto">{item.val}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 h-0.5 bg-white/30 rounded" />
            <MessageCircle className="w-4 h-4 text-white/50" />
            <div className="w-8 h-0.5 bg-white/30 rounded" />
          </div>
        </div>
        {/* Mentee */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 border-4 border-white/30 flex items-center justify-center shadow-xl">
              <BookOpen className="w-9 h-9 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white/40">
              <span className="text-white text-[9px] font-bold">Y</span>
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/20 text-center">
            <p className="text-white text-xs font-semibold">Mentee</p>
            <p className="text-white/60 text-[10px]">IronWill</p>
          </div>
        </div>
      </div>
      <div className="absolute top-4 left-4 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
        <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-300" /><span className="text-white text-xs font-medium">Verified Mentors</span></div>
      </div>
      <div className="absolute top-4 right-4 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
        <div className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-blue-300" /><span className="text-white text-xs font-medium">100% Private</span></div>
      </div>
    </div>
  );
}

// â"€â"€ Data â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const features = [
  { icon: Users,     title: "Expert Mentor Matching",  desc: "Get paired with experienced mentors who align with your goals, interests, and career aspirations.", color: "from-[#00A651] to-[#006B3C]" },
  { icon: Lock,      title: "Anonymous & Safe",         desc: "Discuss sensitive topics freely with our anonymous username system that protects your privacy.", color: "from-[#2E7D32] to-[#00A651]" },
  { icon: Brain,     title: "Personal Growth Tracking", desc: "Monitor your progress, set goals, and achieve measurable development with mentor feedback.", color: "from-[#4CAF50] to-[#2E7D32]" },
  { icon: Heart,     title: "Mental Health Support",    desc: "Get guidance on anxiety, stress, and identity struggles from mentors who truly care.", color: "from-[#00A651] to-[#4CAF50]" },
  { icon: Lightbulb, title: "Career Guidance",          desc: "Navigate education decisions, career paths, and professional growth with expert advice.", color: "from-[#006B3C] to-[#2E7D32]" },
  { icon: Zap,       title: "Accountability System",    desc: "Stay committed to your goals with regular check-ins and peer accountability groups.", color: "from-[#2E7D32] to-[#006B3C]" },
];

const challenges = [
  { icon: Smartphone, title: "Digital Discipline",   desc: "Break free from social media addiction and digital dependency." },
  { icon: Heart,      title: "Mental Health",         desc: "Find support for anxiety, depression, and identity struggles." },
  { icon: DollarSign, title: "Financial Literacy",    desc: "Learn budgeting, saving, entrepreneurship, and wealth building." },
  { icon: Users,      title: "Relationships",         desc: "Navigate healthy friendships, dating, and masculinity." },
  { icon: Target,     title: "Self-Discipline",        desc: "Build daily routines, focus, and lasting habit formation." },
  { icon: Brain,      title: "Personal Development",   desc: "Develop critical thinking, leadership, and emotional intelligence." },
];

const steps = [
  { n: "01", title: "Create Your Profile",  desc: "Sign up with an anonymous username. Share your interests and goals while keeping your identity private.", icon: Users },
  { n: "02", title: "Get Matched",          desc: "Our system pairs you with experienced mentors based on your career field, interests, and location.", icon: Target },
  { n: "03", title: "Engage & Connect",     desc: "Start meaningful conversations through one-on-one sessions, group discussions, and accountability check-ins.", icon: MessageCircle },
  { n: "04", title: "Track Your Growth",    desc: "Monitor progress with goal tracking, milestone achievements, and regular mentor feedback.", icon: TrendingUp },
];

const mentorTypes = [
  { icon: Users,      title: "Professionals",      desc: "Corporate leaders sharing workplace wisdom" },
  { icon: Lightbulb,  title: "Entrepreneurs",      desc: "Business owners guiding aspiring founders" },
  { icon: Award,      title: "Skilled Tradesmen",  desc: "Experienced craftsmen mentoring in technical skills" },
  { icon: Heart,      title: "Community Leaders",  desc: "Local leaders building strong connections" },
  { icon: GraduationCap, title: "Coaches & Educators", desc: "Teachers and coaches developing potential" },
];

const testimonials = [
  { name: "David K.", role: "University Student, 21", quote: "LeadHouse helped me overcome my addiction to gaming. My mentor gave me practical strategies and held me accountable. I am now focused on my studies and future.", stars: 5 },
  { name: "James M.", role: "Career Seeker, 19",      quote: "I was lost after high school. My mentor helped me discover my passion for technology. Now I am pursuing software development with confidence.", stars: 5 },
  { name: "Brian O.", role: "Entrepreneur, 24",        quote: "The financial literacy guidance I got from my mentor changed how I think about money. I have started my first business at 24.", stars: 5 },
];

const pricing = [
  { name: "Monthly",   price: "KES 500",   period: "/month",   desc: "Perfect for getting started", popular: false, color: "from-[#4CAF50] to-[#2E7D32]",
    features: ["One-on-one mentor matching", "Unlimited messaging", "Monthly accountability sessions", "Access to resource library", "Progress tracking tools", "Goal setting features"] },
  { name: "Quarterly", price: "KES 1,350", period: "/3 months", desc: "Best value for committed growth", popular: true, color: "from-[#00A651] to-[#006B3C]",
    features: ["Everything in Monthly", "Save 10% on monthly price", "Priority mentor matching", "Bi-weekly check-ins", "Exclusive workshops", "Peer accountability groups"] },
  { name: "Annual",    price: "KES 4,800", period: "/year",     desc: "Maximum savings for long-term growth", popular: false, color: "from-[#2E7D32] to-[#006B3C]",
    features: ["Everything in Quarterly", "Save 20% on monthly price", "VIP mentor selection", "Weekly check-ins", "Premium workshops & events", "Certificate of completion"] },
];

const faqs = [
  { q: "Is there a free trial?",                  a: "Yes! New users get a 7-day free trial to experience the platform and connect with a mentor before committing to a subscription." },
  { q: "Can I cancel my subscription anytime?",   a: "Absolutely. You can cancel at any time. Your access continues until the end of your billing period." },
  { q: "What if I am under 18?",                  a: "Users under 18 require parental or guardian consent before accessing mentorship services. We guide you through the consent process during sign-up." },
  { q: "How do I pay with M-Pesa?",               a: "During checkout, select M-Pesa as your payment method. You will receive a prompt on your phone to authorize the payment." },
  { q: "Can I switch mentors?",                   a: "Yes! If your current mentor is not the right fit, you can request a new match at any time through your dashboard." },
  { q: "Are mentor sessions private?",            a: "Yes, all one-on-one sessions are completely private. We use anonymous usernames and conversations are confidential." },
];
export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number|null>(null);
  return (
    <div className="overflow-hidden">

      {/* â•â•â• HERO â•â•â• */}
      <section id="hero" className="relative bg-white dark:bg-gray-950 overflow-hidden min-h-[92vh] flex items-center pt-20">
        {/* Subtle green tint blobs */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-[#00A651]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-[#00A651]/6 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E8F5E9]/60 dark:bg-[#00A651]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-28 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div initial={{opacity:0,x:-50}} animate={{opacity:1,x:0}} transition={{duration:0.8}} className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-[#006B3C] dark:text-[#00A651] break-words">
                LeadHouse<br/>Mentorship.
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg overflow-wrap-anywhere">Connect with experienced mentors who will guide you through life challenges, help you build discipline, and unlock your full potential.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-[#00A651] hover:bg-[#006B3C] text-white text-lg px-8 py-6 shadow-xl font-semibold">
                    Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <button onClick={()=>document.getElementById("how-it-works")?.scrollIntoView({behavior:"smooth"})}>
                  <Button size="lg" variant="outline" className="border-2 border-[#00A651] text-[#006B3C] dark:text-[#00A651] hover:bg-[#E8F5E9] dark:hover:bg-[#00A651]/10 text-lg px-8 py-6">
                    How It Works
                  </Button>
                </button>
              </div>
              <div className="flex flex-wrap gap-8 pt-2">
                {[{v:"2,000+",l:"Mentees"},{v:"500+",l:"Mentors"},{v:"95%",l:"Success Rate"}].map(s=>(
                  <div key={s.l}>
                    <p className="text-2xl font-bold text-[#006B3C] dark:text-[#00A651]">{s.v}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{s.l}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{duration:0.8,delay:0.2}} className="relative">
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#00A651] via-[#006B3C] to-[#2E7D32] shadow-2xl border border-[#00A651]/20">
                <HeroIllustration />
              </div>
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.7}} className="hidden sm:flex absolute -bottom-5 -left-5 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-3 sm:p-4 items-center gap-3 border border-gray-100 dark:border-gray-700">
                <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-full flex items-center justify-center shrink-0"><CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" /></div>
                <div><p className="text-base sm:text-lg font-bold text-[#006B3C] dark:text-[#00A651]">95%</p><p className="text-xs text-gray-500">Success Rate</p></div>
              </motion.div>
              <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{delay:0.9}} className="hidden sm:flex absolute -top-5 -right-5 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-3 sm:p-4 items-center gap-3 border border-gray-100 dark:border-gray-700">
                <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-[#2E7D32] to-[#00A651] rounded-full flex items-center justify-center shrink-0"><MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" /></div>
                <div><p className="text-xs sm:text-sm font-bold text-[#006B3C] dark:text-[#00A651]">Live Mentoring</p><p className="text-xs text-gray-500">1-on-1 sessions</p></div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* â•â•â• ABOUT â•â•â• */}
      <section id="about" className="py-14 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{opacity:0,x:-30}} whileInView={{opacity:1,x:0}} viewport={{once:true}} className="space-y-6">
              <SectionLabel text="About LeadHouse" />
              <h2 className="text-3xl lg:text-5xl font-extrabold text-[#006B3C] dark:text-[#00A651]">Building a Generation of Leaders</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">LeadHouse is more than a platform - it is a movement to raise disciplined, responsible, and purpose-driven men equipped to lead in their careers, families, and communities.</p>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">We connect young men aged 16-25 with experienced mentors aged 25-60 who provide wisdom, accountability, and practical life insights. Our platform addresses real challenges including career uncertainty, mental health, relationships, and personal development.</p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                {[{icon:Target,title:"Our Vision",desc:"Raise disciplined, purpose-driven men equipped to lead"},{icon:Shield,title:"Our Mission",desc:"Accessible mentorship for every young man in Kenya"}].map(v=>(
                  <div key={v.title} className="p-4 rounded-2xl bg-[#E8F5E9] dark:bg-[#00A651]/10 border border-[#00A651]/20">
                    <v.icon className="w-6 h-6 text-[#00A651] mb-2" />
                    <p className="font-bold text-[#006B3C] dark:text-[#00A651] text-sm">{v.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{v.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{opacity:0,x:30}} whileInView={{opacity:1,x:0}} viewport={{once:true}} className="grid grid-cols-2 gap-4">
              {[{v:"2,000+",l:"Young Men Mentored",icon:Users},{v:"500+",l:"Expert Mentors",icon:Award},{v:"95%",l:"Success Rate",icon:TrendingUp},{v:"15+",l:"Cities Covered",icon:Target}].map((s,i)=>(
                <motion.div key={s.l} initial={{opacity:0,scale:0.9}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} transition={{delay:i*0.1}}
                  className="p-6 rounded-2xl bg-gradient-to-br from-[#E8F5E9] to-white dark:from-[#00A651]/10 dark:to-gray-900 border border-[#00A651]/20 text-center">
                  <s.icon className="w-8 h-8 text-[#00A651] mx-auto mb-3" />
                  <p className="text-3xl font-extrabold text-[#006B3C] dark:text-[#00A651]">{s.v}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.l}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* â•â•â• HOW IT WORKS â•â•â• */}
      <section id="how-it-works" className="py-14 bg-[#F0FBF4] dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-10">
            <SectionLabel text="Simple Process" />
            <h2 className="text-3xl lg:text-5xl font-extrabold text-[#006B3C] dark:text-[#00A651] mb-4">How LeadHouse Works</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Four simple steps from sign-up to transformation.</p>
          </motion.div>

          {/* Visual step flow */}
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-[#00A651]/20 via-[#00A651] to-[#00A651]/20" />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((s, i) => {
                const Icon = s.icon;
                const illustrations = [
                  /* Step 1 - profile creation */
                  <div className="w-full h-28 bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] dark:from-[#00A651]/20 dark:to-[#006B3C]/20 rounded-xl flex items-center justify-center gap-3 p-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-md"><User className="w-6 h-6 text-white" /></div>
                    <div className="flex-1 space-y-1.5"><div className="h-2.5 bg-[#00A651]/40 rounded-full w-3/4" /><div className="h-2 bg-[#00A651]/25 rounded-full w-1/2" /><div className="h-2 bg-[#00A651]/20 rounded-full w-2/3" /></div>
                  </div>,
                  /* Step 2 - matching */
                  <div className="w-full h-28 bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] dark:from-[#00A651]/20 dark:to-[#006B3C]/20 rounded-xl flex items-center justify-center gap-2 p-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center shadow"><GraduationCap className="w-5 h-5 text-white" /></div>
                    <div className="flex flex-col items-center gap-1"><div className="w-8 h-0.5 bg-[#00A651]" /><div className="w-5 h-5 rounded-full bg-[#00A651] flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div><div className="w-8 h-0.5 bg-[#00A651]" /></div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow"><BookOpen className="w-5 h-5 text-white" /></div>
                  </div>,
                  /* Step 3 - chat */
                  <div className="w-full h-28 bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] dark:from-[#00A651]/20 dark:to-[#006B3C]/20 rounded-xl p-4 space-y-2">
                    <div className="flex gap-2"><div className="w-6 h-6 rounded-full bg-amber-700 shrink-0" /><div className="bg-white dark:bg-gray-800 rounded-xl rounded-tl-none px-3 py-1.5 text-[10px] text-gray-600 dark:text-gray-300 shadow-sm">How can I help you today?</div></div>
                    <div className="flex gap-2 justify-end"><div className="bg-[#00A651] rounded-xl rounded-tr-none px-3 py-1.5 text-[10px] text-white shadow-sm">I need career guidance</div><div className="w-6 h-6 rounded-full bg-amber-600 shrink-0" /></div>
                  </div>,
                  /* Step 4 - progress */
                  <div className="w-full h-28 bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] dark:from-[#00A651]/20 dark:to-[#006B3C]/20 rounded-xl p-4 space-y-2">
                    {[{l:"Goals",w:"75%"},{l:"Skills",w:"60%"},{l:"Habits",w:"90%"}].map(b=>(
                      <div key={b.l} className="flex items-center gap-2"><span className="text-[10px] text-gray-500 w-10 shrink-0">{b.l}</span><div className="flex-1 h-2 bg-white/60 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-[#00A651] rounded-full" style={{width:b.w}} /></div><span className="text-[10px] font-bold text-[#006B3C] dark:text-[#00A651]">{b.w}</span></div>
                    ))}
                  </div>,
                ];
                return (
                  <motion.div key={s.n} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.12}} className="flex flex-col items-center text-center">
                    {/* Step number bubble */}
                    <div className="relative mb-4">
                      <div className="w-12 h-12 bg-[#00A651] rounded-full flex items-center justify-center text-white font-extrabold text-lg shadow-lg z-10 relative">
                        {i + 1}
                      </div>
                    </div>
                    {/* Illustration card */}
                    <div className="w-full bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-md hover:shadow-xl transition-all mb-4">
                      {illustrations[i]}
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-2xl flex items-center justify-center mb-3 shadow-md">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">{s.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[180px]">{s.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* === FOR MENTEES === */}
      <section id="for-mentees" className="py-14 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{opacity:0,x:-30}} whileInView={{opacity:1,x:0}} viewport={{once:true}} className="space-y-6">
              <SectionLabel text="For Mentees" />
              <h2 className="text-3xl lg:text-5xl font-extrabold text-[#006B3C] dark:text-[#00A651] break-words hyphens-auto">Find Your Path. Build Your Future.</h2>
              <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">Connect with experienced mentors who understand your challenges and will guide you toward becoming the man you are meant to be.</p>
              <div className="space-y-3">
                {["Anonymous username - discuss anything freely","Matched with mentors in your field of interest","Track goals and progress with your mentor","Access to resource library and challenges","Group discussions and community support"].map(item=>(
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#E8F5E9] dark:bg-[#00A651]/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-[#00A651]" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 pt-2">
                <Link to="/signup"><Button className="bg-[#00A651] hover:bg-[#006B3C] text-white px-6 py-5 font-semibold">Get Started Free <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
              </div>
            </motion.div>

            {/* Visual dashboard mockup */}
            <motion.div initial={{opacity:0,x:30}} whileInView={{opacity:1,x:0}} viewport={{once:true}} className="relative">
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* Mockup header */}
                <div className="bg-gradient-to-r from-[#00A651] to-[#006B3C] px-5 py-4 flex items-center gap-3">
                  <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-white/30" /><div className="w-3 h-3 rounded-full bg-white/30" /><div className="w-3 h-3 rounded-full bg-white/30" /></div>
                  <div className="flex-1 bg-white/20 rounded-lg h-6 flex items-center px-3"><span className="text-white/70 text-xs">leadhouse.co.ke/dashboard</span></div>
                </div>
                {/* Mockup content */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center"><BookOpen className="w-5 h-5 text-white" /></div>
                    <div><p className="font-bold text-sm text-gray-900 dark:text-white">Welcome back, IronWill ðŸ‘‹</p><p className="text-xs text-gray-500">Your mentor Brian K. is online</p></div>
                    <div className="ml-auto w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                  </div>
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[{l:"Goals",v:"4/6",c:"text-[#00A651]"},{l:"Sessions",v:"12",c:"text-blue-500"},{l:"Points",v:"340",c:"text-amber-500"}].map(s=>(
                      <div key={s.l} className="bg-[#F0FBF4] dark:bg-[#00A651]/10 rounded-xl p-3 text-center">
                        <p className={"text-xl font-extrabold " + s.c}>{s.v}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{s.l}</p>
                      </div>
                    ))}
                  </div>
                  {/* Progress bar */}
                  <div className="bg-[#F0FBF4] dark:bg-[#00A651]/10 rounded-xl p-4">
                    <div className="flex justify-between text-xs mb-2"><span className="font-semibold text-gray-700 dark:text-gray-300">Weekly Progress</span><span className="text-[#00A651] font-bold">67%</span></div>
                    <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#00A651] to-[#4CAF50] rounded-full" style={{width:"67%"}} /></div>
                  </div>
                  {/* Recent message */}
                  <div className="flex gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center shrink-0"><GraduationCap className="w-4 h-4 text-white" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">Brian K. <span className="text-gray-400 font-normal">Â· 2m ago</span></p>
                      <p className="text-xs text-gray-500 truncate">Great progress this week! Let us review your goals...</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <motion.div initial={{opacity:0,scale:0.8}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} transition={{delay:0.4}}
                className="absolute -bottom-4 -right-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-3 flex items-center gap-2 border border-gray-100 dark:border-gray-700">
                <Trophy className="w-5 h-5 text-amber-500" />
                <div><p className="text-xs font-bold text-gray-900 dark:text-white">Badge Earned!</p><p className="text-[10px] text-gray-500">Consistency Champion</p></div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* === FOR MENTORS === */}
      <section id="for-mentors" className="py-14 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-10">
            <SectionLabel text="For Mentors" />
            <h2 className="text-3xl lg:text-5xl font-extrabold text-[#006B3C] dark:text-[#00A651] mb-4">Shape the Next Generation</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">Use your experience and wisdom to guide young men toward disciplined, purpose-driven lives.</p>
          </motion.div>
          <div className="grid lg:grid-cols-2 gap-10 items-center mb-10">
            <motion.div initial={{opacity:0,x:-30}} whileInView={{opacity:1,x:0}} viewport={{once:true}} className="space-y-6">
              <h3 className="text-2xl font-bold text-[#006B3C] dark:text-[#00A651]">Who Can Be a Mentor?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mentorTypes.map((t,i)=>{const Icon=t.icon;return(
                  <motion.div key={t.title} initial={{opacity:0,y:10}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.08}}
                    className="flex items-start gap-3 p-4 rounded-xl bg-[#E8F5E9] dark:bg-[#00A651]/10 border border-[#00A651]/20">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div><p className="font-semibold text-[#006B3C] dark:text-[#00A651] text-sm">{t.title}</p><p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{t.desc}</p></div>
                  </motion.div>
                );})}
              </div>
            </motion.div>
            <motion.div initial={{opacity:0,x:30}} whileInView={{opacity:1,x:0}} viewport={{once:true}} className="space-y-5">
              <h3 className="text-2xl font-bold text-[#006B3C] dark:text-[#00A651]">Why Become a Mentor?</h3>
              {[
                {icon:Heart,    title:"Make Real Impact",    desc:"Transform young men lives and help build the next generation of leaders."},
                {icon:Users,    title:"Share Your Journey",  desc:"Use your life experience to guide others who face similar challenges."},
                {icon:TrendingUp,title:"Personal Growth",   desc:"Enhance your leadership and communication skills while giving back."},
                {icon:Clock,    title:"Flexible Commitment", desc:"Choose mentorship formats and schedules that fit your lifestyle."},
              ].map((b,i)=>{const Icon=b.icon;return(
                <motion.div key={b.title} initial={{opacity:0,x:20}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:i*0.1}}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-[#E8F5E9] dark:hover:bg-[#00A651]/10 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-xl flex items-center justify-center shrink-0 shadow-md">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div><p className="font-bold text-gray-900 dark:text-white">{b.title}</p><p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{b.desc}</p></div>
                </motion.div>
              );})}
              <div className="pt-4">
                <Link to="/signup"><Button className="bg-[#00A651] hover:bg-[#006B3C] text-white px-8 py-5 text-base font-semibold shadow-lg">Apply to Become a Mentor <ArrowRight className="ml-2 w-5 h-5" /></Button></Link>
              </div>
            </motion.div>
          </div>
          {/* Requirements */}
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="bg-gradient-to-br from-[#E8F5E9] to-white dark:from-[#00A651]/10 dark:to-gray-900 rounded-3xl p-8 border border-[#00A651]/20">
            <h3 className="text-xl font-bold text-[#006B3C] dark:text-[#00A651] mb-6 text-center">Mentor Requirements</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {["Age 25-60 years","Life or professional experience in relevant fields","Commitment to guiding young men","Pass background screening","Complete mentor onboarding training","Minimum 2-4 hours per month"].map((r,i)=>(
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#00A651] shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{r}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* === PRICING === */}
      <section id="pricing" className="py-14 bg-gradient-to-b from-[#E8F5E9] to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-6">
            <SectionLabel text="Pricing" />
            <h2 className="text-3xl lg:text-5xl font-extrabold text-[#006B3C] dark:text-[#00A651] mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">Invest in your future with affordable mentorship plans.</p>
          </motion.div>
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00A651]/10 dark:bg-[#00A651]/20 rounded-full border border-[#00A651]/30">
              <Trophy className="w-4 h-4 text-[#00A651]" />
              <span className="text-sm font-semibold text-[#006B3C] dark:text-[#00A651]">7-Day Free Trial for All New Users</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            {pricing.map((tier,i)=>(
              <motion.div key={tier.name} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}}
                className={"relative " + (tier.popular ? "md:-mt-4 md:mb-4" : "")}>
                {tier.popular && (
                  <div className="absolute -top-5 left-0 right-0 flex justify-center">
                    <div className="bg-gradient-to-r from-[#00A651] to-[#006B3C] text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">Most Popular</div>
                  </div>
                )}
                <Card className={"h-full border-2 " + (tier.popular ? "border-[#00A651] shadow-2xl dark:border-[#00A651]" : "border-gray-200 dark:border-gray-700")}>
                  <div className={"bg-gradient-to-br " + tier.color + " text-white p-8 rounded-t-lg"}>
                    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                    <div className="flex items-baseline mb-3"><span className="text-5xl font-bold">{tier.price}</span><span className="text-xl ml-2 text-white/80">{tier.period}</span></div>
                    <p className="text-white/90 text-sm">{tier.desc}</p>
                  </div>
                  <CardContent className="p-8 space-y-6 bg-white dark:bg-gray-900 rounded-b-lg">
                    <ul className="space-y-3">
                      {tier.features.map(f=>(
                        <li key={f} className="flex items-start gap-3"><Check className="w-5 h-5 text-[#00A651] shrink-0 mt-0.5" /><span className="text-gray-700 dark:text-gray-300 text-sm">{f}</span></li>
                      ))}
                    </ul>
                    <Link to="/signup" className="block">
                      <Button className={"w-full text-base py-5 " + (tier.popular ? "bg-[#00A651] hover:bg-[#006B3C]" : "bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600")}>
                        Get Started <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          {/* Payment methods */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {[{icon:Smartphone,label:"M-Pesa"},{icon:DollarSign,label:"Card Payments"}].map(m=>{const Icon=m.icon;return(
              <div key={m.label} className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="w-9 h-9 bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-lg flex items-center justify-center"><Icon className="w-5 h-5 text-white" /></div>
                <span className="font-semibold text-gray-800 dark:text-white text-sm">{m.label}</span>
              </div>
            );})}
          </div>
          {/* FAQ */}
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <HelpCircle className="w-10 h-10 text-[#00A651] mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-[#006B3C] dark:text-[#00A651]">Frequently Asked Questions</h3>
            </div>
            <div className="space-y-3">
              {faqs.map((faq,i)=>(
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button onClick={()=>setOpenFaq(openFaq===i?null:i)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">{faq.q}</span>
                    {openFaq===i ? <ChevronUp className="w-5 h-5 text-[#00A651] shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                  </button>
                  {openFaq===i && (
                    <div className="px-6 pb-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-3">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* === FINAL CTA === */}
      <section className="py-14 bg-white dark:bg-gray-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00A651]/6 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00A651]/5 rounded-full blur-2xl" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-3xl flex items-center justify-center mx-auto shadow-xl">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-[#006B3C] dark:text-[#00A651]">Ready to Transform Your Life?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Join LeadHouse today and connect with mentors who will help you build the disciplined, purpose-driven life you deserve.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="bg-[#00A651] hover:bg-[#006B3C] text-white text-lg px-10 py-6 shadow-xl font-semibold">
                  Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <button onClick={()=>document.getElementById("pricing")?.scrollIntoView({behavior:"smooth"})}>
                <Button size="lg" variant="outline" className="border-2 border-[#00A651] text-[#006B3C] dark:text-[#00A651] hover:bg-[#E8F5E9] dark:hover:bg-[#00A651]/10 text-lg px-10 py-6">
                  View Pricing
                </Button>
              </button>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">*Users under 18 require parental or guardian consent</p>
          </motion.div>
        </div>
      </section>

    </div>
  );
}

