import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarCheck, BarChart3, Brain, Shield, Zap } from 'lucide-react';

const LOGO = '/8_Track_logo.png';

const features = [
  {
    icon: CalendarCheck,
    title: 'Smart Attendance Tracking',
    desc: 'Track every class automatically and get predictive alerts before your attendance drops below the safe threshold.',
  },
  {
    icon: BookOpen,
    title: 'Assignment Management',
    desc: 'Never miss a deadline. Organise assignments by subject, priority, and due date — all in one place.',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    desc: 'Visualise your academic performance with beautiful charts and insights that keep you on track all semester.',
  },
  {
    icon: Brain,
    title: 'Focus Mode',
    desc: 'Eliminate distractions with a built-in Pomodoro timer and deep-focus session tracker.',
  },
  {
    icon: Zap,
    title: 'Google Calendar Sync',
    desc: 'Sync your classes and exams directly with Google Calendar so your schedule is always with you.',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    desc: 'Your academic data is encrypted, never sold, and fully under your control at all times.',
  },
];

const CSS = `
  @keyframes drift1 { from{transform:translate(0,0) scale(1)} to{transform:translate(4%,6%) scale(1.08)} }
  @keyframes drift2 { from{transform:translate(0,0) scale(1)} to{transform:translate(-5%,-4%) scale(1.06)} }
  @keyframes drift3 { from{transform:translate(0,0) scale(1)} to{transform:translate(-3%,5%) scale(0.94)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes logoFloat { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-10px) rotate(1deg)} }
  @keyframes shimmer  { 0%,100%{opacity:0.7} 50%{opacity:1} }
  @keyframes rotateSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

  .lp-fade1{animation:fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.05s both}
  .lp-fade2{animation:fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.18s both}
  .lp-fade3{animation:fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.32s both}
  .lp-fade4{animation:fadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.46s both}
  .lp-logo-float{animation:logoFloat 5s ease-in-out infinite}

  .lp-badge{
    display:inline-block; padding:5px 16px; border-radius:50px;
    font-size:0.72rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase;
    background:rgba(232,168,56,0.12); color:#E8A838;
    border:1px solid rgba(232,168,56,0.28);
    animation:shimmer 2.8s ease-in-out infinite;
  }

  .lp-cta{
    display:inline-flex; align-items:center; gap:10px;
    padding:16px 36px; border-radius:50px; border:none; cursor:pointer;
    font-size:1rem; font-weight:700; letter-spacing:0.02em;
    background:linear-gradient(135deg,#E8A838 0%,#f5cc6a 50%,#E8A838 100%);
    background-size:200% 200%; color:#0F0F13;
    box-shadow:0 0 36px rgba(232,168,56,0.4),0 4px 20px rgba(0,0,0,0.45);
    transition:transform 0.2s,box-shadow 0.2s,background-position 0.4s;
    text-decoration:none;
  }
  .lp-cta:hover{
    transform:translateY(-3px) scale(1.03);
    box-shadow:0 0 56px rgba(232,168,56,0.6),0 8px 32px rgba(0,0,0,0.4);
    background-position:right center;
  }
  .lp-cta:active{transform:scale(0.97)}
  .lp-cta-sm{padding:10px 22px;font-size:0.85rem}

  .lp-card{
    background:rgba(30,30,36,0.55);
    border:1px solid rgba(255,255,255,0.06);
    border-radius:20px; padding:28px 24px;
    backdrop-filter:blur(14px);
    transition:transform 0.25s,border-color 0.25s,box-shadow 0.25s;
  }
  .lp-card:hover{
    transform:translateY(-6px);
    border-color:rgba(232,168,56,0.3);
    box-shadow:0 12px 40px rgba(232,168,56,0.1);
  }

  .lp-icon-box{
    width:46px;height:46px;border-radius:13px;margin-bottom:16px;
    background:rgba(232,168,56,0.1);border:1px solid rgba(232,168,56,0.22);
    display:flex;align-items:center;justify-content:center;
  }

  .lp-stat-val{font-size:2.1rem;font-weight:900;color:#E8A838;line-height:1}
  .lp-stat-lbl{font-size:0.76rem;color:#888;margin-top:5px;font-weight:500}

  .lp-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent);max-width:900px;margin:0 auto}

  .lp-footer-link{color:#888;font-size:0.83rem;text-decoration:none;transition:color 0.2s}
  .lp-footer-link:hover{color:#E8A838}

  .lp-dot-grid{
    background-image:radial-gradient(rgba(255,255,255,0.035) 1px,transparent 1px);
    background-size:24px 24px;
  }

  .lp-nav-link{color:#888;font-size:0.85rem;text-decoration:none;font-weight:500;transition:color 0.2s}
  .lp-nav-link:hover{color:#E8A838}

  .lp-ring{
    position:absolute;border-radius:50%;
    border:1px solid rgba(232,168,56,0.1);
    animation:rotateSlow 30s linear infinite;
    pointer-events:none;
  }
`;

