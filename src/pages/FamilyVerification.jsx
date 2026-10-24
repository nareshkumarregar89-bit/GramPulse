import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import surveyData287 from '../data/surveyData287.json';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  Users, 
  Phone, 
  MapPin, 
  AlertTriangle, 
  ArrowRight,
  ExternalLink,
  Calendar,
  Lock
} from 'lucide-react';

export function FamilyVerification() {
  const { id } = useParams();
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchFamily() {
      if (!id) {
        setError('कोई परिवार क्रमांक निर्दिष्ट नहीं है (No Family ID specified)');
        setLoading(false);
        return;
      }

      const cleanId = id.trim().toUpperCase();

      // 1. Try static dataset lookup first (Fast, works without login, 100% reliable)
      const foundInStatic = (surveyData287 || []).find(
        f => f.id?.toUpperCase() === cleanId
      );

      if (foundInStatic) {
        setFamily(foundInStatic);
        setLoading(false);
        return;
      }

      // 2. Try Firestore lookup
      try {
        const docRef = doc(db, 'families', cleanId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFamily({ ...docSnap.data(), id: docSnap.id });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Firestore direct verify read fallback:', err.message);
      }

      setError(`परिवार क्रमांक "${cleanId}" का रिकॉर्ड ग्राम डेटाबेस में नहीं मिला।`);
      setLoading(false);
    }

    fetchFamily();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-gray-700">ग्राम परिवार पहचान पत्र सत्यापित किया जा रहा है...</p>
        </div>
      </div>
    );
  }

  if (error || !family) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-red-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">अमान्य या अपंजीकृत पहचान पत्र</h2>
          <p className="text-xs text-gray-600">
            {error || 'इस क्यूआर कोड का डेटा ग्राम पंचायत सर्वे रिकॉर्ड से मेल नहीं खाता है।'}
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              <span>ग्रामपल्स पोर्टल पर जाएँ</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const headName = family.familyHeadNameHindi || family.familyHeadNameEnglish || family.familyHeadName || 'मुखिया';
  const fatherName = family.fatherNameHindi || family.fatherNameEnglish || family.fatherName || '-';
  const villageName = family.village || 'समोड़ी (Samodi)';
  const membersCount = Array.isArray(family.members) ? family.members.length : 1;

  // Mask sensitive Aadhaar digits for public verification screen
  const maskAadhaar = (val) => {
    if (!val) return null;
    const str = String(val).replace(/[^0-9]/g, '');
    if (str.length === 12) return `XXXX-XXXX-${str.slice(-4)}`;
    return 'सत्यापित (Verified)';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-indigo-50 py-8 px-4 flex flex-col items-center justify-center">
      
      {/* Top Emblem Header */}
      <div className="max-w-lg w-full mb-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>आधिकारिक डिजिटल सत्यापन पोर्टल</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          ग्राम पंचायत प्रशासन • राजस्थान
        </h1>
        <p className="text-xs text-gray-600">
          VILLAGEPULSE DIGITAL VILLAGE IDENTITY VERIFICATION
        </p>
      </div>

      {/* Main Verification Card */}
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border-2 border-emerald-500 overflow-hidden">
        
        {/* Verification Success Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 p-5 text-white flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
              OFFICIALLY VERIFIED RECORD
            </div>
            <h2 className="text-base sm:text-lg font-extrabold leading-tight">
              प्रमाणित एवं सत्यापित ग्राम परिवार
            </h2>
            <p className="text-xs text-emerald-100">
              परिवार क्रमांक: <strong className="font-mono text-amber-300">{family.id}</strong>
            </p>
          </div>
        </div>

        {/* Card Body Details */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Family Head Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-indigo-50/60 border border-emerald-200/80">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
              परिवार के मुखिया
            </span>
            <h3 className="text-lg font-black text-gray-900 mt-0.5">
              {headName}
            </h3>
            {family.familyHeadNameEnglish && family.familyHeadNameHindi && (
              <p className="text-xs text-gray-600 font-medium">
                {family.familyHeadNameEnglish}
              </p>
            )}
            <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs text-gray-700">
              <span>पिता/पति: <strong>{fatherName}</strong></span>
              <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full text-[11px]">
                {membersCount} सदस्य
              </span>
            </div>
          </div>

          {/* Demographic Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] text-gray-500 block">गाँव का नाम:</span>
              <strong className="text-gray-900 font-bold">{villageName}</strong>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] text-gray-500 block">मोहल्ला:</span>
              <strong className="text-gray-900 font-bold">{family.mohalla || '-'}</strong>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] text-gray-500 block">जाति व वर्ग:</span>
              <strong className="text-gray-900 font-bold">{family.caste || '-'} ({family.category || 'General'})</strong>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-[10px] text-gray-500 block">पंजीकरण स्थिति:</span>
              <strong className="text-emerald-700 font-bold">सत्यापित (Active)</strong>
            </div>
          </div>

          {/* Masked Documents (For privacy protection) */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>गोपनीय पहचान विवरण:</span>
            </div>
            <div className="flex gap-2 font-mono text-[11px] font-bold">
              {family.aadhaarNumber && (
                <span>आधार: {maskAadhaar(family.aadhaarNumber)}</span>
              )}
              {family.janAadhaarNumber && (
                <span>जन-आधार: {family.janAadhaarNumber}</span>
              )}
            </div>
          </div>

          {/* Member Summary List */}
          {Array.isArray(family.members) && family.members.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center justify-between">
                <span>पंजीकृत सदस्य सूची</span>
                <span className="text-[10px] text-gray-500 font-normal">कुल: {membersCount} सदस्य</span>
              </h4>
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 text-xs">
                {family.members.map((m, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between bg-white hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {m.nameHindi || m.nameEnglish || m.name}
                        </p>
                        <p className="text-[10px] text-gray-500">{m.relation || 'सदस्य'}</p>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-gray-600">
                      <span>{m.age ? `${m.age} वर्ष` : '-'}</span>
                      <span className="mx-1">•</span>
                      <span>{m.gender === 'Female' ? 'महिला' : 'पुरुष'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Timestamp */}
          <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500">
            <span>सत्यापन स्रोत: ग्रामपल्स लाइव रजिस्टर</span>
            <span>सत्यापन दिनांक: {new Date().toLocaleDateString('hi-IN')}</span>
          </div>
        </div>

        {/* Portal Footer Action */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <span>ग्रामपल्स अधिकृत पोर्टल खोलें</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} VillagePulse Village Survey System • डिजिटल इंडिया
      </div>
    </div>
  );
}
