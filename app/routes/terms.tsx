import { Link, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export default function TermsAndConditions() {
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
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#072b7e] mb-6 tracking-tight font-headline">Terms and Conditions for Lucky Luxury PG</h1>
        <p className="text-slate-600 mb-10 leading-relaxed text-base md:text-lg">
          Welcome to Lucky Luxury PG. By residing at our premises, you agree to comply with and be bound by the following terms and conditions. Please review them carefully.
        </p>

        <div className="space-y-10">
          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">1. Admission and Documentation</h3>
            <ul className="list-disc pl-5 space-y-3 text-slate-600 leading-relaxed">
              <li>All residents must submit a completed Application Form along with a valid Government-issued ID and Address Proof on the date of joining.</li>
              <li>Admission is subject to management approval and verification of documents.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">2. Rent and Payment Terms</h3>
            <ul className="list-disc pl-5 space-y-3 text-slate-600 leading-relaxed">
              <li>Monthly rent must be paid in full on or before the <strong className="text-slate-900">5th of every month</strong>.</li>
              <li>Late payments may incur additional charges as per management discretion.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">3. Move-out / Vacating Policy</h3>
            <ul className="list-disc pl-5 space-y-3 text-slate-600 leading-relaxed">
              <li><strong className="text-slate-900">Notice Period:</strong> A minimum of <strong className="text-slate-900">20 days' prior notice</strong> must be given before vacating the PG.</li>
              <li><strong className="text-slate-900">Registration:</strong> Notice must be officially recorded in the 'Notice Register' located at the office. Verbal notices will not be accepted or recognized.</li>
              <li><strong className="text-slate-900">Checkout Date:</strong> Residents must check out on or before the <strong className="text-slate-900">30th of the month</strong>.</li>
              <li><strong className="text-slate-900">Security Deposit:</strong> The deposit will be refunded only if the notice is properly registered in the Notice Register. A mandatory <strong className="text-slate-900">Maintenance Charge of Rs. 500</strong> will be deducted from the deposit at the time of vacating.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">4. General Conduct and Safety</h3>
            <ul className="list-disc pl-5 space-y-3 text-slate-600 leading-relaxed">
              <li><strong className="text-slate-900">Travel Notification:</strong> Guests must inform management before leaving for their home or native place for a duration exceeding 2 days.</li>
              <li><strong className="text-slate-900">Security of Valuables:</strong> Residents are responsible for their own belongings. Valuables should be kept in cupboards, and flats must be locked before leaving. The management is not responsible for any loss or theft.</li>
              <li><strong className="text-slate-900">Behavior:</strong> Misbehavior, rowdiness, or creating a disturbance is strictly prohibited. Residents must maintain silence within the building premises.</li>
              <li><strong className="text-slate-900">Visitors:</strong> Outsiders and visitors are not allowed on the premises without explicit permission from the management.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">5. Maintenance and Complaints</h3>
            <ul className="list-disc pl-5 space-y-3 text-slate-600 leading-relaxed">
              <li>Maintenance issues (Electrical, Plumbing, Cleaning, Wi-Fi, Food, etc.) should be reported by making an entry in the 'Complaint Register' available at the office.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">6. Surveillance</h3>
            <ul className="list-disc pl-5 space-y-3 text-slate-600 leading-relaxed">
              <li>For the safety of all residents, the PG premises are under 24/7 CCTV surveillance.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
