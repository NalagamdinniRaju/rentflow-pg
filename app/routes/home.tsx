import { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuthStore } from '~/store/auth.store';
import {
  ArrowRight, ShieldCheck, Wifi, Utensils, Sparkles, Shield, Zap,
  ChevronLeft, ChevronRight, User, Phone, MessageCircle, Mail, MapPin,
  Home, Compass, Heart, Star, Car, Shirt, Flame
} from 'lucide-react';

export default function HomePage() {
  const { user, initialize, initialized } = useAuthStore();
  const navigate = useNavigate();

  const amenitiesRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);

  useEffect(() => {
    const el = amenitiesRef.current;
    if (!el) return;

    let animationFrameId: number;
    // Track scroll position in float for sub-pixel precision
    let scrollPos = el.scrollLeft;

    const animate = () => {
      if (!isHoveredRef.current) {
        scrollPos += 0.5; // continuous linear speed

        // Exact element where loop duplicates
        const resetNode = el.children[6] as HTMLElement;
        const resetPoint = resetNode ? resetNode.offsetLeft : el.scrollWidth / 2;

        if (scrollPos >= resetPoint) {
          scrollPos -= resetPoint;
        }

        // if user manually scrolled significantly, sync up
        if (Math.abs(scrollPos - el.scrollLeft) > 5) {
          scrollPos = el.scrollLeft;
        }

        el.scrollLeft = scrollPos;
      } else {
        // while hovering or touching, keep tracker synced with actual scroll
        scrollPos = el.scrollLeft;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const amenityCards = (
    <>
      <div className="flex-none w-[85%] sm:w-[350px] bg-surface-container-lowest p-8 rounded-2xl shadow-premium group hover:bg-primary transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border-b-4 border-transparent hover:border-white/20">
        <Wifi className="w-10 h-10 text-primary group-hover:text-on-primary mb-6 transition-colors duration-300" />
        <h3 className="text-xl font-bold text-tertiary group-hover:text-on-primary mb-3 transition-colors duration-300">High Speed 5G WiFi</h3>
        <p className="text-on-surface-variant group-hover:text-primary-container text-sm leading-relaxed transition-colors duration-300">Seamless high-speed internet for work and entertainment</p>
      </div>
      <div className="flex-none w-[85%] sm:w-[350px] bg-surface-container-lowest p-8 rounded-2xl shadow-premium group hover:bg-primary transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border-b-4 border-transparent hover:border-white/20">
        <Utensils className="w-10 h-10 text-primary group-hover:text-on-primary mb-6 transition-colors duration-300" />
        <h3 className="text-xl font-bold text-tertiary group-hover:text-on-primary mb-3 transition-colors duration-300">Meals</h3>
        <p className="text-on-surface-variant group-hover:text-primary-container text-sm leading-relaxed transition-colors duration-300">Nutritious and hygienic meals served daily. <br /><span className="block mt-2 opacity-90"><strong className="font-bold">Weekdays:</strong> Breakfast & Dinner <br /><strong className="font-bold">Weekends:</strong> Breakfast, Lunch & Dinner</span></p>
      </div>
      <div className="flex-none w-[85%] sm:w-[350px] bg-surface-container-lowest p-8 rounded-2xl shadow-premium group hover:bg-primary transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border-b-4 border-transparent hover:border-white/20">
        <Car className="w-10 h-10 text-primary group-hover:text-on-primary mb-6 transition-colors duration-300" />
        <h3 className="text-xl font-bold text-tertiary group-hover:text-on-primary mb-3 transition-colors duration-300">Parking</h3>
        <p className="text-on-surface-variant group-hover:text-primary-container text-sm leading-relaxed transition-colors duration-300">Secure and convenient parking space available for all residents.</p>
      </div>
      <div className="flex-none w-[85%] sm:w-[350px] bg-surface-container-lowest p-8 rounded-2xl shadow-premium group hover:bg-primary transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border-b-4 border-transparent hover:border-white/20">
        <Sparkles className="w-10 h-10 text-primary group-hover:text-on-primary mb-6 transition-colors duration-300" />
        <h3 className="text-xl font-bold text-tertiary group-hover:text-on-primary mb-3 transition-colors duration-300">Daily Cleaning</h3>
        <p className="text-on-surface-variant group-hover:text-primary-container text-sm leading-relaxed transition-colors duration-300">Regular housekeeping for a clean and comfortable stay.</p>
      </div>
      <div className="flex-none w-[85%] sm:w-[350px] bg-surface-container-lowest p-8 rounded-2xl shadow-premium group hover:bg-primary transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border-b-4 border-transparent hover:border-white/20">
        <Shirt className="w-10 h-10 text-primary group-hover:text-on-primary mb-6 transition-colors duration-300" />
        <h3 className="text-xl font-bold text-tertiary group-hover:text-on-primary mb-3 transition-colors duration-300">Washing Machine</h3>
        <p className="text-on-surface-variant group-hover:text-primary-container text-sm leading-relaxed transition-colors duration-300">Easy access to modern laundry facilities.</p>
      </div>
      <div className="flex-none w-[85%] sm:w-[350px] bg-surface-container-lowest p-8 rounded-2xl shadow-premium group hover:bg-primary transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border-b-4 border-transparent hover:border-white/20">
        <Flame className="w-10 h-10 text-primary group-hover:text-on-primary mb-6 transition-colors duration-300" />
        <h3 className="text-xl font-bold text-tertiary group-hover:text-on-primary mb-3 transition-colors duration-300">Hot Water</h3>
        <p className="text-on-surface-variant group-hover:text-primary-container text-sm leading-relaxed transition-colors duration-300">24/7 hot water availability for ultimate comfort.</p>
      </div>
    </>
  );

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
    <div className="font-body text-on-surface bg-surface selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen flex flex-col">
      <style>{`
        .bg-hero-gradient { background: linear-gradient(135deg, #072b7e 0%, #284395 100%); }
        .glass-panel { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); }
        .scroll-reveal { transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>

      {/* TopAppBar */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#f7f9ff] shadow-premium">
        <nav className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <img alt="Lucky Luxury Logo" className="h-10 sm:h-14 md:h-16 w-auto object-contain shrink-0 rounded-md bg-white" src="/logo.png" />
            <span className="font-extrabold text-[#072b7e] font-headline text-[13px] leading-tight sm:text-xl sm:leading-normal mt-0.5 w-[110px] sm:w-auto">Lucky Luxury PG Services</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link className="text-[#072b7e] font-bold font-manrope text-sm transition-colors" to="/">Home</Link>
            <a className="text-[#444651] hover:text-[#072b7e] font-manrope text-sm transition-colors" href="#amenities">Amenities</a>
            <a className="text-[#444651] hover:text-[#072b7e] font-manrope text-sm transition-colors" href="#flats">Flats</a>
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
            <img className="absolute inset-0 w-full h-full object-cover" alt="High-end modern coliving space" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7iHqGBi_WUz3p7CBR4Fi871eZfSP4MjZ2808IWFgO4baJBmyMOcJTKNQI_AXfT6c_5XIUAN9oPoCxeEAcQTQrXo-UXhgzEPOB8IPD3yU8s1CKUZoaM8pKAZqjm2o-NuMTLMjnjcEmW1jI71XUdVhgeNV98Q_H8812hnZBOrdQXuMfls3YEP4YKlpOSg4DfF6erY4z6WPrJaKVRtNsXCXXh1gJWPbeQ-OloxudJi1Iyp2mfSu8TYGlgdmfUYgyxCPT9taIKj-BO1U" />
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
        <section className="px-6 py-8 md:py-16 bg-surface-container-low scroll-reveal opacity-0 translate-y-8" style={{ transitionDelay: '0.1s' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-7xl mx-auto">
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-premium flex flex-col items-center text-center">
              <User className="text-primary w-8 h-8 mb-2" />
              <h3 className="text-2xl font-extrabold text-tertiary">3000+</h3>
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Residents</p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-premium flex flex-col items-center text-center">
              <MapPin className="text-primary w-8 h-8 mb-2" />
              <h3 className="text-2xl font-extrabold text-tertiary">10+</h3>
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Properties</p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-premium flex flex-col items-center text-center">
              <ShieldCheck className="text-primary w-8 h-8 mb-2" />
              <h3 className="text-2xl font-extrabold text-tertiary">98%</h3>
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Happiness</p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-premium flex flex-col items-center text-center">
              <Sparkles className="text-primary w-8 h-8 mb-2" />
              <h3 className="text-2xl font-extrabold text-tertiary">98%</h3>
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Comfort</p>
            </div>
          </div>
        </section>

        {/* Bento Amenities Section */}
        <section className="bg-surface-container-low py-12 md:py-24 px-6 md:block" id="amenities">
          <div className="max-w-7xl mx-auto scroll-reveal opacity-0 translate-y-8">
            <div className="mb-12 md:mb-16">
              <h2 className="text-[1.75rem] font-bold text-tertiary font-headline mb-4">Amenities and Services</h2>
              <div className="h-1 w-12 bg-primary mt-2 mb-4 rounded-full md:hidden"></div>
              <p className="text-on-surface-variant max-w-2xl">Everything you need to thrive, curated with a concierge touch to ensure you never have to worry about the small things.</p>
            </div>
            <div
              className="flex overflow-x-auto gap-4 md:gap-6 pb-4 md:pb-0 relative"
              ref={amenitiesRef}
              style={{ scrollbarWidth: 'none' }}
              onMouseEnter={() => isHoveredRef.current = true}
              onMouseLeave={() => isHoveredRef.current = false}
              onTouchStart={() => isHoveredRef.current = true}
              onTouchEnd={() => isHoveredRef.current = false}
            >
              {amenityCards}
              {amenityCards}
            </div>
          </div>
        </section>

        {/* Flats / Gallery Section */}
        <section className="py-12 md:py-24 px-6 max-w-7xl mx-auto overflow-hidden" id="flats">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-16 gap-6 scroll-reveal opacity-0 translate-y-8">
            <div>
              <h2 className="text-[1.75rem] font-bold text-tertiary font-headline mb-4">Available Options</h2>
              <p className="text-on-surface-variant max-w-xl text-sm md:text-base">Select the configuration that suits your needs. Each flat is fully furnished with premium linens and ergonomic furniture.</p>
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
            {/* Flat Card 1 */}
            <div className="group flex-none w-[85%] md:w-auto snap-center">
              <div className="relative aspect-video md:aspect-video rounded-xl overflow-hidden mb-6">
                <img alt="spacious single occupancy flat" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFGZNIGSezL2fOWESITZwDsU_X73AfRUZmEldSb6jRmSBH2BI5Ivqhgj4Il5Wq6XDCn9QzEBYNC77x1Vu-4Jz_nvW9XINQ1IDpqX9n7waIMGjr36P9L73YSNpb8ApNS09PBvBKWLX51yvDr6GOiLEWWehCLL0uaOgCz_dhLVthFG1tB4WF8iz3YoklKQ_yjlav9U0Lzc44UXbJI4TNtwbpWG0b5g8OQWCNb7XiZQBC6ZkncYL6THnreIsB5z3AqvlVL0OJbxx_9Jc" />
                <div className="absolute top-4 right-4 bg-surface-container-lowest px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">One Sharing</div>
              </div>
              <h3 className="text-xl font-bold text-tertiary mb-2">One Sharing</h3>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="px-3 py-1 bg-surface-container-high rounded-sm text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">AC / Non-AC</span>
                <span className="px-3 py-1 bg-surface-container-high rounded-sm text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">Attached Bathrooms</span>
              </div>
            </div>
            {/* Flat Card 2 */}
            <div className="group flex-none w-[85%] md:w-auto snap-center">
              <div className="relative aspect-video md:aspect-video rounded-xl overflow-hidden mb-6">
                <img alt="modern double sharing flat" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhtCEObK89--F-8-PAsLA68Dp2RDlXtjmclUrJ1rwDP1mUgxPhdDPWFnQA3O4Go-PPpkVgHSyl4uxV6TM1mWqQrbsp-CEmp3Y0V0r2wNI70QWEbu6NxH2V2pHaRJ-bbMhhjAkmO-kpmwiZFaZVNZzBZHXO54bT1fgKt0sQ9dyXkOEROb-BoJfj0i5DHKaSs5P6cQxW-mw-Ucdh8BLvPmUyIz9m-Sv9wIoo9zKL9tzxiExE436RYTUjj35m95tWl163WI4xncUYreQ" />
                <div className="absolute top-4 right-4 bg-surface-container-lowest px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">Two Sharing</div>
              </div>
              <h3 className="text-xl font-bold text-tertiary mb-2">Two Sharing</h3>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="px-3 py-1 bg-surface-container-high rounded-sm text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">AC / Non-AC</span>
                <span className="px-3 py-1 bg-surface-container-high rounded-sm text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">Individual Lockers</span>
              </div>
            </div>
            {/* Flat Card 3 */}
            <div className="group flex-none w-[85%] md:w-auto snap-center">
              <div className="relative aspect-video md:aspect-video rounded-xl overflow-hidden mb-6">
                <img alt="ultra-premium suite flat" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEYsCb0LUN4cZesCNnYdDJvDtC-1jFiD-hC9rXBQl6aHuXZDIRV1g1iIZXEbLJTDNWYP7YeDYbjj3zXeAJkpXuXu_iqQcIbGhTE5a0IjOEsQ0YDubU-dDdZOtIXxALxrIIb0mvro1TxdLDw69lX-dXP5s44V1DR7RViDqiMHAkYQZSzsLOrrsQvQnx3TUwn3EaBdmaDON_fbZJ34tzlR1jyE-M36IQqSW5mk2r4xY57iKf7QFeUxyKYPIhCtmk4zPxXxfNVtLVT_c" />
                <div className="absolute top-4 right-4 bg-surface-container-lowest px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">Quad Sharing</div>
              </div>
              <h3 className="text-xl font-bold text-tertiary mb-2">Quad Sharing</h3>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="px-3 py-1 bg-surface-container-high rounded-sm text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">Attached Bathrooms</span>
                <span className="px-3 py-1 bg-surface-container-high rounded-sm text-[0.7rem] font-bold text-on-surface uppercase tracking-wider">Individual Lockers</span>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="bg-surface-container-lowest py-12 md:py-24 px-6" id="reviews">
          <div className="max-w-7xl mx-auto scroll-reveal opacity-0 translate-y-8">
            <div className="mb-12 md:mb-16 text-center md:text-left">
              <h2 className="text-[1.75rem] font-bold text-tertiary font-headline mb-4">What Our Residents Say</h2>
              <div className="h-1 w-12 bg-primary mt-2 mb-4 rounded-full mx-auto md:mx-0"></div>
              <p className="text-on-surface-variant max-w-2xl mx-auto md:mx-0">Read about the premium experiences of our modern professionals who call Lucky Luxury their home.</p>
            </div>

            <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-6 pb-4 md:pb-0 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
              <div className="bg-surface-container-low p-8 rounded-xl shadow-premium min-w-[85%] md:min-w-0 snap-center">
                <div className="flex gap-1 text-primary-container mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-on-surface-variant text-sm md:text-base italic mb-8 leading-relaxed">
                  "The cleanliness and safety protocols are unmatched. The biometric security gives me peace of mind, and the food quality is excellent. A true premium experience that feels like a high-end hotel."
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="w-12 h-12 bg-primary-fixed rounded-full flex items-center justify-center font-bold text-on-primary-fixed shrink-0">
                    AA
                  </div>
                  <div>
                    <h4 className="font-bold text-tertiary">Ananya Agarwal</h4>
                    <p className="text-xs text-on-surface-variant font-medium">Software Engineer</p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-low p-8 rounded-xl shadow-premium min-w-[85%] md:min-w-0 snap-center">
                <div className="flex gap-1 text-primary-container mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-on-surface-variant text-sm md:text-base italic mb-8 leading-relaxed">
                  "Friendly management and top-notch facilities. The gigabit Wi-Fi handles all my remote work needs without a hitch, and the daily housekeeping is incredibly thorough and respectful of my workspace."
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="w-12 h-12 bg-tertiary-fixed rounded-full flex items-center justify-center font-bold text-on-tertiary-fixed shrink-0">
                    RM
                  </div>
                  <div>
                    <h4 className="font-bold text-tertiary">Rahul Menon</h4>
                    <p className="text-xs text-on-surface-variant font-medium">Product Manager</p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-low p-8 rounded-xl shadow-premium min-w-[85%] md:min-w-0 snap-center">
                <div className="flex gap-1 text-primary-container mb-6">
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                  <Star className="w-5 h-5 text-outline-variant fill-current" />
                </div>
                <p className="text-on-surface-variant text-sm md:text-base italic mb-8 leading-relaxed">
                  "Very comfortable beds and great shared spaces. The food tastes just like home, and any maintenance requests are handled almost immediately by the concierge team. Highly recommended!"
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="w-12 h-12 bg-secondary-fixed rounded-full flex items-center justify-center font-bold text-on-secondary-fixed shrink-0">
                    SK
                  </div>
                  <div>
                    <h4 className="font-bold text-tertiary">Sneha Kapoor</h4>
                    <p className="text-xs text-on-surface-variant font-medium">Data Analyst</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Concierge Details */}
        <section className="bg-tertiary text-on-tertiary py-12 md:py-24 px-6" id="contact">
          <div className="max-w-7xl mx-auto">
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
                      <p className="text-xs md:text-sm uppercase tracking-widest text-on-tertiary-container font-bold mb-1">Managers</p>
                      <p className="text-lg md:text-xl font-bold">Ramu & Shekhar</p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4">
                    <a className="flex-1 bg-surface-container-lowest text-primary p-5 md:p-6 rounded-xl flex items-center md:flex-col md:items-start gap-3 md:gap-2 hover:bg-primary-fixed transition-all group" href="tel:+919303003073">
                      <Phone className="w-6 h-6 md:w-8 md:h-8" />
                      <span className="font-bold text-base md:text-lg">+91 93030 03073</span>
                      <span className="hidden md:inline text-xs text-on-surface-variant font-bold uppercase tracking-wider">Call Ramu</span>
                    </a>
                    <a className="flex-1 bg-[#25D366] text-white p-5 md:p-6 rounded-xl flex items-center md:flex-col md:items-start gap-3 md:gap-2 hover:opacity-90 transition-all active:scale-95" href="https://wa.me/919303003073">
                      <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />
                      <span className="font-bold text-base md:text-lg">Chat with Ramu</span>
                    </a>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4">
                    <a className="flex-1 bg-surface-container-lowest text-primary p-5 md:p-6 rounded-xl flex items-center md:flex-col md:items-start gap-3 md:gap-2 hover:bg-primary-fixed transition-all group" href="tel:+919505539924">
                      <Phone className="w-6 h-6 md:w-8 md:h-8" />
                      <span className="font-bold text-base md:text-lg">+91 95055 39924</span>
                      <span className="hidden md:inline text-xs text-on-surface-variant font-bold uppercase tracking-wider">Call Shekhar</span>
                    </a>
                  </div>
                  <a className="flex items-center gap-4 md:gap-6 p-5 md:p-6 rounded-xl border border-white/10 hover:bg-white/5 transition-all w-full" href="mailto:luckyluxurypg@gmail.com">
                    <div className="bg-white/10 p-3 md:p-4 rounded-xl">
                      <Mail className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs md:text-sm uppercase tracking-widest text-on-tertiary-container font-bold mb-1">Official Email</p>
                      <p className="text-base md:text-lg font-bold truncate">luckyluxurypg@gmail.com</p>
                    </div>
                  </a>
                </div>
              </div>
              <div className="space-y-8">
                <div className="bg-white/5 rounded-[1.5rem] p-6 md:p-8 backdrop-blur-sm border border-white/10">
                  <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-3">
                    <MapPin className="w-5 h-5 md:w-6 md:h-6 text-primary-fixed" />
                    Location
                  </h3>
                  <p className="text-on-tertiary-container mb-4 md:mb-6 text-sm md:text-base leading-relaxed">
                    Lucky Luxury PG Services, Near Gold Gym, Pancard Club Road, Baner, Pune - 411045
                  </p>
                  <a href="https://maps.app.goo.gl/rymDQQpDiKdLMoiL9" target="_blank" rel="noreferrer" className="block w-full group">
                    <div className="aspect-video w-full rounded-xl overflow-hidden shadow-premium border border-outline-variant/20 relative">
                      <img alt="map showing location" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="/location.png" />
                      <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-xl"></div>
                    </div>
                  </a>
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
            <img alt="Lucky Luxury Logo" className="h-12 sm:h-16 md:h-20 w-auto object-contain shrink-0 rounded-md bg-white" src="/logo.png" />
            <span className="font-extrabold text-[#072b7e] font-headline text-lg sm:text-2xl mt-0.5 text-center">Lucky Luxury PG Services</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-2">
            <Link className="text-[#444651] hover:text-[#072b7e] font-manrope text-xs md:text-sm transition-all font-semibold" to="/privacy-policy">Privacy Policy</Link>
            <Link className="text-[#444651] hover:text-[#072b7e] font-manrope text-xs md:text-sm transition-all font-semibold" to="/terms-and-conditions">Terms & Conditions</Link>
            <a className="text-[#444651] hover:text-[#072b7e] font-manrope text-xs md:text-sm transition-all" href="#contact">Contact Us</a>
          </div>
          <p className="text-[#444651] font-manrope text-xs md:text-sm leading-relaxed opacity-80 text-center">
            © 2024 Lucky Luxury PG Services. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
