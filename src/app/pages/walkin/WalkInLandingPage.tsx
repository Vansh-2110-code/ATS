import { Link } from 'react-router';
import { ArrowRight, FileText, Clock, CheckCircle2 } from 'lucide-react';
import logoImg from '../../../assets/Logo.png';

export function WalkInLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg border border-slate-50 shadow-sm flex items-center justify-center">
              <img src={logoImg} alt="White Horse Manpower" className="h-8 w-auto object-contain" />
            </div>
            <span className="text-slate-800 font-bold text-lg">White Horse Manpower</span>
          </div>
          <Link
            to="/login"
            className="text-slate-600 hover:text-slate-800 font-medium text-sm"
          >
            Login
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Walk-In Opportunity
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Join White Horse Manpower. Apply directly without prior registration.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Three-Step Process */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Step 1: Apply</h3>
            <p className="text-slate-600 text-sm">
              Sign up with your email or create a walk-in account. No prior registration needed.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Step 2: Fill Form</h3>
            <p className="text-slate-600 text-sm">
              Complete your profile with skills, experience, education, and upload your resume.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Step 3: Track Status</h3>
            <p className="text-slate-600 text-sm">
              Get a reference ID and track your application status in real-time.
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">What You Need</h3>
            <ul className="space-y-2 text-slate-700 text-sm">
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                <span>Valid email address</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                <span>Phone number</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                <span>Your resume (PDF or DOCX)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                <span>Professional details</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Position Openings</h3>
            <ul className="space-y-2 text-slate-700 text-sm">
              <li className="flex gap-2">
                <span className="text-green-600">•</span>
                <span>Software Development</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">•</span>
                <span>Business Analysis</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">•</span>
                <span>Operations & Support</span>
              </li>
              <li className="flex gap-2">
                <span className="text-green-600">•</span>
                <span>Multiple other roles</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Apply?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Apply now and get your unique reference ID to track your application status throughout the interview process.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
          >
            Create Walk-In Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-900 text-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-slate-400">
          <p>© 2026 White Horse Manpower Consultancy Private Limited. All rights reserved.</p>
          <p className="mt-2">Email: hrteamwhmc@gmail.com | Website: www.whitehorsemanpower.in</p>
        </div>
      </div>
    </div>
  );
}
