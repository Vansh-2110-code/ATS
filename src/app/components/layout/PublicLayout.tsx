import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router';
import { Menu, X } from 'lucide-react';
import logoImg from '../../../assets/Logo.png';
import { ChatbotWidget } from '../ui/ChatbotWidget';
import { useAuth, ROLE_DASHBOARD } from '../../context/AuthContext';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Apply for Job', href: '/apply' },
];

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <img src={logoImg} alt="White Horse Manpower" className="h-10 w-auto" />
              <div>
                <span className="text-slate-800 block" style={{ fontWeight: 700, fontSize: '1rem', lineHeight: '1.2' }}>
                  White Horse Manpower
                </span>
                <span className="text-green-600 block" style={{ fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                  ATS SYSTEM
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    location.pathname === link.href
                      ? 'bg-green-50 text-green-700'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                  style={{ fontWeight: location.pathname === link.href ? 600 : 400 }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <Link
                  to={ROLE_DASHBOARD[user.role as keyof typeof ROLE_DASHBOARD] || '/'}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Employee Login
                </Link>
              )}
              <Link
                to="/apply"
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                style={{ fontWeight: 500 }}
              >
                Apply for Job
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-slate-600 hover:text-slate-800"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm transition-colors ${
                  location.pathname === link.href
                    ? 'bg-green-50 text-green-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                style={{ fontWeight: location.pathname === link.href ? 600 : 400 }}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <Link
                  to={ROLE_DASHBOARD[user.role as keyof typeof ROLE_DASHBOARD] || '/'}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
                  style={{ fontWeight: 500 }}
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
                  style={{ fontWeight: 500 }}
                >
                  Employee Login
                </Link>
              )}
              <Link
                to="/apply"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 bg-green-600 text-white text-sm rounded-lg text-center"
                style={{ fontWeight: 500 }}
              >
                Apply for Job
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={logoImg} alt="White Horse Manpower" className="h-10 w-auto" />
                <span className="text-white" style={{ fontWeight: 700 }}>White Horse Manpower ATS</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                End-to-end applicant tracking system built for modern recruitment teams. Track every candidate, every call, every hire.
              </p>
            </div>
            <div>
              <h4 className="text-white text-sm mb-4" style={{ fontWeight: 600 }}>Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/services" className="hover:text-white transition-colors">Services</Link></li>
                <li><Link to="/apply" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm mb-4" style={{ fontWeight: 600 }}>For Candidates</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/apply" className="hover:text-white transition-colors">Apply Online</Link></li>
                <li><Link to="/walk-in" className="hover:text-white transition-colors">Walk-In Registration</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Employee Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>© 2026 White Horse Manpower ATS. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
      <ChatbotWidget mode="candidate" />
    </div>
  );
}
