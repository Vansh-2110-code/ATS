import { Printer } from 'lucide-react';

interface InvoiceCandidate {
  sl: number;
  eid: string;
  name: string;
  doj: string;
  exitDate?: string;
  duration?: number;
  designation: string;
  location: string;
  amount: number;
}

interface InvoiceTemplateProps {
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  clientAddress: string;
  clientCity: string;
  clientState: string;
  clientPin: string;
  clientCountry: string;
  clientGST: string;
  gstNumber: string;
  sacCode: string;
  lutArn: string;
  lutApplied: boolean;
  locationName: string;
  candidates: InvoiceCandidate[];
  totalAmount: number;
  igst: number;
  grandTotal: number;
  amountInWords: string;
  onPrint?: () => void;
}

interface CreditNoteTemplateProps extends InvoiceTemplateProps {
  creditNoteNumber: string;
  referenceInvoiceNumber: string;
  reason: string;
}

export function CreditNoteTemplate({
  creditNoteNumber,
  invoiceDate,
  referenceInvoiceNumber,
  clientName,
  clientAddress,
  clientCity,
  clientState,
  clientPin,
  clientCountry,
  clientGST,
  gstNumber,
  sacCode,
  lutArn,
  lutApplied,
  locationName,
  candidates,
  totalAmount,
  igst,
  grandTotal,
  amountInWords,
  reason,
  onPrint,
}: CreditNoteTemplateProps) {
  const handlePrint = () => {
    if (onPrint) onPrint();
    else window.print();
  };

  return (
    <div className="space-y-4">
      {/* Print Button */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          title="Print or download as PDF"
        >
          <Printer className="w-4 h-4" />
          Print Credit Note
        </button>
      </div>

      {/* Credit Note Document */}
      <div
        id="creditnote-printable"
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 space-y-6"
        style={{ pageBreakAfter: 'avoid', fontFamily: 'Arial, sans-serif' }}
      >
        {/* ─── SECTION 1: HEADER ─── */}
        <div className="border-b-4 border-slate-800 pb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="bg-slate-800 text-white px-4 py-1.5 rounded-sm inline-block mb-3">
                <h1 className="text-xl tracking-widest" style={{ fontWeight: 800 }}>
                  CREDIT NOTE
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-bold tracking-wider uppercase">
                Document Number
              </p>
              <p className="text-lg text-slate-800" style={{ fontWeight: 700 }}>
                {creditNoteNumber}
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-xl text-slate-800 leading-tight" style={{ fontWeight: 800 }}>
                WHITE HORSE <br /> 
                <span className="text-sm font-semibold text-slate-500 tracking-wide uppercase">Manpower Consultancy Pvt Ltd</span>
              </h2>
              <div className="mt-4 text-xs text-slate-500 space-y-0.5">
                <p className="font-bold text-slate-600">Office: #34, 1st Floor, 2nd Cross,</p>
                <p>RMV 2nd Stage, Bangalore - 560094</p>
                <p>Email: hrteamwhmc@gmail.com</p>
                <p>Web: www.whitehorsemanpower.in</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 2: BILLING DETAILS ─── */}
        <div className="grid grid-cols-2 gap-12">
          <div>
            <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase mb-3">
              CREDIT TO
            </p>
            <div className="space-y-1">
              <p className="text-base text-slate-900" style={{ fontWeight: 700 }}>
                {clientName}
              </p>
              <div className="text-xs text-slate-600 leading-relaxed max-w-[250px]">
                {clientAddress && <p>{clientAddress}</p>}
                <p>
                  {clientCity}{clientState ? `, ${clientState}` : ''} {clientPin}
                </p>
                {clientCountry && <p>{clientCountry}</p>}
              </div>
              {clientGST && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">GST Number</p>
                  <p className="text-xs text-slate-800 font-semibold">{clientGST}</p>
                </div>
              )}
            </div>
          </div>

          {/* ─── SECTION 3: CREDIT NOTE DETAILS ─── */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Credit Note Date</span>
              <span className="text-slate-800" style={{ fontWeight: 600 }}>
                {new Date(invoiceDate).toLocaleDateString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-600">Reference Invoice</span>
              <span className="text-slate-800" style={{ fontWeight: 600 }}>
                {referenceInvoiceNumber}
              </span>
            </div>
            {gstNumber && (
              <div className="flex justify-between">
                <span className="text-slate-600">GST Number</span>
                <span className="text-slate-800" style={{ fontWeight: 600 }}>
                  {gstNumber}
                </span>
              </div>
            )}
            {sacCode && (
              <div className="flex justify-between">
                <span className="text-slate-600">SAC Code</span>
                <span className="text-slate-800" style={{ fontWeight: 600 }}>
                  {sacCode}
                </span>
              </div>
            )}
            {lutArn && (
              <div className="flex justify-between">
                <span className="text-slate-600">LUT ARN</span>
                <span className="text-slate-800" style={{ fontWeight: 600 }}>
                  {lutArn}
                </span>
              </div>
            )}
            {locationName && (
              <div className="flex justify-between">
                <span className="text-slate-600">Location</span>
                <span className="text-slate-800" style={{ fontWeight: 600 }}>
                  {locationName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ─── SECTION 4: CANDIDATE BILLING TABLE ─── */}
        <div>
          <p className="text-xs text-slate-500 mb-3" style={{ fontWeight: 600 }}>
            CREDIT DETAILS
          </p>
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-300">
                <tr>
                  <th className="px-3 py-2 text-left text-slate-700 text-xs" style={{ fontWeight: 600 }}>
                    Sl
                  </th>
                  <th className="px-3 py-2 text-left text-slate-700 text-xs" style={{ fontWeight: 600 }}>
                    EID
                  </th>
                  <th className="px-3 py-2 text-left text-slate-700 text-xs" style={{ fontWeight: 600 }}>
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-slate-700 text-xs" style={{ fontWeight: 600 }}>
                    DOJ
                  </th>
                  <th className="px-3 py-2 text-left text-slate-700 text-xs" style={{ fontWeight: 600 }}>
                    Designation
                  </th>
                  <th className="px-3 py-2 text-left text-slate-700 text-xs" style={{ fontWeight: 600 }}>
                    Location
                  </th>
                  <th className="px-3 py-2 text-left text-slate-700 text-xs" style={{ fontWeight: 600 }}>
                    Exit Date
                  </th>
                  <th className="px-3 py-2 text-left text-slate-700 text-xs" style={{ fontWeight: 600 }}>
                    Duration
                  </th>
                  <th className="px-3 py-2 text-right text-slate-700 text-xs" style={{ fontWeight: 600 }}>
                    Amount Credit (₹)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {candidates.map((candidate) => (
                  <tr key={candidate.sl} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 text-slate-600">{candidate.sl}</td>
                    <td className="px-3 py-2.5 text-slate-600">{candidate.eid}</td>
                    <td className="px-3 py-2.5 text-slate-800" style={{ fontWeight: 500 }}>
                      {candidate.name}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{candidate.doj}</td>
                    <td className="px-3 py-2.5 text-slate-600">{candidate.designation}</td>
                    <td className="px-3 py-2.5 text-slate-600">{candidate.location}</td>
                    <td className="px-3 py-2.5 text-slate-600">
                      {candidate.exitDate ? new Date(candidate.exitDate).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{candidate.duration} days</td>
                    <td className="px-3 py-2.5 text-right text-slate-800" style={{ fontWeight: 600 }}>
                      {(candidate.amount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── SECTION 5 & 6: CALCULATIONS ─── */}
        <div className="grid grid-cols-2 gap-8">
          <div />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-600">Total Amount Credit</span>
              <span className="text-slate-800" style={{ fontWeight: 600 }}>
                ₹{(totalAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-600">
                IGST @18% {lutApplied ? '(LUT Applied)' : ''}
              </span>
              <span className="text-slate-800" style={{ fontWeight: 600 }}>
                ₹{(igst || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between bg-red-50 px-3 py-2.5 rounded mt-3">
              <span className="text-red-800" style={{ fontWeight: 700 }}>
                GRAND TOTAL CREDIT
              </span>
              <span className="text-red-800 text-base" style={{ fontWeight: 700 }}>
                ₹{(grandTotal || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* ─── SECTION 6: AMOUNT IN WORDS ─── */}
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-xs text-red-700 mb-2" style={{ fontWeight: 600 }}>
            AMOUNT IN WORDS
          </p>
          <p className="text-sm text-red-900" style={{ fontWeight: 600 }}>
            {amountInWords}
          </p>
        </div>

        {/* ─── SECTION 7: REASON FOR CREDIT NOTE ─── */}
        <div className="border-l-4 border-orange-300 pl-4 py-2 bg-orange-50">
          <p className="text-xs text-orange-600 mb-1" style={{ fontWeight: 600 }}>
            REASON FOR CREDIT NOTE
          </p>
          <p className="text-sm text-orange-900">{reason}</p>
        </div>

        {/* ─── SECTION 8: FOOTER ─── */}
        <div className="border-t border-slate-200 pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs text-slate-500 mb-2" style={{ fontWeight: 600 }}>
                AUTHORIZED BY
              </p>
              <div style={{ height: '50px' }} />
              <p className="text-xs text-slate-600 mt-1">Authorized Signatory</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-2" style={{ fontWeight: 600 }}>
                TERMS & CONDITIONS
              </p>
              <p className="text-xs text-slate-600">
                This credit note reverses the billing for the candidate exit.
                <br />
                Credit validity: 30 days from issuance
              </p>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="text-center border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-400">
              This is a computer-generated credit note and is valid without a signature.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              For queries, contact HR Department | hrteamwhmc@gmail.com
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          #creditnote-printable {
            box-shadow: none;
            border: none;
            page-break-inside: avoid;
            border-radius: 0;
            max-width: 100%;
          }
          button {
            display: none;
          }
          .space-y-4 > div:first-child {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
