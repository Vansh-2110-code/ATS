import { Link, useNavigate } from 'react-router';
import { Home, ArrowLeft, Search } from 'lucide-react';
import logoImg from '../../assets/Logo.png';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-10">
        <img src={logoImg} alt="White Horse Manpower" className="h-10 w-auto" />
        <span className="text-slate-800" style={{ fontWeight: 700, fontSize: '1.1rem' }}>White Horse Manpower ATS</span>
      </Link>

      {/* 404 Visual */}
      <div className="relative mb-6">
        <div className="text-slate-100 select-none" style={{ fontWeight: 900, fontSize: 'clamp(5rem, 20vw, 10rem)', lineHeight: 1 }}>
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      <h1 className="text-slate-800 mb-2" style={{ fontWeight: 700, fontSize: '1.5rem' }}>
        Page not found
      </h1>
      <p className="text-slate-500 text-sm mb-8 max-w-sm leading-relaxed">
        The page you're looking for doesn't exist or has been moved. Check the URL or navigate back to a known page.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-100 transition-colors"
          style={{ fontWeight: 500 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
        <Link
          to="/"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 transition-colors"
          style={{ fontWeight: 600 }}
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      {/* Quick Links */}
      <div className="mt-10 border-t border-slate-100 pt-8 w-full max-w-sm">
        <p className="text-xs text-slate-400 mb-4" style={{ fontWeight: 500 }}>QUICK LINKS</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            { label: 'Landing', href: '/' },
            { label: 'About', href: '/about' },
            { label: 'Services', href: '/services' },
            { label: 'Apply', href: '/apply' },
            { label: 'Employee Login', href: '/login' },
            { label: 'Walk-In', href: '/walk-in' },
          ].map(link => (
            <Link
              key={link.href}
              to={link.href}
              className="text-xs px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
