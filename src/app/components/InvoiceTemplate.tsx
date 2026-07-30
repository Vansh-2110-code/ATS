import { Printer } from 'lucide-react';

interface InvoiceCandidate {
  sl: number;
  eid: string;
  name: string;
  doj: string;
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
  panNumber?: string;
  lutExpiry?: string;
  requesterName?: string;
  taxType: string;
  candidates: InvoiceCandidate[];
  totalAmount: number;
  igst: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  amountInWords: string;
  onPrint?: () => void;
}

export function InvoiceTemplate({
  invoiceNumber,
  invoiceDate,
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
  lutExpiry,
  lutApplied,
  locationName,
  panNumber,
  requesterName,
  taxType,
  candidates,
  totalAmount,
  igst,
  cgst,
  sgst,
  grandTotal,
  amountInWords,
  onPrint,
}: InvoiceTemplateProps) {
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
          Print Invoice
        </button>
      </div>

      {/* Invoice Document */}
      <div
        id="invoice-printable"
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 space-y-6"
        style={{ pageBreakAfter: 'avoid', fontFamily: 'Arial, sans-serif' }}
      >
        {/* ─── SECTION 1: HEADER ─── */}
        <div className="border-b-2 border-slate-300 pb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1">
              <h1 className="text-3xl text-blue-700" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                INVOICE
              </h1>
              <p className="text-xs text-slate-500" style={{ fontWeight: 500 }}>
                # {invoiceNumber}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-slate-800" style={{ fontWeight: 700 }}>
                White Horse Manpower Consultancy Private Limited
              </p>
              <p className="text-xs text-slate-500">hrteamwhmc@gmail.com</p>
              <p className="text-xs text-slate-500">www.whitehorsemanpower.in</p>
              <p className="text-xs text-slate-400">GSTIN: {gstNumber || '27ABCDE1234F1Z0'}</p>
            </div>
          </div>
        </div>

        {/* ─── SECTION 2: BILLING DETAILS ─── */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs text-slate-500 mb-2" style={{ fontWeight: 600 }}>
              BILL TO
            </p>
            <div className="space-y-1">
              <p className="text-sm text-slate-800" style={{ fontWeight: 600 }}>
                {clientName}
              </p>
              <p className="text-xs text-slate-600">{clientAddress}</p>
              <p className="text-xs text-slate-600">
                {clientCity}, {clientState} {clientPin}
              </p>
              <p className="text-xs text-slate-600">{clientCountry}</p>
              {clientGST && <p className="text-xs text-slate-600">GST: {clientGST}</p>}
            </div>
          </div>

          {/* ─── SECTION 3: INVOICE DETAILS ─── */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Invoice Number</span>
              <span className="text-slate-800" style={{ fontWeight: 600 }}>
                {invoiceNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Invoice Date</span>
              <span className="text-slate-800" style={{ fontWeight: 600 }}>
                {new Date(invoiceDate).toLocaleDateString('en-IN')}
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
            {panNumber && (
              <div className="flex justify-between">
                <span className="text-slate-600">PAN Number</span>
                <span className="text-slate-800" style={{ fontWeight: 600 }}>
                  {panNumber}
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
            {lutExpiry && (
              <div className="flex justify-between">
                <span className="text-slate-600">LUT Expiry Date</span>
                <span className="text-slate-800" style={{ fontWeight: 600 }}>
                  {new Date(lutExpiry).toLocaleDateString('en-IN')}
                </span>
              </div>
            )}
            {requesterName && (
              <div className="flex justify-between">
                <span className="text-slate-600">Requester (HR)</span>
                <span className="text-slate-800" style={{ fontWeight: 600 }}>
                  {requesterName}
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
            BILLING DETAILS
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
                    Designation Level
                  </th>
                  <th className="px-3 py-2 text-left text-slate-700 text-xs" style={{ fontWeight: 600 }}>
                    Location
                  </th>
                  <th className="px-3 py-2 text-right text-slate-700 text-xs" style={{ fontWeight: 600 }}>
                    Amount (₹)
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
                    <td className="px-3 py-2.5 text-slate-600">
                      {new Date(candidate.doj).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{candidate.designation}</td>
                    <td className="px-3 py-2.5 text-slate-600">{candidate.location}</td>
                    <td className="px-3 py-2.5 text-right text-slate-800" style={{ fontWeight: 600 }}>
                      {candidate.amount.toLocaleString('en-IN')}
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
              <span className="text-slate-600">Total Amount</span>
              <span className="text-slate-800" style={{ fontWeight: 600 }}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            {taxType === 'IGST@18' && (
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-600">
                  IGST @18% {lutApplied ? '(LUT Applied)' : ''}
                </span>
                <span className="text-slate-800" style={{ fontWeight: 600 }}>
                  ₹{igst.toLocaleString('en-IN')}
                </span>
              </div>
            )}
            {taxType === 'SGST@9' && (
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-600">
                  SGST @9% {lutApplied ? '(LUT Applied)' : ''}
                </span>
                <span className="text-slate-800" style={{ fontWeight: 600 }}>
                  ₹{sgst.toLocaleString('en-IN')}
                </span>
              </div>
            )}
            {taxType === 'CGST@9' && (
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-600">
                  CGST @9% {lutApplied ? '(LUT Applied)' : ''}
                </span>
                <span className="text-slate-800" style={{ fontWeight: 600 }}>
                  ₹{cgst.toLocaleString('en-IN')}
                </span>
              </div>
            )}
            {taxType === 'CGST@9_SGST@9' && (
              <>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-600">
                    CGST @9% {lutApplied ? '(LUT Applied)' : ''}
                  </span>
                  <span className="text-slate-800" style={{ fontWeight: 600 }}>
                    ₹{cgst.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-600">
                    SGST @9% {lutApplied ? '(LUT Applied)' : ''}
                  </span>
                  <span className="text-slate-800" style={{ fontWeight: 600 }}>
                    ₹{sgst.toLocaleString('en-IN')}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between bg-slate-50 px-3 py-2.5 rounded mt-3">
              <span className="text-slate-800" style={{ fontWeight: 700 }}>
                GRAND TOTAL
              </span>
              <span className="text-slate-800 text-base" style={{ fontWeight: 700 }}>
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* ─── SECTION 6: AMOUNT IN WORDS ─── */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-xs text-blue-700 mb-2" style={{ fontWeight: 600 }}>
            AMOUNT IN WORDS
          </p>
          <p className="text-sm text-blue-900" style={{ fontWeight: 600 }}>
            {amountInWords}
          </p>
        </div>

        {/* ─── SECTION 7: FOOTER ─── */}
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
                Payment Terms: As per agreement
                <br />
                Validity: 30 days from invoice date
              </p>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="text-center border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-400">
              This is a computer-generated invoice and is valid without a signature.
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
          #invoice-printable {
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