export default function LandingPage() {
  return (
    <div
      id="landing-root"
      style={{ minHeight:'100vh', background:'var(--main-bg)', color:'#fff', fontFamily:"'Inter',sans-serif", overflowX:'hidden' }}
    >
      <style>{CSS}</style>

      {/* ── BG Orbs ── */}
      <div aria-hidden="true" style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{ position:'absolute',top:'-20%',left:'-10%',width:'55vw',height:'55vw',borderRadius:'50%',background:'radial-gradient(circle,rgba(232,168,56,0.13) 0%,transparent 70%)',animation:'drift1 14s ease-in-out infinite alternate' }} />
        <div style={{ position:'absolute',bottom:'-15%',right:'-8%',width:'45vw',height:'45vw',borderRadius:'50%',background:'radial-gradient(circle,rgba(58,191,191,0.09) 0%,transparent 70%)',animation:'drift2 18s ease-in-out infinite alternate' }} />
        <div style={{ position:'absolute',top:'40%',left:'45%',width:'30vw',height:'30vw',borderRadius:'50%',background:'radial-gradient(circle,rgba(232,168,56,0.06) 0%,transparent 70%)',animation:'drift3 22s ease-in-out infinite alternate' }} />
      </div>

      {/* ── NAV ── */}
      <nav style={{ position:'relative',zIndex:10,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 40px',borderBottom:'1px solid rgba(255,255,255,0.04)',backdropFilter:'blur(10px)',background:'rgba(20,20,24,0.6)' }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <img src={LOGO} alt="8Track logo" style={{ width:36,height:36,objectFit:'contain' }} />
          <span style={{ fontSize:'1.05rem',fontWeight:800,letterSpacing:'-0.02em' }}>
            8<span style={{ color:'#E8A838' }}>Track</span>
          </span>
        </div>
        <div style={{ display:'flex',gap:28,alignItems:'center' }}>
          <Link to="/privacy" className="lp-nav-link">Privacy</Link>
          <Link to="/terms"   className="lp-nav-link">Terms</Link>
          <a href="/auth" className="lp-cta lp-cta-sm" id="nav-signin-btn">
            Sign In <ArrowRight size={14} />
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-dot-grid" style={{ position:'relative',zIndex:1,textAlign:'center',padding:'96px 24px 72px' }}>
        <div className="lp-ring" style={{ width:520,height:520,top:'50%',left:'50%',transform:'translate(-50%,-50%)' }} />
        <div className="lp-ring" style={{ width:720,height:720,top:'50%',left:'50%',transform:'translate(-50%,-50%)',animationDirection:'reverse',animationDuration:'45s' }} />

        <div className="lp-fade1" style={{ marginBottom:28 }}>
          <span className="lp-badge">Academic Intelligence, Reinvented</span>
        </div>

        {/* Logo */}
        <div className="lp-fade2 lp-logo-float" style={{ marginBottom:32,display:'flex',justifyContent:'center' }}>
          <img
            src={LOGO}
            alt="8Track"
            style={{ width:140,height:140,objectFit:'contain',filter:'drop-shadow(0 0 40px rgba(232,168,56,0.55))' }}
          />
        </div>

        <h1 className="lp-fade2" style={{ fontSize:'clamp(2.4rem,6vw,4.2rem)',fontWeight:900,lineHeight:1.1,letterSpacing:'-0.03em',margin:'0 auto 20px',maxWidth:800 }}>
          Study Smarter.<br />
          <span style={{ background:'linear-gradient(135deg,#E8A838,#f5d27a)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>
            Never Miss a Class.
          </span>
        </h1>

        <p className="lp-fade3" style={{ fontSize:'clamp(0.98rem,2vw,1.18rem)',color:'#888',maxWidth:590,margin:'0 auto 48px',lineHeight:1.8,fontWeight:400 }}>
          8Track is your all-in-one academic companion — intelligently tracking attendance, managing
          assignments &amp; exams, syncing your Google Calendar, and keeping you focused so you
          perform your best every single day.
        </p>

        <div className="lp-fade4">
          <a href="/auth" className="lp-cta" id="get-started-btn">
            Let's Get Started <ArrowRight size={18} />
          </a>
        </div>

        {/* Stats row */}
        <div className="lp-fade4" style={{ display:'flex',justifyContent:'center',gap:48,marginTop:72,flexWrap:'wrap' }}>
          {[
            { value:'75%', label:'Attendance threshold managed' },
            { value:'100%', label:'Free to use' },
            { value:'∞',   label:'Academic clarity' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign:'center' }}>
              <div className="lp-stat-val">{value}</div>
              <div className="lp-stat-lbl">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="lp-divider" />

      {/* ── FEATURES ── */}
      <section style={{ position:'relative',zIndex:1,padding:'80px 24px',maxWidth:1080,margin:'0 auto' }}>
        <div style={{ textAlign:'center',marginBottom:52 }}>
          <h2 style={{ fontSize:'clamp(1.6rem,4vw,2.6rem)',fontWeight:800,letterSpacing:'-0.025em',marginBottom:12 }}>
            Everything you need to{' '}
            <span style={{ color:'#E8A838' }}>ace your semester</span>
          </h2>
          <p style={{ color:'#888',fontSize:'1rem',maxWidth:520,margin:'0 auto',lineHeight:1.75 }}>
            Designed for college students who want an intelligent, distraction-free way to stay on top of academics.
          </p>
        </div>

        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20 }}>
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="lp-card">
              <div className="lp-icon-box">
                <Icon size={20} color="#E8A838" />
              </div>
              <h3 style={{ fontWeight:700,fontSize:'1rem',marginBottom:8,letterSpacing:'-0.015em' }}>{title}</h3>
              <p style={{ color:'#888',fontSize:'0.875rem',lineHeight:1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ position:'relative',zIndex:1,padding:'0 24px 100px' }}>
        <div style={{
          maxWidth:760,margin:'0 auto',borderRadius:28,
          background:'linear-gradient(135deg,rgba(232,168,56,0.1) 0%,rgba(58,191,191,0.06) 100%)',
          border:'1px solid rgba(232,168,56,0.22)',
          padding:'64px 40px',textAlign:'center',
          backdropFilter:'blur(14px)',
        }}>
          <div style={{ marginBottom:20,display:'flex',justifyContent:'center' }}>
            <img src={LOGO} alt="8Track" style={{ width:80,height:80,objectFit:'contain',filter:'drop-shadow(0 0 24px rgba(232,168,56,0.5))' }} />
          </div>
          <h2 style={{ fontSize:'clamp(1.5rem,3.5vw,2.2rem)',fontWeight:800,marginBottom:14,letterSpacing:'-0.025em' }}>
            Ready to take control of your academics?
          </h2>
          <p style={{ color:'#888',marginBottom:36,fontSize:'0.95rem',lineHeight:1.75,maxWidth:460,margin:'0 auto 36px' }}>
            Join students who use 8Track to manage attendance, stay ahead of deadlines, and study smarter every day.
          </p>
          <a href="/auth" className="lp-cta" id="cta-bottom-btn">
            Let's Get Started <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        position:'relative',zIndex:1,
        borderTop:'1px solid rgba(255,255,255,0.05)',
        padding:'28px 40px',
        display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:16,
      }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <img src={LOGO} alt="8Track" style={{ width:26,height:26,objectFit:'contain',opacity:0.65 }} />
          <span style={{ fontWeight:700,fontSize:'0.88rem',opacity:0.55 }}>8Track</span>
        </div>

        <div style={{ display:'flex',gap:28,alignItems:'center' }}>
          <Link to="/privacy" className="lp-footer-link" id="footer-privacy-link">Privacy Policy</Link>
          <Link to="/terms"   className="lp-footer-link" id="footer-terms-link">Terms &amp; Conditions</Link>
        </div>

        <p style={{ color:'#888',fontSize:'0.78rem' }}>
          © {new Date().getFullYear()} 8Track. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
