import { FileText, Printer } from 'lucide-react';

interface LetterOfUndertakingProps {
  candidateName: string;
  gender: 'Male' | 'Female' | 'Other';
  guardianName: string;
  permanentAddress: string;
  positionApplied: string;
  salaryOffered: string;
  targetAssignment: string;
  trainingDurationDays: number;
  undertakingAccepted: boolean;
  onAcceptanceChange: (accepted: boolean) => void;
}

export function LetterOfUndertaking({
  candidateName,
  gender,
  guardianName,
  permanentAddress,
  positionApplied,
  salaryOffered,
  targetAssignment,
  trainingDurationDays,
  undertakingAccepted,
  onAcceptanceChange,
}: LetterOfUndertakingProps) {
  const getGenderPrefix = () => {
    if (gender === 'Male') return 'Mr.';
    if (gender === 'Female') return 'Ms.';
    return '';
  };

  const handlePrint = () => {
    const element = document.getElementById('letter-of-undertaking-printable');
    if (element) {
      window.print();
    }
  };

  return (
    <div className="space-y-4">
      {/* Print Button */}
      <div className="flex justify-end">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          title="Print letter for PDF download"
        >
          <Printer className="w-4 h-4" />
          Print Letter
        </button>
      </div>

      {/* Letter Document */}
      <div
        id="letter-of-undertaking-printable"
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 space-y-6"
        style={{ pageBreakAfter: 'avoid', fontFamily: 'Georgia, serif' }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-slate-300 pb-6">
          <h1 className="text-slate-800 text-xl" style={{ fontWeight: 700 }}>
            LETTER OF UNDERTAKING
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            In consideration of my appointment as {positionApplied} with Whitehorse Manpower
          </p>
        </div>

        {/* Body */}
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            To,
            <br />
            <span style={{ fontWeight: 600 }}>Whitehorse Manpower</span>
            <br />
            Bengaluru, India
          </p>

          <p>
            <span style={{ fontWeight: 600 }}>Date:</span> {new Date().toLocaleDateString('en-IN')}
          </p>

          <p>
            <span style={{ fontWeight: 600 }}>Dear Sir/Madam,</span>
          </p>

          <p>
            I, <span style={{ fontWeight: 600 }}>{getGenderPrefix()} {candidateName}</span>, son/daughter of{' '}
            <span style={{ fontWeight: 600 }}>{guardianName}</span>, hereby undertake and solemnly declare
            that I have read and understood all the terms and conditions of employment and hereby agree to be
            bound by them.
          </p>

          {/* Clauses */}
          <div className="space-y-3 ml-4">
            <p>
              <span style={{ fontWeight: 600 }}>1.</span> I hereby declare that all the information furnished by
              me in my application and joining form is true, correct, and complete to the best of my knowledge. I
              undertake full responsibility for any inaccuracy, false, misleading, or incomplete information.
            </p>

            <p>
              <span style={{ fontWeight: 600 }}>2.</span> I shall abide by all the rules and regulations framed
              by Whitehorse Manpower from time to time and shall follow all instructions given by my reporting
              manager.
            </p>

            <p>
              <span style={{ fontWeight: 600 }}>3.</span> I understand that I shall be on probation for a period
              of {trainingDurationDays} days from the date of joining, during which my performance will be
              evaluated.
            </p>

            <p>
              <span style={{ fontWeight: 600 }}>4.</span> I assure that I am medically fit and do not suffer from
              any ailment that would disqualify me from performing my duties. I shall inform the management of any
              medical condition that may arise during my service.
            </p>

            <p>
              <span style={{ fontWeight: 600 }}>5.</span> I hereby undertake to maintain absolute confidentiality
              of all proprietary, confidential, and trade secret information of the company to which I have access,
              both during and after my employment. This obligation shall continue indefinitely.
            </p>

            <p>
              <span style={{ fontWeight: 600 }}>6.</span> I agree to submit to the company all documents required
              for KYC compliance including but not limited to PAN, Aadhaar, bank details, and any other documents
              as requested by the HR department.
            </p>

            <p>
              <span style={{ fontWeight: 600 }}>7.</span> I undertake to resolve any issues or discrepancies in my
              employment records within 15 days of joining. I acknowledge that no claims will be entertained after
              this period.
            </p>

            <p>
              <span style={{ fontWeight: 600 }}>8.</span> I hereby declare that I shall maintain two family
              references (preferably not parents/guardians) and keep their contact information up-to-date for the
              company's records.
            </p>

            <p>
              <span style={{ fontWeight: 600 }}>9.</span> I understand and accept the salary structure as offered
              by the company. I am fully aware of my duties, responsibilities, and target assignment{' '}
              <span style={{ fontWeight: 600 }}>({targetAssignment})</span> as agreed.
            </p>
          </div>

          <p className="mt-6">
            <span style={{ fontWeight: 600 }}>Position Applied:</span> {positionApplied}
          </p>

          <p>
            <span style={{ fontWeight: 600 }}>Annual Salary Offered:</span> ₹{salaryOffered}
          </p>

          <p>
            <span style={{ fontWeight: 600 }}>Address:</span> {permanentAddress}
          </p>

          <p className="mt-6">
            I hereby solemnly declare that I shall abide by all the above conditions and shall not hold the
            company responsible for any issues arising from non-compliance with the same.
          </p>

          <p className="mt-8">
            <span style={{ fontWeight: 600 }}>Yours faithfully,</span>
          </p>

          {/* Signature Area */}
          <div className="pt-12 space-y-1">
            <p style={{ textDecoration: 'underline', height: '40px', marginBottom: '8px' }} />
            <p className="text-xs text-slate-500">Signature of Candidate</p>
            <p className="text-sm" style={{ fontWeight: 600 }}>
              {getGenderPrefix()} {candidateName}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-4 text-center text-xs text-slate-400 mt-12">
          <p>This is a computer-generated document and is valid with digital signature or acceptance.</p>
          <p className="mt-1">For queries, contact HR Department</p>
        </div>
      </div>

      {/* Acceptance Checkbox */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 space-y-4">
        <p className="text-sm text-amber-900" style={{ fontWeight: 600 }}>
          Letter of Undertaking Acceptance
        </p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={undertakingAccepted}
            onChange={(e) => onAcceptanceChange(e.target.checked)}
            className="mt-1 w-5 h-5 accent-amber-600 cursor-pointer"
          />
          <span className="text-sm text-amber-900">
            ✅ I have read and understood all the terms and conditions mentioned in the Letter of Undertaking
            and hereby accept them.
          </span>
        </label>
        {!undertakingAccepted && (
          <p className="text-xs text-amber-700" style={{ fontWeight: 600 }}>
            You must accept this undertaking to proceed with form submission.
          </p>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          #letter-of-undertaking-printable {
            box-shadow: none;
            border: none;
            page-break-inside: avoid;
            max-width: 100%;
          }
          button {
            display: none;
          }
          .bg-amber-50 {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
