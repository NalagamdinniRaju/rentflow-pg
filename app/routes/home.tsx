import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuthStore } from '~/store/auth.store';
import { 
  ArrowRight, ShieldCheck, Wifi, Utensils, Sparkles, Shield, Zap, 
  ChevronLeft, ChevronRight, User, Phone, MessageCircle, Mail, MapPin,
  Home, Compass, Heart
} from 'lucide-react';

export default function HomePage() {
  const { user, initialize, initialized } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!initialized) return;
    if (user) {
      if (user.role === 'SUPER_ADMIN') navigate('/super-admin');
      else if (user.role === 'ADMIN') navigate('/admin');
      else navigate('/resident');
    }
  }, [user, initialized, navigate]);

  // Performant scroll-based animation hook
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('opacity-0', 'translate-y-8');
            entry.target.classList.add('opacity-100', 'translate-y-0');
            // Unobserve to only animate once
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.scroll-reveal').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="font-body text-on-surface bg-surface selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen pb-16 md:pb-0 flex flex-col">
      <style>{`
        .bg-hero-gradient { background: linear-gradient(135deg, #072b7e 0%, #284395 100%); }
        .glass-panel { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); }
        .scroll-reveal { transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
      
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#f7f9ff] shadow-premium">
        <nav className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <img alt="Lucky Luxury Logo" className="h-10 sm:h-14 md:h-16 w-auto object-contain shrink-0" src="/logo.png" />
            <span className="font-extrabold text-[#072b7e] font-headline text-[13px] leading-tight sm:text-xl sm:leading-normal mt-0.5 w-[110px] sm:w-auto">Lucky Luxury PG Services</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link className="text-[#072b7e] font-bold font-manrope text-sm transition-colors" to="/">Home</Link>
            <a className="text-[#444651] hover:text-[#072b7e] font-manrope text-sm transition-colors" href="#amenities">Amenities</a>
            <a className="text-[#444651] hover:text-[#072b7e] font-manrope text-sm transition-colors" href="#rooms">Rooms</a>
            <a className="text-[#444651] hover:text-[#072b7e] font-manrope text-sm transition-colors" href="#contact">Contact</a>
            
            <Link className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-bold text-sm hover:opacity-90 active:scale-95 duration-200 transition-all shadow-md" to="/register">Register</Link>
            <Link className="border border-outline-variant text-primary px-6 py-2.5 rounded-full font-bold text-sm hover:bg-surface-container-low active:scale-95 duration-200 transition-all shadow-sm bg-white" to="/login">Login</Link>
          </div>
          {/* Mobile CTA */}
          <div className="flex md:hidden items-center">
             <Link className="bg-primary text-on-primary px-5 py-2 rounded-full font-bold text-sm transition-all active:scale-95 duration-200" to="/register">Book Now</Link>
          </div>
        </nav>
      </header>

      <main className="pt-20">
        {/* Desktop Hero Section */}
        <section className="relative px-6 py-12 md:py-24 max-w-7xl mx-auto hidden md:block">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 z-10 scroll-reveal opacity-0 translate-y-8">
              <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[0.75rem] font-bold uppercase tracking-[0.05em] mb-6">Premium Living Space</span>
              <h1 className="text-[3.5rem] leading-[1.1] font-extrabold text-tertiary tracking-tight mb-6 font-headline">
                Elevated Comfort for <span className="text-primary italic">Modern Professionals.</span>
              </h1>
              <p className="text-lg text-on-surface-variant leading-relaxed mb-10 max-w-xl">
                Experience the gold standard in premium PG accommodations. We blend the privacy of home with the luxury of a boutique hotel, designed specifically for your focused lifestyle.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register" className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 hover:shadow-lg transition-all active:scale-95">
                  Register Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/login" className="border border-outline-variant text-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-surface-container-low bg-white transition-all">
                  Login to Account
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 relative scroll-reveal opacity-0 translate-y-8" style={{ transitionDelay: '0.2s' }}>
              <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-premium transform lg:rotate-3">
                <img alt="luxury studio apartment" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsWzRbVcg9Vs2reVSLsiko-p8Id06Kg3repbGpKd0k6g68aNDlaYOMFev5J9ZDXQHREY2CPshHLDjIkspKYBVmVlVWVPnpwRZi8kjng-F75eHOeaHGifzC5mXK6adkKEbs3a7jm1YYTL8-93IyZ8Pvw4TM0u7CEVc-p29-lsceepNXacNPnQweXWN6mwa_sluOSLrA1zi-rNhBbQb3Yotnqxt_VqR9jupa-eJ63K0ENpASdGno8kzry9QmO8kCqg9xE1HP7AXn6qU" />
              </div>
              <div className="absolute -bottom-6 -left-6 glass-panel p-6 rounded-2xl shadow-premium border border-white/20 hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary-fixed rounded-full">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-tertiary">Verified Premium</p>
                    <p className="text-xs text-on-surface-variant">5-Star Resident Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Hero Section */}
        <section className="px-6 py-8 md:hidden scroll-reveal opacity-0 translate-y-8">
          <div className="relative w-full rounded-xl overflow-hidden aspect-[4/5] shadow-premium">
            <img className="absolute inset-0 w-full h-full object-cover" alt="High-end modern coliving space" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7iHqGBi_WUz3p7CBR4Fi871eZfSP4MjZ2808IWFgO4baJBmyMOcJTKNQI_AXfT6c_5XIUAN9oPoCxeEAcQTQrXo-UXhgzEPOB8IPD3yU8s1CKUZoaM8pKAZqjm2o-NuMTLMjnjcEmW1jI71XUdVhgeNV98Q_H8812hnZBOrdQXuMfls3YEP4YKlpOSg4DfF6erY4z6WPrJaKVRtNsXCXXh1gJWPbeQ-OloxudJi1Iyp2mfSu8TYGlgdmfUYgyxCPT9taIKj-BO1U"/>
            <div className="absolute inset-0 bg-gradient-to-t from-tertiary via-tertiary/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 w-full z-10">
              <span className="text-on-primary-container bg-primary-container/30 backdrop-blur-md px-3 py-1 rounded-sm text-[10px] uppercase tracking-[0.1em] font-bold mb-3 inline-block">Premium Stay</span>
              <h1 className="text-white text-4xl font-extrabold leading-tight mb-4 tracking-tight font-headline">Elevated Living for Modern Professionals</h1>
              <div className="flex flex-col gap-3">
                <Link to="/register" className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-base text-center shadow-lg active:scale-95 transition-transform">Register Your Profile</Link>
                <Link to="/login" className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white py-4 rounded-xl font-bold flex justify-center text-base active:scale-95 transition-transform">Login to Dashboard</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section (Mobile/Desktop friendly) */}
        <section className="px-6 py-8 bg-surface-container-low md:hidden scroll-reveal opacity-0 translate-y-8" style={{ transitionDelay: '0.1s' }}>
          <div className="grid grid-cols-2 gap-4 max-w-7xl mx-auto">
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-premium flex flex-col items-center text-center">
              <User className="text-primary w-8 h-8 mb-2" />
              <h3 className="text-2xl font-extrabold text-tertiary">500+</h3>
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Residents</p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-premium flex flex-col items-center text-center">
              <MapPin className="text-primary w-8 h-8 mb-2" />
              <h3 className="text-2xl font-extrabold text-tertiary">50+</h3>
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Properties</p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-premium flex flex-col items-center text-center">
              <ShieldCheck className="text-primary w-8 h-8 mb-2" />
              <h3 className="text-2xl font-extrabold text-tertiary">98%</h3>
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Happiness</p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-premium flex flex-col items-center text-center">
              <Sparkles className="text-primary w-8 h-8 mb-2" />
              <h3 className="text-2xl font-extrabold text-tertiary">10+</h3>
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Awards</p>
            </div>
          </div>
        </section>

        {/* Bento Amenities Section */}
        <section className="bg-surface-container-low py-12 md:py-24 px-6 md:block" id="amenities">
          <div className="max-w-7xl mx-auto scroll-reveal opacity-0 translate-y-8">
            <div className="mb-12 md:mb-16">
              <h2 className="text-[1.75rem] font-bold text-tertiary font-headline mb-4">World-Class Amenities</h2>
              <div className="h-1 w-12 bg-primary mt-2 mb-4 rounded-full md:hidden"></div>
              <p className="text-on-surface-variant max-w-2xl">Everything you need to thrive, curated with a concierge touch to ensure you never have to worry about the small things.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {/* High Speed Wi-Fi */}
              <div className="md:col-span-2 lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-premium group hover:bg-primary transition-colors duration-300 scroll-reveal opacity-0 translate-y-8">
                <Wifi className="w-10 h-10 text-primary group-hover:text-on-primary mb-6 transition-colors" />
                <h3 className="text-xl font-bold text-tertiary group-hover:text-on-primary mb-2 transition-colors">Gigabit Wi-Fi</h3>
                <p className="text-on-surface-variant group-hover:text-primary-fixed text-sm leading-relaxed transition-colors">Dedicated high-speed connectivity for seamless remote work and streaming.</p>
              </div>
              {/* Gourmet Dining */}
              <div className="md:col-span-2 lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-premium group hover:bg-primary transition-colors duration-300 scroll-reveal opacity-0 translate-y-8" style={{ transitionDelay: '0.1s' }}>
                <Utensils className="w-10 h-10 text-primary group-hover:text-on-primary mb-6 transition-colors" />
                <h3 className="text-xl font-bold text-tertiary group-hover:text-on-primary mb-2 transition-colors">Gourmet Meals</h3>
                <p className="text-on-surface-variant group-hover:text-primary-fixed text-sm leading-relaxed transition-colors">Nutritious, chef-prepared meals served daily in our communal dining area.</p>
              </div>
              {/* Daily Housekeeping */}
              <div className="md:col-span-4 lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-premium group hover:bg-primary transition-colors duration-300 scroll-reveal opacity-0 translate-y-8" style={{ transitionDelay: '0.2s' }}>
                <Sparkles className="w-10 h-10 text-primary group-hover:text-on-primary mb-6 transition-colors" />
                <h3 className="text-xl font-bold text-tertiary group-hover:text-on-primary mb-2 transition-colors">Daily Cleaning</h3>
                <p className="text-on-surface-variant group-hover:text-primary-fixed text-sm leading-relaxed transition-colors">Meticulous housekeeping ensures your living space remains pristine.</p>
              </div>
              {/* 24/7 Security */}
              <div className="md:col-span-3 lg:col-span-3 bg-surface-container-lowest p-8 rounded-xl shadow-premium flex items-center gap-8 scroll-reveal opacity-0 translate-y-8" style={{ transitionDelay: '0.3s' }}>
                <div className="p-4 bg-surface-container-high rounded-full">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-tertiary mb-2">Biometric Security</h3>
                  <p className="text-on-surface-variant text-sm">24/7 surveillance and secure biometric access control.</p>
                </div>
              </div>
              {/* Power Backup */}
              <div className="md:col-span-1 lg:col-span-3 bg-primary-container p-8 rounded-xl shadow-premium relative overflow-hidden scroll-reveal opacity-0 translate-y-8" style={{ transitionDelay: '0.4s' }}>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-on-primary mb-2">Always Powered</h3>
                  <p className="text-on-primary-container text-sm">100% power backup for uninterrupted comfort.</p>
                </div>
                <Zap className="absolute -right-4 -bottom-4 w-40 h-40 text-white opacity-10" />
              </div>
            </div>
          </div>
        </section>

        {/* Rooms / Gallery Section */}
        <section className="py-12 md:py-24 px-6 max-w-7xl mx-auto overflow-hidden" id="rooms">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-16 gap-6 scroll-reveal opacity-0 translate-y-8">
            <div>
              <h2 className="text-[1.75rem] font-bold text-tertiary font-headline mb-4">Premium Room Categories</h2>
              <p className="text-on-surface-variant max-w-xl text-sm md:text-base">Select the configuration that suits your needs. Each room is fully furnished with premium linens and ergonomic furniture.</p>
            </div>
            <div className="hidden md:flex gap-4">
              <button className="p-3 rounded-full border border-outline-variant text-primary hover:bg-surface-container-low transition-all">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button className="p-3 rounded-full bg-primary text-on-primary hover:opacity-90 transition-all">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible gap-4 md:gap-8 pb-4 md:pb-0 scroll-reveal opacity-0 translate-y-8 snap-x snap-mandatory">
            {/* Room Card 1 */}
            <div className="group flex-none w-[85%] md:w-auto snap-center">
              <div className="relative aspect-video md:aspect-video rounded-xl overflow-hidden mb-6">
                <img alt="spacious single occupancy room" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFGZNIGSezL2fOWESITZwDsU_X73AfRUZmEldSb6jRmSBH2BI5Ivqhgj4Il5Wq6XDCn9QzEBYNC77x1Vu-4Jz_nvW9XINQ1IDpqX9n7waIMGjr36P9L73YSNpb8ApNS09PBvBKWLX51yvDr6GOiLEWWehCLL0uaOgCz_dhLVthFG1tB4WF8iz3YoklKQ_yjlav9U0Lzc44UXbJI4TNtwbpWG0b5g8OQWCNb7XiZQBC6ZkncYL6THnreIsB5z3AqvlVL0OJbxx_9Jc" />
                <div className="absolute top-4 right-4 bg-surface-container-lowest px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">Single Occupancy</div>
              </div>
              <h3 className="text-xl font-bold text-tertiary mb-2">Executive Solo Suite</h3>
              <p className="text-on-surface-variant text-sm mb-4">Full privacy with an attached balcony and dedicated workspace.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-surface-container-high rounded-sm text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">AC Room</span>
                <span className="px-3 py-1 bg-surface-container-high rounded-sm text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">Attached Bath</span>
              </div>
            </div>
            {/* Room Card 2 */}
            <div className="group flex-none w-[85%] md:w-auto snap-center">
              <div className="relative aspect-video md:aspect-video rounded-xl overflow-hidden mb-6">
                <img alt="modern double sharing room" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhtCEObK89--F-8-PAsLA68Dp2RDlXtjmclUrJ1rwDP1mUgxPhdDPWFnQA3O4Go-PPpkVgHSyl4uxV6TM1mWqQrbsp-CEmp3Y0V0r2wNI70QWEbu6NxH2V2pHaRJ-bbMhhjAkmO-kpmwiZFaZVNZzBZHXO54bT1fgKt0sQ9dyXkOEROb-BoJfj0i5DHKaSs5P6cQxW-mw-Ucdh8BLvPmUyIz9m-Sv9wIoo9zKL9tzxiExE436RYTUjj35m95tWl163WI4xncUYreQ" />
                <div className="absolute top-4 right-4 bg-surface-container-lowest px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">Double Sharing</div>
              </div>
              <h3 className="text-xl font-bold text-tertiary mb-2">Premium Shared Studio</h3>
              <p className="text-on-surface-variant text-sm mb-4">Spacious sharing arrangement without compromising on personal storage.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-surface-container-high rounded-sm text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">Luxury Beds</span>
                <span className="px-3 py-1 bg-surface-container-high rounded-sm text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">Individual Lockers</span>
              </div>
            </div>
            {/* Room Card 3 */}
            <div className="group flex-none w-[85%] md:w-auto snap-center">
              <div className="relative aspect-video md:aspect-video rounded-xl overflow-hidden mb-6">
                <img alt="ultra-premium suite room" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEYsCb0LUN4cZesCNnYdDJvDtC-1jFiD-hC9rXBQl6aHuXZDIRV1g1iIZXEbLJTDNWYP7YeDYbjj3zXeAJkpXuXu_iqQcIbGhTE5a0IjOEsQ0YDubU-dDdZOtIXxALxrIIb0mvro1TxdLDw69lX-dXP5s44V1DR7RViDqiMHAkYQZSzsLOrrsQvQnx3TUwn3EaBdmaDON_fbZJ34tzlR1jyE-M36IQqSW5mk2r4xY57iKf7QFeUxyKYPIhCtmk4zPxXxfNVtLVT_c" />
                <div className="absolute top-4 right-4 bg-surface-container-lowest px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">Elite Suite</div>
              </div>
              <h3 className="text-xl font-bold text-tertiary mb-2">Concierge Elite Penthouse</h3>
              <p className="text-on-surface-variant text-sm mb-4">Our most exclusive offering with personalized services and premium views.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-surface-container-high rounded-sm text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">Smart TV</span>
                <span className="px-3 py-1 bg-surface-container-high rounded-sm text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">Priority Support</span>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Concierge Details */}
        <section className="bg-tertiary text-on-tertiary py-12 md:py-24 px-6" id="contact">
          <div className="max-w-7xl mx-auto scroll-reveal opacity-0 translate-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-start">
              <div>
                <h2 className="text-[1.75rem] font-bold mb-6 md:mb-8 font-headline">Contact Our Concierge</h2>
                <p className="text-on-tertiary-container mb-8 md:mb-12 text-sm md:text-lg leading-relaxed">Ready to book your stay or have questions? Reach out directly to our property management team for personalized assistance.</p>
                <div className="space-y-6 md:space-y-8">
                  <div className="flex items-start gap-4 md:gap-6">
                    <div className="bg-primary-container p-3 md:p-4 rounded-xl">
                      <User className="w-5 h-5 md:w-6 md:h-6 text-on-primary" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm uppercase tracking-widest text-on-tertiary-container font-bold mb-1">General Manager</p>
                      <p className="text-lg md:text-xl font-bold">Mr. Rajesh Lucky</p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4">
                    <a className="flex-1 bg-surface-container-lowest text-primary p-5 md:p-6 rounded-xl flex items-center md:flex-col md:items-start gap-3 md:gap-2 hover:bg-primary-fixed transition-all group" href="tel:+919876543210">
                      <Phone className="w-6 h-6 md:w-8 md:h-8" />
                      <span className="font-bold text-base md:text-lg">+91 98765 43210</span>
                      <span className="hidden md:inline text-xs text-on-surface-variant font-bold uppercase tracking-wider">Click to Call</span>
                    </a>
                    <a className="flex-1 bg-[#25D366] text-white p-5 md:p-6 rounded-xl flex items-center md:flex-col md:items-start gap-3 md:gap-2 hover:opacity-90 transition-all active:scale-95" href="https://wa.me/919876543210">
                      <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />
                      <span className="font-bold text-base md:text-lg">Chat on WhatsApp</span>
                      <span className="hidden md:inline text-xs text-white/80 font-bold uppercase tracking-wider">Immediate Response</span>
                    </a>
                  </div>
                  <a className="flex items-center gap-4 md:gap-6 p-5 md:p-6 rounded-xl border border-white/10 hover:bg-white/5 transition-all w-full" href="mailto:info@luckyluxurypg.com">
                    <div className="bg-white/10 p-3 md:p-4 rounded-xl">
                      <Mail className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs md:text-sm uppercase tracking-widest text-on-tertiary-container font-bold mb-1">Official Email</p>
                      <p className="text-base md:text-lg font-bold truncate">info@luckyluxurypg.com</p>
                    </div>
                  </a>
                </div>
              </div>
              <div className="space-y-8 scroll-reveal opacity-0 translate-y-8" style={{ transitionDelay: '0.2s' }}>
                <div className="bg-white/5 rounded-[1.5rem] p-6 md:p-8 backdrop-blur-sm border border-white/10">
                  <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-3">
                    <MapPin className="w-5 h-5 md:w-6 md:h-6 text-primary-fixed" />
                    Location
                  </h3>
                  <p className="text-on-tertiary-container mb-4 md:mb-6 text-sm md:text-base leading-relaxed">
                    Lucky Luxury PG Services, Plot No. 442, Phase II, Sector 54, Gurugram, Haryana 122003
                  </p>
                  <div className="aspect-video w-full rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 shadow-premium border border-outline-variant/20">
                    <img alt="map showing location" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC31owDKoVonESMleg0msM5BTigP4BdiJUaZcZhHifTiNsGC-qbba76luOKPxa0C3NFzB3I7i9ryqmJPmkUYZRn-qmzzHb2mxPCQv6RmRiqm0gd4Zqn0BATdznw4JxaGdc8a_c4gBzk_2QH3WIM05Z5o79QaF5mtNQGMOScGkKW8P7y8MULBtinX-K_i2oxF_nyUf5dOLvfFIj8Y_TE3iMB2fOAEw_xKmSbp4gM6NisE0aB7yOpBQf_3YU8PXKDTjT_bNJhO2ZzjgU" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low w-full rounded-t-xl mt-[-10px] md:mt-0 relative z-10 scroll-reveal opacity-0 translate-y-4">
        <div className="flex flex-col items-center py-10 md:py-12 px-6 w-full space-y-4 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-2 md:mb-4">
            <img alt="Lucky Luxury Logo" className="h-12 sm:h-16 md:h-20 w-auto object-contain shrink-0" src="/logo.png" />
            <span className="font-extrabold text-[#072b7e] font-headline text-lg sm:text-2xl mt-0.5 text-center">Lucky Luxury PG Services</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-2">
            <a className="text-[#444651] hover:text-[#072b7e] font-manrope text-xs md:text-sm transition-all" href="#">Privacy Policy</a>
            <a className="text-[#444651] hover:text-[#072b7e] font-manrope text-xs md:text-sm transition-all" href="#">Terms of Service</a>
            <a className="text-[#444651] hover:text-[#072b7e] font-manrope text-xs md:text-sm transition-all" href="#">Contact Us</a>
          </div>
          <p className="text-[#444651] font-manrope text-xs md:text-sm leading-relaxed opacity-80 text-center">
            © 2024 Lucky Luxury PG Services. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-outline-variant/10 px-6 py-2 flex justify-between items-center z-50 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-safe">
        <Link to="/" className="flex flex-col items-center text-primary pt-1 pb-1 px-3">
          <Home className="w-6 h-6" strokeWidth={2.5} />
          <span className="text-[10px] font-bold mt-1">Home</span>
        </Link>
        <Link to="/register" className="flex flex-col items-center text-on-surface-variant pt-1 pb-1 px-3 active:scale-95 transition-transform">
          <Compass className="w-6 h-6" strokeWidth={2} />
          <span className="text-[10px] font-medium mt-1">Explore</span>
        </Link>
        <button className="flex flex-col items-center text-on-surface-variant pt-1 pb-1 px-3 active:scale-95 transition-transform">
          <Heart className="w-6 h-6" strokeWidth={2} />
          <span className="text-[10px] font-medium mt-1">Saved</span>
        </button>
        <Link to="/login" className="flex flex-col items-center text-on-surface-variant pt-1 pb-1 px-3 active:scale-95 transition-transform">
          <User className="w-6 h-6" strokeWidth={2} />
          <span className="text-[10px] font-medium mt-1">Profile</span>
        </Link>
      </div>
    </div>
  );
}
