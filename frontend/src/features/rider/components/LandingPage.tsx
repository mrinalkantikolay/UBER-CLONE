import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();
  return (
    <div
      className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden text-on-surface font-body antialiased selection:bg-primary-container selection:text-on-primary-container bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/landing-bg.jpg')", backgroundColor: "#0a0b10", backgroundSize: "100% 100%" }}
    >
      <style>{`
        .panel-3d {
            background: rgba(22, 24, 33, 0.6);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), inset 1px 1px 0px 0px rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            position: relative;
        }
        .moving-left-shadow::before {
            content: "";
            position: absolute;
            inset: -1px;
            padding: 2px;
            border-radius: inherit;
            background: linear-gradient(135deg, 
                transparent 30%, 
                rgba(99, 102, 241, 0.9) 45%, 
                rgba(6, 182, 212, 0.9) 55%, 
                transparent 70%
            );
            background-size: 200% 200%;
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            animation: move-beam 4s linear infinite;
            pointer-events: none;
            filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.6));
            z-index: 10;
        }
        @keyframes move-beam {
            0% { background-position: 100% 100%; }
            100% { background-position: 0% 0%; }
        }
        .input-inset {
            background: rgba(13, 14, 20, 0.5);
            box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.8), inset -1px -1px 4px rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.03);
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
        /* Premium Moving Gradient Text/Buttons */
        @keyframes gradient-x {
            0% { background-position: 0% center; }
            100% { background-position: 200% center; }
        }
        .animate-gradient-x {
            background-size: 200% auto;
            animation: gradient-x 3s linear infinite;
        }
        /* Pulsing Accent Glow for Icons */
        .accent-glow {
            background: linear-gradient(135deg, #6366f1, #ec4899);
            box-shadow: 0 0 20px rgba(236, 72, 153, 0.5), 0 0 40px rgba(99, 102, 241, 0.3);
            animation: pulse-glow 3s infinite alternate;
        }
        @keyframes pulse-glow {
            0% { box-shadow: 0 0 15px rgba(236, 72, 153, 0.4), 0 0 25px rgba(99, 102, 241, 0.2); }
            100% { box-shadow: 0 0 30px rgba(236, 72, 153, 0.8), 0 0 50px rgba(99, 102, 241, 0.6); }
        }
      `}</style>
      <div className="layout-container flex h-full grow flex-col items-center">
        <div className="w-full max-w-[1200px] flex flex-col flex-1 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="flex flex-wrap items-center justify-between py-6 mb-4 gap-4">
            <div className="flex items-center gap-4 text-primary group cursor-pointer" onClick={() => navigate('/')}>
              <div className="size-10 rounded-xl shadow-neo-raised flex items-center justify-center bg-surface-container-low text-primary flex-shrink-0 bg-gradient-to-tr from-indigo-500 to-purple-600 animate-gradient-x group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
              </div>
              <h2 className="text-2xl font-black leading-tight tracking-tight font-headline bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-600 bg-clip-text text-transparent animate-gradient-x group-hover:tracking-widest transition-all duration-500">RIDENOVA</h2>
            </div>
            <div className="flex flex-1 justify-end gap-4 md:gap-10 items-center flex-wrap">
              <nav className="flex items-center gap-4 md:gap-8 flex-wrap justify-center">
                <a className="relative text-on-surface-variant hover:text-primary transition-all duration-300 text-sm font-semibold leading-normal hover:-translate-y-0.5 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100" href="#">Home</a>
                <a className="relative text-on-surface-variant hover:text-primary transition-all duration-300 text-sm font-semibold leading-normal hover:-translate-y-0.5 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100 cursor-pointer" onClick={() => navigate('/driver/login')}>Drivers</a>
                <a onClick={() => navigate('/login')} className="relative cursor-pointer text-on-surface-variant hover:text-primary transition-all duration-300 text-sm font-semibold leading-normal hover:-translate-y-0.5 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100">Log In</a>
              </nav>
            </div>
          </header>

          <main className="flex flex-col flex-1 @container gap-16 md:gap-20 pb-20 w-full overflow-hidden">
            {/* Hero Section */}
            <div className="rounded-[2.5rem] panel-3d moving-left-shadow p-4 md:p-3 w-full">
              <div className="flex min-h-[400px] md:min-h-[560px] flex-col gap-8 md:gap-10 bg-cover bg-center bg-no-repeat rounded-2xl md:rounded-[2rem] items-center justify-center p-6 md:p-8 relative shadow-neo-inset-container w-full">
                <div className="flex flex-col gap-4 md:gap-6 text-center z-10 max-w-4xl px-2 w-full animate-float">
                  <h1 className="bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-600 bg-clip-text text-transparent text-4xl md:text-5xl lg:text-8xl font-black leading-tight tracking-tight font-headline drop-shadow-[0_0_30px_rgba(99,102,241,0.3)] animate-gradient-x uppercase">
                    Your Ride, Your Way
                  </h1>
                  <h2 className="text-on-surface-variant text-sm md:text-base lg:text-xl font-medium leading-relaxed max-w-lg mx-auto mt-4">
                    Experience seamless mobility with RIDENOVA. Effortlessly book a ride to your next destination or join our network as a driver.
                  </h2>
                </div>
                <div className="flex-wrap gap-4 md:gap-8 flex justify-center z-10 mt-4 md:mt-6 w-full">
                  <button onClick={() => navigate('/dashboard')} className="flex min-w-[140px] md:min-w-[160px] cursor-pointer items-center justify-center rounded-2xl h-14 md:h-16 px-6 md:px-10 bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-600 animate-gradient-x shadow-neo-raised hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300 text-white text-sm md:text-base font-bold leading-normal tracking-wide gap-2 md:gap-3 group flex-wrap">
                    <span className="material-symbols-outlined text-lg md:text-xl group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300">search</span>
                    <span>Find a Ride</span>
                  </button>
                  <button onClick={() => navigate('/driver/login')} className="flex min-w-[140px] md:min-w-[160px] cursor-pointer items-center justify-center rounded-2xl h-14 md:h-16 px-6 md:px-10 bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-600 animate-gradient-x shadow-neo-raised hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300 text-white text-sm md:text-base font-bold leading-normal tracking-wide gap-2 md:gap-3 group flex-wrap">
                    <span className="material-symbols-outlined text-lg md:text-xl group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-300">local_taxi</span>
                    <span>Become a Driver</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="flex flex-col gap-10 md:gap-16 w-full">
              <div className="flex flex-col gap-4 text-center items-center px-4">
                <h2 className="text-3xl md:text-[56px] font-black leading-tight font-headline max-w-[900px] drop-shadow-md bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-600 bg-clip-text text-transparent animate-gradient-x uppercase">
                  Why Choose RIDENOVA
                </h2>
                <p className="text-on-surface-variant text-base md:text-lg font-medium leading-normal max-w-[640px] mt-2">
                  We craft the optimal experience for both our riders and dedicated drivers.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 w-full">
                <div className="flex flex-1 gap-6 rounded-3xl panel-3d moving-left-shadow p-8 md:p-10 flex-col items-start transition-all duration-300 hover:-translate-y-2 group">
                  <div className="size-16 rounded-2xl shadow-neo-pressed bg-surface-container-low flex items-center justify-center text-primary bg-gradient-to-tr from-indigo-500/10 to-purple-600/10 border border-indigo-500/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <span className="material-symbols-outlined text-[32px] text-indigo-400">shield</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <h3 className="text-on-surface text-xl md:text-2xl font-bold leading-tight font-headline transition-colors duration-300 group-hover:text-indigo-400">Safety First</h3>
                    <p className="text-on-surface-variant text-sm md:text-base font-medium leading-relaxed">Top-notch safety protocols and real-time tracking for every journey.</p>
                  </div>
                </div>
                <div className="flex flex-1 gap-6 rounded-3xl panel-3d moving-left-shadow p-8 md:p-10 flex-col items-start transition-all duration-300 hover:-translate-y-2 group">
                  <div className="size-16 rounded-2xl shadow-neo-pressed bg-surface-container-low flex items-center justify-center text-primary bg-gradient-to-tr from-indigo-500/10 to-purple-600/10 border border-indigo-500/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <span className="material-symbols-outlined text-[32px] text-indigo-400">calendar_clock</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <h3 className="text-on-surface text-xl md:text-2xl font-bold leading-tight font-headline transition-colors duration-300 group-hover:text-indigo-400">Reliable Rides</h3>
                    <p className="text-on-surface-variant text-sm md:text-base font-medium leading-relaxed">Always on time, providing consistent service wherever you need to go.</p>
                  </div>
                </div>
                <div className="flex flex-1 gap-6 rounded-3xl panel-3d moving-left-shadow p-8 md:p-10 flex-col items-start transition-all duration-300 hover:-translate-y-2 group">
                  <div className="size-16 rounded-2xl shadow-neo-pressed bg-surface-container-low flex items-center justify-center text-primary bg-gradient-to-tr from-indigo-500/10 to-purple-600/10 border border-indigo-500/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <span className="material-symbols-outlined text-[32px] text-indigo-400">credit_card</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <h3 className="text-on-surface text-xl md:text-2xl font-bold leading-tight font-headline transition-colors duration-300 group-hover:text-indigo-400">Easy Payments</h3>
                    <p className="text-on-surface-variant text-sm md:text-base font-medium leading-relaxed">Seamless, cashless, and highly secure payment options tailored for you.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ride Options Section */}
            <div className="flex flex-col gap-8 md:gap-10 w-full">
              <div className="flex flex-col gap-3 px-4 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-tight font-headline drop-shadow-md bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-600 bg-clip-text text-transparent animate-gradient-x uppercase">Ride Options</h2>
                <p className="text-on-surface-variant text-base md:text-lg font-medium">Select the vehicle that perfectly suits your current needs.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 w-full">
                <div className="flex flex-col gap-6 rounded-3xl panel-3d moving-left-shadow p-6 group cursor-pointer w-full transition-all duration-300 hover:-translate-y-2">
                  <div className="w-full bg-center bg-no-repeat aspect-[16/10] bg-cover rounded-2xl shadow-neo-inset-container overflow-hidden transition-transform duration-700 group-hover:scale-[1.02]" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuApAmew9AE2X9woSIUwa-WXaFDoyesSy9l42P17cWfGHzB4vTKED8CM1q3HWdUO1Xi6LB9ZBFsq6spvkJXhb2-yPt-0ER6bpVu85z660zD53SASZ3CXHbUex8ttBdpkcqgGRJlqzDAp_QnnN-CeQnUi6vnVvIfIZGbyxmrTnI7NLX-Myo7MNICOtwTeCQ3Y7g8CBQnUOGbPS2KtlsMzo8sNCfCjL86d8XVHdxuzzZq5i5o6YkNCq_DVmczVqM81X8WMcHhbH0e_18g")' }}>
                  </div>
                  <div className="px-3 pb-2 flex flex-col gap-2">
                    <p className="text-on-surface text-lg md:text-xl font-bold leading-normal font-headline transition-colors duration-300 group-hover:text-indigo-400">Economy</p>
                    <p className="text-on-surface-variant text-sm md:text-base font-medium leading-normal">Affordable, everyday rides for quick trips.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-6 rounded-3xl panel-3d moving-left-shadow p-6 group cursor-pointer w-full transition-all duration-300 hover:-translate-y-2">
                  <div className="w-full bg-center bg-no-repeat aspect-[16/10] bg-cover rounded-2xl shadow-neo-inset-container overflow-hidden transition-transform duration-700 group-hover:scale-[1.02]" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAekEMpamYLdQUbWrhyPZ4Sw97utRwdahjCx63kkfX_s7hnapFBPyUJ9eJwI3gAfq2M2RDY-e0-5BxbW0VEjTkPkprqhYsHxO6MXFWd-HjRk4HB6xOOTUTOBZ6hjMa1xA-ix6qUVT8JIAL5RhL_G4Gm0EVjgwRxmWclzahWKyicJZRJOBz1irFsEGRFW6N4_bai8HIovn4jCSlFuHSdFQCO7ooegfwjX43NJMQ1KsWooMZFeNKXhaTXOm9HXZUrTkgA_ydE1Y035FI")' }}>
                  </div>
                  <div className="px-3 pb-2 flex flex-col gap-2">
                    <p className="text-on-surface text-lg md:text-xl font-bold leading-normal font-headline transition-colors duration-300 group-hover:text-indigo-400">Premium</p>
                    <p className="text-on-surface-variant text-sm md:text-base font-medium leading-normal">Elevated luxury and superior comfort.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-6 rounded-3xl panel-3d moving-left-shadow p-6 group cursor-pointer w-full transition-all duration-300 hover:-translate-y-2">
                  <div className="w-full bg-center bg-no-repeat aspect-[16/10] bg-cover rounded-2xl shadow-neo-inset-container overflow-hidden transition-transform duration-700 group-hover:scale-[1.02]" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBykDspNLoNJ-cD-zctiTQlJe-TAfOC57ku6Zvup2l2vydEzFphngboj7xFyCXkIRMUkQe0Q5gA9JmNkULHQ5DNlDWffVjI7venSQri8MzDvI5GTzBNdnQXYhHrtoRqMiIOCDzXdrrfYfrBRdUeh_cSiydJOLawagFUt3B_kkhb5-MFYdKxEDCQJ4BMHiPe1KkBHr9v2CNlQS-EnbEcRVrSoUcD-w8KyHO_aqzTx8adVQmH5E0RfdM-wZcaQ1fADFBfl3qiAviaXrk")' }}>
                  </div>
                  <div className="px-3 pb-2 flex flex-col gap-2">
                    <p className="text-on-surface text-lg md:text-xl font-bold leading-normal font-headline transition-colors duration-300 group-hover:text-indigo-400">XL</p>
                    <p className="text-on-surface-variant text-sm md:text-base font-medium leading-normal">Extra space tailored for groups and luggage.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="flex flex-col gap-6 md:gap-10 w-full mt-4 md:mt-10">
              <div className="flex flex-col gap-3 px-4 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-tight font-headline bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-600 bg-clip-text text-transparent animate-gradient-x uppercase">
                  About RIDENOVA
                </h2>
              </div>
              <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-stretch w-full rounded-3xl panel-3d moving-left-shadow p-6 md:p-8 transition-all duration-500 hover:-translate-y-1 group">
                <div className="w-full md:w-1/2 rounded-2xl overflow-hidden shadow-neo-inset-container relative min-h-[250px] aspect-video md:aspect-auto">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.05]" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAQVzPdkATca-Unj5A4VX933VzHzbHRiww_AES8wNi8BH7O4yeaXSHU5KnoQjEznoH_yhf5AoZQ030iSYGjYL6zh_lIqTvCUXzHQulFcMw8VBy-3UxnkxMpbWGdMtVmNQxl6-nHUdNkv-SG-3J_t0P1WM_mdmjb7edMgRQceDOF1abfBBwEBfjR-kvV44BYUfy0pGQ8x2Zw2tCmFb17XM4mmwfss6x3R9zDNus3_WI_5Sy85ivgGPESTqifZW8Z4jlP3-oTdNuwfRk')" }}></div>
                </div>
                <div className="w-full md:w-1/2 flex flex-col gap-4 justify-center py-4 md:py-8">
                  <h3 className="text-on-surface text-xl md:text-2xl font-bold font-headline transition-colors duration-300 group-hover:text-indigo-400">Pioneering the Future of Mobility</h3>
                  <p className="text-on-surface-variant text-sm md:text-lg leading-relaxed">At RIDENOVA, we believe that transportation should be more than just getting from point A to point B. It should be an experience. We are dedicated to providing innovative, safe, and reliable mobility solutions that connect people and communities.</p>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="flex flex-col gap-6 md:gap-10 w-full mt-4 md:mt-10">
              <div className="flex flex-col gap-3 px-4 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-tight font-headline drop-shadow-md bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-600 bg-clip-text text-transparent animate-gradient-x uppercase">Get in Touch</h2>
              </div>
              <div className="flex flex-col md:flex-row-reverse gap-6 md:gap-10 items-stretch w-full rounded-3xl panel-3d moving-left-shadow p-6 md:p-8 transition-all duration-500 hover:-translate-y-1 group">
                <div className="w-full md:w-1/2 rounded-2xl overflow-hidden shadow-neo-inset-container relative min-h-[250px] aspect-video md:aspect-auto">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.05]" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-VzU5EYd4GDcoT5xQ33UGhbHQK2b59PX0m68szag9AVv-dPzGjnG4M7-6AsQils8gvZ-PNKN8vpW9Qv4c3hzOiiD3nG89izX8F2OGerA0Hd8Y-w6hAr2UCzWwmxVTZyHdJ1zJFOqBK2utmjW5SggwqKI8rz-C4QnQTZBMr7NbmAL-UAxkIIlqM93_N1M3y7PA1vjYhCZ4UW2cr56gx3UtSeLGqgx6aQPmkSqKdvIz1eo7nob4bUVqN927ua8w73XwuhXHYjAf3iw')" }}></div>
                </div>
                <div className="w-full md:w-1/2 flex flex-col gap-6 justify-center py-4 md:py-8">
                  <h3 className="text-on-surface text-xl md:text-2xl font-bold font-headline transition-colors duration-300 group-hover:text-indigo-400">We're Here to Help</h3>
                  <p className="text-on-surface-variant text-sm md:text-lg leading-relaxed">Have questions or need assistance? Our dedicated support team is available 24/7 to ensure your experience with RIDENOVA is nothing short of exceptional.</p>
                  <div className="flex flex-col gap-4 mt-2 items-start">
                    <div className="flex items-center gap-4 text-on-surface-variant group/contact cursor-pointer">
                      <div className="size-10 md:size-12 rounded-xl panel-3d flex items-center justify-center text-primary transition-all duration-300 group-hover/contact:scale-110 group-hover/contact:-rotate-6 border border-white/10">
                        <span className="material-symbols-outlined text-indigo-400">mail</span>
                      </div>
                      <span className="text-sm md:text-lg transition-colors duration-300 group-hover/contact:text-indigo-400">support@ridenova.com</span>
                    </div>
                    <div className="flex items-center gap-4 text-on-surface-variant group/contact cursor-pointer">
                      <div className="size-10 md:size-12 rounded-xl panel-3d flex items-center justify-center text-primary transition-all duration-300 group-hover/contact:scale-110 group-hover/contact:rotate-6 border border-white/10">
                        <span className="material-symbols-outlined text-indigo-400">phone</span>
                      </div>
                      <span className="text-sm md:text-lg transition-colors duration-300 group-hover/contact:text-indigo-400">1-800-RIDENOVA</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="mt-8 mb-12 panel-3d rounded-3xl p-6 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 border border-white/5 w-full">
            <div className="flex items-center gap-4">
              <div className="size-10 md:size-12 rounded-xl input-inset flex items-center justify-center text-primary bg-gradient-to-tr from-indigo-500 to-purple-600 animate-gradient-x">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span>
              </div>
              <span className="font-black text-xl md:text-2xl font-headline tracking-tight bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-600 bg-clip-text text-transparent animate-gradient-x">RIDENOVA</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 md:gap-x-10 gap-y-4">
              <a className="text-on-surface-variant hover:text-primary transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 font-semibold text-xs md:text-sm inline-block" href="#">Privacy Policy</a>
              <a className="text-on-surface-variant hover:text-primary transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 font-semibold text-xs md:text-sm cursor-pointer inline-block" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Terms of Service</a>
              <a className="text-on-surface-variant hover:text-primary transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 font-semibold text-xs md:text-sm inline-block" href="#">Help Center</a>
            </nav>
            <p className="text-on-surface-variant text-xs md:text-sm font-medium text-center">
              © 2024 RIDENOVA. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
