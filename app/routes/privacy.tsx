import { Link, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-8 font-body">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
        <div className="mb-8">
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#072b7e] mb-6 tracking-tight font-headline">Privacy Policy</h1>
        <p className="text-slate-600 mb-10 leading-relaxed text-base md:text-lg">
          Lucky Luxury PG is committed to protecting the privacy of our residents. This policy outlines how we handle your personal information.
        </p>

        <div className="space-y-10">
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">1. Information Collection</h3>
            <p className="text-slate-600 mb-3">We collect personal information including, but not limited to:</p>
            <ul className="list-disc pl-5 space-y-3 text-slate-600 leading-relaxed">
              <li>Name, contact details, and permanent address.</li>
              <li>Government-issued identification (Aadhar, PAN, Passport, etc.).</li>
              <li>Emergency contact information.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">2. Use of Information</h3>
            <p className="text-slate-600 mb-3">Your information is used strictly for:</p>
            <ul className="list-disc pl-5 space-y-3 text-slate-600 leading-relaxed">
              <li>Verifying identity and maintaining residency records.</li>
              <li>Complying with local law enforcement requirements (Police Verification).</li>
              <li>Communicating regarding rent, maintenance, or emergency situations.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">3. CCTV Surveillance</h3>
            <ul className="list-disc pl-5 space-y-3 text-slate-600 leading-relaxed">
              <li>Video footage is recorded for security and safety purposes.</li>
              <li>Access to this footage is restricted to authorized management personnel and will only be shared with law enforcement agencies if required by law.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">4. Data Security</h3>
            <ul className="list-disc pl-5 space-y-3 text-slate-600 leading-relaxed">
              <li>We implement physical and digital security measures to protect your personal documents and data from unauthorized access.</li>
              <li>We do not sell or share your personal data with third-party marketing firms.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">5. Contact Information</h3>
            <p className="text-slate-600 mb-3 leading-relaxed">
              For any queries regarding these terms or your privacy, please contact:
            </p>
            <ul className="list-none space-y-2 text-slate-600">
              <li><strong className="text-slate-900">Lucky Luxury PG Management</strong></li>
              <li><strong className="text-slate-900">Phone:</strong> 9303003073 / 8390906050</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
