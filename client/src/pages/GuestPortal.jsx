import { Link } from 'react-router-dom';
import { Cpu, Terminal, Shield, Zap, Users } from 'lucide-react';

const GuestPortal = () => {
  return (
    <div className="bg-slate-50 min-h-screen pb-24 overflow-hidden">

      {/* 1. The Hero Section (Asymmetric & Overlapping) */}
      <section className="min-h-[90vh] flex flex-col justify-center relative overflow-hidden bg-slate-50">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl mx-auto px-6 w-full relative z-10 py-20">
          
          {/* Left Column (col-span-7) */}
          <div className="col-span-7">
            <h1 className="text-7xl lg:text-8xl font-heading font-extrabold tracking-tighter leading-[0.95] text-slate-900">
              Empower Your Engineering.
            </h1>
            <div className="flex gap-4 mt-10">
              <Link to="/register" className="bg-slate-950 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-primary transition-colors shadow-xl hover:-translate-y-1">
                Join the Club
              </Link>
              <Link to="/events" className="text-slate-600 font-bold px-8 py-4 hover:text-slate-950 transition-colors underline-offset-4 hover:underline">
                Explore Events
              </Link>
            </div>
          </div>

          {/* Right Column (col-span-5 relative h-full min-h-[500px] hidden lg:block) */}
          <div className="col-span-5 relative h-full min-h-[500px] hidden lg:block">
            <div className="absolute top-10 right-0 w-64 h-64 bg-white rounded-full shadow-2xl overflow-hidden border-4 border-white z-20">
              <img src="https://placehold.co/400x400/e2e8f0/475569?text=AI" alt="AI" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 left-10 w-72 h-80 bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800 z-10">
              <img src="https://placehold.co/400x500/1e293b/94a3b8?text=Hackathon" alt="Hackathon" className="w-full h-full object-cover opacity-80 mix-blend-luminosity" />
            </div>
            <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-primary rounded-3xl shadow-2xl overflow-hidden border-4 border-white z-30 flex items-center justify-center -translate-y-1/2">
              <span className="text-4xl font-black text-white tracking-tighter">ACE</span>
            </div>
          </div>

        </div>

        {/* The Marquee */}
        <div className="absolute bottom-0 left-0 w-full whitespace-nowrap overflow-hidden bg-primary text-white py-3 font-mono font-bold tracking-widest flex z-20">
          <div className="animate-marquee flex gap-8">
            <span>ARTIFICIAL INTELLIGENCE • WEB3 • ROBOTICS • CLOUD ARCHITECTURE • </span>
            <span>ARTIFICIAL INTELLIGENCE • WEB3 • ROBOTICS • CLOUD ARCHITECTURE • </span>
            <span>ARTIFICIAL INTELLIGENCE • WEB3 • ROBOTICS • CLOUD ARCHITECTURE • </span>
            <span>ARTIFICIAL INTELLIGENCE • WEB3 • ROBOTICS • CLOUD ARCHITECTURE • </span>
          </div>
        </div>
      </section>

      {/* 2. The Mission Section (Bento Box Grid) */}
      <section id="about" className="max-w-7xl mx-auto py-24 px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6">
          
          {/* Card 1 (The Main Feature) */}
          <div className="md:col-span-2 md:row-span-2 bg-slate-900 text-white p-10 rounded-3xl relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <Cpu className="absolute -bottom-8 -right-8 w-64 h-64 text-slate-800 opacity-50 group-hover:rotate-12 transition-transform duration-700" />
            <h3 className="text-4xl font-heading font-black mb-4 relative z-10 tracking-tight">Hands-on Workshops</h3>
            <p className="text-slate-400 text-lg leading-relaxed relative z-10 max-w-sm">
              We bypass tutorials and dive straight into production-grade systems. Build deep-tech projects, neural networks, and scalable infrastructure with our core engineering team.
            </p>
          </div>

          {/* Card 2 (Top Right) */}
          <div className="md:col-span-2 md:row-span-1 bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-2xl font-bold text-slate-950 mb-2 tracking-tight">Competitive Hackathons</h4>
                <p className="text-slate-500 font-medium">Test your skills in flagship 24-hour development sprints like Prajwalan. Compete, build, and win massive prizes.</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                <Terminal className="w-6 h-6 text-slate-900" />
              </div>
            </div>
          </div>

          {/* Card 3 (Bottom Right) */}
          <div className="md:col-span-2 md:row-span-1 bg-blue-50 border border-blue-100 p-8 rounded-3xl hover:bg-blue-100 transition-colors">
             <div className="flex items-start justify-between">
              <div>
                <h4 className="text-2xl font-bold text-slate-950 mb-2 tracking-tight">Peer Networking</h4>
                <p className="text-slate-600 font-medium">Connect with top-tier developers, alumni, and industry professionals. The network is your ultimate utility.</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Department & Faculty (The Structural Split) */}
      <section id="department" className="w-full bg-slate-900 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-heading font-black tracking-tighter mb-6">Powered by the Dept. of CSE</h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-2xl mx-auto font-medium">
            SRKR ACE operates in direct synergy with the Computer Science & Engineering department,
            bridging the massive gap between academic curriculum and cutting-edge industry practices.
          </p>
          <a
            href="https://srkrec.edu.in"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border-2 border-white/20 text-white px-8 py-3 rounded-full font-bold hover:bg-white hover:text-slate-900 transition-all shadow-sm"
          >
            Visit CSE Dept <span>→</span>
          </a>
        </div>
      </section>

      {/* Faculty Leadership Grid */}
      <section id="faculty" className="w-full bg-white py-24 px-6 border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-heading font-black text-slate-950 tracking-tighter">Faculty Leadership.</h2>
            <p className="mt-4 text-slate-500 text-lg font-medium max-w-xl mx-auto">The academic visionaries guiding the association.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* HOD Profile */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-48 aspect-square rounded-full mb-6 overflow-hidden border-4 border-slate-100 shadow-lg group-hover:border-primary transition-colors duration-500">
                <img src="https://placehold.co/400x400/e2e8f0/475569?text=HOD" alt="Dr. V. Chandrasekhar" className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-500" />
              </div>
              <h4 className="text-2xl font-black text-slate-950 tracking-tight mb-1">Dr. V. Chandrasekhar</h4>
              <p className="text-primary font-bold tracking-wide text-sm uppercase">Head of Department</p>
            </div>

            {/* Coordinator Profile 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-48 aspect-square rounded-full mb-6 overflow-hidden border-4 border-slate-100 shadow-lg group-hover:border-primary transition-colors duration-500">
                <img src="https://placehold.co/400x400/e2e8f0/475569?text=Coord+1" alt="Dr. K. N. S. R. P. Reddy" className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-500" />
              </div>
              <h4 className="text-2xl font-black text-slate-950 tracking-tight mb-1">Dr. K. N. S. R. P. Reddy</h4>
              <p className="text-slate-500 font-bold tracking-wide text-sm uppercase">Faculty Coordinator</p>
            </div>

            {/* Coordinator Profile 2 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-48 aspect-square rounded-full mb-6 overflow-hidden border-4 border-slate-100 shadow-lg group-hover:border-primary transition-colors duration-500">
                <img src="https://placehold.co/400x400/e2e8f0/475569?text=Coord+2" alt="Faculty Coordinator" className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-500" />
              </div>
              <h4 className="text-2xl font-black text-slate-950 tracking-tight mb-1">Faculty Coordinator</h4>
              <p className="text-slate-500 font-bold tracking-wide text-sm uppercase">Faculty Coordinator</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. The Visual Archives (Gallery) */}
      <section id="gallery" className="py-24 bg-slate-950 px-4 sm:px-6 lg:px-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-4xl sm:text-5xl font-heading font-black text-white tracking-tighter">Visual Archives.</h2>
              <p className="mt-4 text-slate-400 text-lg font-medium max-w-xl">Glimpses into our high-stakes hackathons, workshops, and late-night coding sessions.</p>
            </div>
            <Link to="/events" className="text-primary font-bold hover:text-white transition-colors underline-offset-4 hover:underline whitespace-nowrap">
              View All Operations →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[250px]">
            {/* Large Image (Spans 2 cols, 2 rows) */}
            <div className="col-span-2 row-span-2 rounded-[2rem] overflow-hidden group relative">
              <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src="https://placehold.co/800x800/1e293b/94a3b8?text=Prajwalan+Hackathon" alt="Gallery" className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700 grayscale group-hover:grayscale-0" />
            </div>
            {/* Standard Images */}
            <div className="col-span-2 md:col-span-1 row-span-1 rounded-[2rem] overflow-hidden group relative">
              <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src="https://placehold.co/400x400/1e293b/94a3b8?text=AI+Workshop" alt="Gallery" className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700 grayscale group-hover:grayscale-0" />
            </div>
            <div className="col-span-1 row-span-1 rounded-[2rem] overflow-hidden group relative">
              <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src="https://placehold.co/400x400/1e293b/94a3b8?text=Robotics" alt="Gallery" className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700 grayscale group-hover:grayscale-0" />
            </div>
            <div className="col-span-1 row-span-1 rounded-[2rem] overflow-hidden group relative">
              <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src="https://placehold.co/400x400/1e293b/94a3b8?text=Cloud+Arch" alt="Gallery" className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700 grayscale group-hover:grayscale-0" />
            </div>
            <div className="col-span-2 md:col-span-1 row-span-1 rounded-[2rem] overflow-hidden group relative">
              <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
              <img src="https://placehold.co/400x400/1e293b/94a3b8?text=Core+Team" alt="Gallery" className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700 grayscale group-hover:grayscale-0" />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Communication Protocol (Contact & Footer) */}
      <section id="contact" className="py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-50 rounded-[3rem] p-10 sm:p-16 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-12 shadow-sm relative overflow-hidden">

            {/* Abstract Background Element */}
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none"></div>

            <div className="max-w-xl relative z-10 text-center md:text-left">
              <h2 className="text-4xl font-heading font-black text-slate-950 tracking-tighter mb-4">Establish Connection.</h2>
              <p className="text-slate-500 text-lg font-medium mb-8">
                Ready to elevate your engineering capabilities? Reach out to the core team for collaborations, sponsorships, or membership queries.
              </p>
              <div className="flex flex-col gap-6">
                <div>
                  <a href="mailto:srkraceofficial@gmail.com" className="inline-flex w-full sm:w-auto items-center justify-center bg-slate-950 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-primary transition-all shadow-xl hover:shadow-primary/30 hover:-translate-y-1">
                    Initialize Email
                  </a>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <a href="https://www.instagram.com/srkr_ace" target="_blank" rel="noreferrer" className="px-6 py-2.5 rounded-full font-bold text-sm text-white bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 hover:shadow-lg hover:shadow-pink-500/30 hover:-translate-y-0.5 transition-all">
                    Instagram
                  </a>
                  <a href="https://whatsapp.com/channel/0029VaA6ohD2kNFpm5oRiu1B" target="_blank" rel="noreferrer" className="px-6 py-2.5 rounded-full font-bold text-sm text-white bg-[#25D366] hover:bg-[#128C7E] hover:shadow-lg hover:shadow-[#25D366]/30 hover:-translate-y-0.5 transition-all">
                    WhatsApp
                  </a>
                  <a href="https://www.linkedin.com/company/association-of-computer-engineers-ace/" target="_blank" rel="noreferrer" className="px-6 py-2.5 rounded-full font-bold text-sm text-white bg-[#0A66C2] hover:bg-[#004182] hover:shadow-lg hover:shadow-[#0A66C2]/30 hover:-translate-y-0.5 transition-all">
                    LinkedIn
                  </a>
                  <a href="https://www.youtube.com/@srkrcse212" target="_blank" rel="noreferrer" className="px-6 py-2.5 rounded-full font-bold text-sm text-white bg-[#FF0000] hover:bg-[#CC0000] hover:shadow-lg hover:shadow-[#FF0000]/30 hover:-translate-y-0.5 transition-all">
                    YouTube
                  </a>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex gap-12 text-left">
              <div>
                <h4 className="font-black text-slate-950 uppercase tracking-wider mb-4">Headquarters</h4>
                <p className="text-slate-500 font-medium">Department of CSE<br />SRKR Engineering College<br />Bhimavaram, AP 534204</p>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center border-t border-slate-100 pt-8">
            <p className="text-slate-400 font-medium font-mono text-sm uppercase tracking-widest">
              © {new Date().getFullYear()} SRKR ACE. Protocol Active.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default GuestPortal;
