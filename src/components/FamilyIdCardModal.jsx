import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  Printer, 
  Download, 
  ShieldCheck, 
  Building2, 
  Users, 
  Phone, 
  MapPin, 
  Home, 
  CreditCard, 
  Sparkles,
  FileText,
  BadgeCheck,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function FamilyIdCardModal({ family, isOpen, onClose }) {
  const { language } = useAuth();
  const [cardFormat, setCardFormat] = useState('smartcard'); // 'smartcard' | 'certificate'
  const printAreaRef = useRef(null);

  if (!isOpen || !family) return null;

  const isHindi = language === 'hi';
  const headName = family.familyHeadNameHindi || family.familyHeadNameEnglish || family.familyHeadName || 'मुखिया';
  const fatherName = family.fatherNameHindi || family.fatherNameEnglish || family.fatherName || '-';
  const villageName = family.village || 'समोड़ी (Samodi)';
  const membersCount = Array.isArray(family.members) ? family.members.length : 1;
  const issueDate = new Date().toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Verification URL for QR code
  const verificationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/verify/${family.id}`
    : `https://villagepulse.in/verify/${family.id}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById('family-qr-code-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${family.id}_QR_Code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Control Bar (Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>{isHindi ? 'डिजिटल ग्राम परिवार पहचान पत्र' : 'Digital Gram Family ID Card'}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300">
                  {family.id}
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isHindi ? 'सत्यापित क्यूआर कोड सहित आधिकारिक पहचान पत्र' : 'Official Panchayat ID card with tamper-proof QR verification'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format Switcher */}
            <div className="hidden sm:flex items-center p-1 bg-gray-200 dark:bg-gray-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCardFormat('smartcard')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  cardFormat === 'smartcard'
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{isHindi ? 'स्मार्ट कार्ड' : 'Smart Card'}</span>
              </button>
              <button
                type="button"
                onClick={() => setCardFormat('certificate')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  cardFormat === 'certificate'
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isHindi ? 'प्रमाण पत्र (A4)' : 'Certificate'}</span>
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{isHindi ? 'प्रिंट करें' : 'Print'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950/60">
          
          {/* Format Toggle for Mobile (Hidden on larger screens) */}
          <div className="sm:hidden flex items-center p-1 bg-gray-200 dark:bg-gray-800 rounded-xl text-xs font-semibold mb-4 w-full">
            <button
              type="button"
              onClick={() => setCardFormat('smartcard')}
              className={`flex-1 py-1.5 rounded-lg text-center ${
                cardFormat === 'smartcard'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {isHindi ? 'स्मार्ट कार्ड' : 'Smart Card'}
            </button>
            <button
              type="button"
              onClick={() => setCardFormat('certificate')}
              className={`flex-1 py-1.5 rounded-lg text-center ${
                cardFormat === 'certificate'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {isHindi ? 'प्रमाण पत्र' : 'Certificate'}
            </button>
          </div>

          {/* ============================================================== */}
          {/* PRINTABLE CARD CONTAINER */}
          {/* ============================================================== */}
          <div ref={printAreaRef} className="w-full flex flex-col items-center">
            
            {/* FORMAT A: SMART PVC CARD (Compact Pocket ID) */}
            {cardFormat === 'smartcard' && (
              <div className="id-card-print-area w-full max-w-[560px] bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-indigo-200 text-gray-900 relative">
                
                {/* Government Indian Tricolor Top Ribbon */}
                <div className="h-2 w-full flex">
                  <div className="flex-1 bg-orange-500"></div>
                  <div className="flex-1 bg-white"></div>
                  <div className="flex-1 bg-green-600"></div>
                </div>

                {/* Card Header */}
                <div className="px-5 pt-3 pb-2.5 bg-gradient-to-r from-emerald-800 via-green-800 to-teal-900 text-white flex items-center justify-between border-b border-green-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 p-1 flex items-center justify-center shrink-0">
                      <img 
                        src="/logo.png" 
                        alt="Panchayat Logo" 
                        className="w-full h-full object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <Building2 className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <div className="text-[10px] tracking-wider uppercase text-amber-300 font-bold leading-tight">
                        ग्राम पंचायत प्रशासन • राजस्थान
                      </div>
                      <h3 className="text-sm sm:text-base font-extrabold tracking-tight leading-tight">
                        ग्राम परिवार पहचान पत्र
                      </h3>
                      <p className="text-[9px] text-green-200">
                        GRAM FAMILY DIGITAL IDENTITY CARD
                      </p>
                    </div>
                  </div>

                  {/* ID Badge */}
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-md bg-amber-400 text-gray-950 font-black font-mono text-xs shadow-xs tracking-wider">
                      {family.id}
                    </span>
                    <p className="text-[9px] text-green-200 mt-0.5">
                      {villageName.split(' ')[0]}
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-center sm:items-start relative bg-gradient-to-br from-white via-emerald-50/20 to-indigo-50/30">
                  
                  {/* Watermark Emblem */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                    <ShieldCheck className="w-64 h-64 text-indigo-900" />
                  </div>

                  {/* Left Column: Photo / Avatar & QR Code */}
                  <div className="flex sm:flex-col items-center gap-3 shrink-0">
                    {/* Head Avatar */}
                    <div className="w-20 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center p-1.5 shadow-inner relative overflow-hidden">
                      <Users className="w-8 h-8 text-gray-400 mb-1" />
                      <span className="text-[9px] font-semibold text-gray-500 leading-tight">
                        {isHindi ? 'मुखिया' : 'Head'}
                      </span>
                      <div className="absolute bottom-0 inset-x-0 bg-green-700 text-white text-[7px] font-bold py-0.5 text-center">
                        सत्यापित
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-xs flex flex-col items-center">
                      <QRCodeSVG
                        id="family-qr-code-svg"
                        value={verificationUrl}
                        size={84}
                        level="M"
                        includeMargin={false}
                      />
                      <span className="text-[8px] font-bold text-gray-500 mt-1 font-mono">
                        SCAN TO VERIFY
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Family Details Grid */}
                  <div className="flex-1 w-full space-y-2 text-xs">
                    
                    {/* Head Name */}
                    <div className="border-b border-gray-200/80 pb-1.5">
                      <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider block">
                        {isHindi ? 'परिवार के मुखिया का नाम' : 'Head of Family'}
                      </span>
                      <h4 className="text-base font-extrabold text-gray-900 leading-tight">
                        {headName}
                      </h4>
                      {family.familyHeadNameEnglish && family.familyHeadNameHindi && (
                        <p className="text-[11px] text-gray-600 font-medium">
                          {family.familyHeadNameEnglish}
                        </p>
                      )}
                    </div>

                    {/* 2-Column Info Grid */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] pt-0.5">
                      <div>
                        <span className="text-[10px] text-gray-500 block">
                          {isHindi ? 'पिता/पति का नाम:' : "Father/Husband:"}
                        </span>
                        <span className="font-bold text-gray-800">{fatherName}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-500 block">
                          {isHindi ? 'गाँव / क्षेत्र:' : 'Village / Area:'}
                        </span>
                        <span className="font-bold text-gray-800">{villageName}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-500 block">
                          {isHindi ? 'मोहल्ला:' : 'Mohalla:'}
                        </span>
                        <span className="font-bold text-gray-800">{family.mohalla || '-'}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-500 block">
                          {isHindi ? 'जाति / श्रेणी:' : 'Caste / Category:'}
                        </span>
                        <span className="font-bold text-gray-800">
                          {family.caste || '-'} {family.category ? `(${family.category})` : ''}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-500 block">
                          {isHindi ? 'मोबाइल नंबर:' : 'Mobile Number:'}
                        </span>
                        <span className="font-bold font-mono text-gray-800">
                          {family.mobile ? `${family.mobile.slice(0, 5)} ${family.mobile.slice(5)}` : '-'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-500 block">
                          {isHindi ? 'कुल सदस्य:' : 'Total Members:'}
                        </span>
                        <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded text-[11px]">
                          {membersCount} {isHindi ? 'सदस्य' : 'Members'}
                        </span>
                      </div>
                    </div>

                    {/* Document Badges */}
                    <div className="pt-2 flex flex-wrap gap-1.5 text-[10px]">
                      {family.janAadhaarNumber && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono">
                          जन-आधार: {family.janAadhaarNumber}
                        </span>
                      )}
                      {family.rationCardNumber && (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                          राशन: {family.rationCardNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Bar */}
                <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-[9px] text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                    <span>ग्रामपल्स डिजिटल पंचायत पोर्टल द्वारा जारी</span>
                  </div>
                  <div className="text-right">
                    <span>जारी तिथि: {issueDate}</span>
                  </div>
                </div>

                {/* Bottom Tricolor Accent */}
                <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-white to-green-600"></div>
              </div>
            )}

            {/* FORMAT B: OFFICIAL A4 PARIVAR PRAMAN PATRA (Certificate Layout) */}
            {cardFormat === 'certificate' && (
              <div className="certificate-print-area w-full max-w-[720px] bg-white rounded-2xl shadow-xl overflow-hidden border-8 border-double border-indigo-950 p-6 sm:p-8 text-gray-900 relative">
                
                {/* Official Border Corner Accents */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-900"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-900"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-900"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-900"></div>

                {/* Certificate Header */}
                <div className="text-center pb-4 border-b-2 border-gray-300 relative">
                  <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-indigo-50 border border-indigo-200 p-2 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-indigo-900" />
                  </div>
                  <h2 className="text-xs uppercase tracking-widest text-indigo-900 font-bold">
                    कार्यालय ग्राम पंचायत • समौड़ी / कोटड़ी
                  </h2>
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-1 tracking-wide">
                    ग्राम परिवार विवरण एवं पहचान प्रमाण पत्र
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">
                    (VILLAGE FAMILY SURVEY & CITIZEN REGISTRATION CERTIFICATE)
                  </p>

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-600 px-4">
                    <span><strong>प्रमाण पत्र क्र.:</strong> GP/{family.id}</span>
                    <span className="font-bold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
                      परिवार क्रमांक: {family.id}
                    </span>
                    <span><strong>दिनांक:</strong> {issueDate}</span>
                  </div>
                </div>

                {/* Certificate Core Information */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="sm:col-span-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div>
                        <span className="text-gray-500 block">मुखिया का नाम:</span>
                        <strong className="text-sm text-gray-900">{headName}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">पिता/पति का नाम:</span>
                        <strong className="text-sm text-gray-900">{fatherName}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">गाँव:</span>
                        <strong className="text-gray-800">{villageName}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">मोहल्ला:</span>
                        <strong className="text-gray-800">{family.mohalla || '-'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">जाति व वर्ग:</span>
                        <strong className="text-gray-800">{family.caste || '-'} ({family.category || 'General'})</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block">मोबाइल नंबर:</span>
                        <strong className="text-gray-800 font-mono">{family.mobile || '-'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Verification Box */}
                  <div className="p-3 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center shadow-xs">
                    <QRCodeSVG
                      value={verificationUrl}
                      size={96}
                      level="H"
                      includeMargin={false}
                    />
                    <p className="text-[10px] text-gray-500 mt-2 font-mono">
                      डिजिटल सत्यापन क्यूआर कोड
                    </p>
                    <span className="text-[8px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-bold mt-1">
                      VERIFIED BY GRAMPULSE
                    </span>
                  </div>
                </div>

                {/* Member Roster Table */}
                <div className="mt-5">
                  <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center justify-between">
                    <span>परिवार के सदस्यों का विवरण (कुल: {membersCount})</span>
                    <span className="text-[10px] font-normal text-gray-500">स्रोत: ग्राम सर्वे रिकॉर्ड</span>
                  </h4>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-1.5 w-8">क्र.</th>
                          <th className="px-3 py-1.5">सदस्य का नाम</th>
                          <th className="px-3 py-1.5">संबंध</th>
                          <th className="px-3 py-1.5">उम्र</th>
                          <th className="px-3 py-1.5">लिंग</th>
                          <th className="px-3 py-1.5">व्यवसाय</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {Array.isArray(family.members) && family.members.map((m, idx) => (
                          <tr key={idx} className={idx === 0 ? 'bg-amber-50/40 font-semibold' : ''}>
                            <td className="px-3 py-1 text-gray-500">{idx + 1}</td>
                            <td className="px-3 py-1 text-gray-900">{m.nameHindi || m.nameEnglish || m.name || headName}</td>
                            <td className="px-3 py-1 text-gray-700">{m.relation || (idx === 0 ? 'मुखिया' : 'सदस्य')}</td>
                            <td className="px-3 py-1 text-gray-700">{m.age || '-'} वर्ष</td>
                            <td className="px-3 py-1 text-gray-700">{m.gender || 'Male'}</td>
                            <td className="px-3 py-1 text-gray-700">{m.occupation || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Action Row Under Card */}
          <div className="no-print mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-sm font-bold shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>{isHindi ? 'पहचान पत्र प्रिंट करें' : 'Print ID Card'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQr}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold shadow-xs transition-all"
            >
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{isHindi ? 'क्यूआर कोड डाउनलोड करें' : 'Download QR'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
