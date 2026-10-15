import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  FileText,
  Banknote,
  Home,
  Users,
  Image,
  CheckCircle,
  Plus,
  X,
  MapPin,
  ExternalLink,
  Navigation,
  Lock,
  AlertCircle
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const steps = [
  { id: 1, label: 'Family Info', labelHi: 'परिवार विवरण', icon: User },
  { id: 2, label: 'Documents', labelHi: 'दस्तावेज़', icon: FileText },
  { id: 3, label: 'Bank Details', labelHi: 'बैंक विवरण', icon: Banknote },
  { id: 4, label: 'House Info', labelHi: 'आवास विवरण', icon: Home },
  { id: 5, label: 'Members', labelHi: 'सदस्य', icon: Users },
  { id: 6, label: 'Photos', labelHi: 'फ़ोटो', icon: Image },
  { id: 7, label: 'Review', labelHi: 'समीक्षा', icon: CheckCircle },
];

const emptyMember = {
  nameEnglish: '',
  nameHindi: '',
  age: '',
  gender: 'Male',
  relation: '',
  aadhaarNumber: '',
  occupation: '',
  education: '',
  maritalStatus: 'Unmarried'
};

const emptyFamily = {
  familyHeadNameEnglish: '',
  familyHeadNameHindi: '',
  fatherNameEnglish: '',
  fatherNameHindi: '',
  village: '',
  mobile: '',
  alternateMobile: '',
  mohalla: '',
  caste: '',
  address: '',
  houseNumber: '',
  pinCode: '',
  aadhaarNumber: '',
  janAadhaarNumber: '',
  rationCardNumber: '',
  voterId: '',
  bankName: '',
  branch: '',
  accountHolder: '',
  accountNumber: '',
  ifsc: '',
  monthlyIncome: '',
  occupation: '',
  category: 'BPL',
  houseType: 'Pucca',
  waterConnection: true,
  electricityConnection: true,
  toilet: true,
  gasConnection: true,
  familyPhoto: null,
  housePhoto: null,
  latitude: '',
  longitude: '',
  gpsAccuracy: '',
  gpsTimestamp: '',
  surveyorId: '',
  surveyorName: '',
  surveyorEmail: '',
  members: [{ ...emptyMember }]
};

export function NewSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { families, villages, mohallas, castes, addFamily, updateFamily, getFamilyById, t, darkMode, language, selectedVillage } = useData();
  const { addToast } = useToast();
  const { currentUser, userProfile, isAdmin, assignedVillages = [] } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // Check if current user is an unassigned surveyor
  const isUnassigned = !isAdmin && (!assignedVillages || assignedVillages.length === 0 || userProfile?.assignmentStatus === 'Unassigned');

  // Initial village choice respects assigned villages
  const initialVillage = (!isAdmin && assignedVillages.length > 0)
    ? assignedVillages[0]
    : (selectedVillage !== 'all' ? selectedVillage : (villages[0] || ''));

  const [family, setFamily] = useState(() => ({
    ...emptyFamily,
    village: initialVillage
  }));
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Check if editing
  useEffect(() => {
    if (id) {
      const existingFamily = getFamilyById(id);
      if (existingFamily) {
        setFamily(existingFamily);
      }
    }
  }, [id, getFamilyById]);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      setGpsError(language === 'hi' ? 'आपके डिवाइस में जीपीएस समर्थित नहीं है।' : 'Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setFamily(prev => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          gpsAccuracy: Math.round(accuracy),
          gpsTimestamp: new Date().toISOString()
        }));
        setGpsLoading(false);
        addToast(language === 'hi' ? 'जीपीएस लोकेशन सफलतापूर्वक प्राप्त हुई!' : 'GPS coordinates captured!', 'success');
      },
      (err) => {
        setGpsLoading(false);
        let msg = 'Failed to get location';
        if (err.code === 1) msg = language === 'hi' ? 'लोकेशन की अनुमति अस्वीकृत की गई।' : 'Location permission denied.';
        else if (err.code === 2) msg = language === 'hi' ? 'लोकेशन अनुपलब्ध है।' : 'Location unavailable.';
        else if (err.code === 3) msg = language === 'hi' ? 'लोकेशन अनुरोध का समय समाप्त हुआ।' : 'Location request timed out.';
        setGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleSubmit = () => {
    const enrichedFamily = {
      ...family,
      village: family.village || (selectedVillage !== 'all' ? selectedVillage : (villages[0] || 'समोड़ी (Samodi)')),
      surveyorId: family.surveyorId || currentUser?.uid || '',
      surveyorName: family.surveyorName || userProfile?.name || currentUser?.email?.split('@')[0] || 'Admin',
      surveyorEmail: family.surveyorEmail || currentUser?.email || '',
      updatedAt: new Date().toISOString()
    };
    if (id) {
      updateFamily(id, enrichedFamily);
      addToast(language === 'hi' ? 'रिकॉर्ड सफलतापूर्वक अपडेट हुआ!' : 'Family updated successfully!', 'success');
    } else {
      addFamily(enrichedFamily);
      addToast(language === 'hi' ? 'सर्वे सफलतापूर्वक सबमिट हुआ!' : 'Family added successfully!', 'success');
    }
    navigate('/families');
  };

  const addMember = () => {
    setFamily(prev => ({
      ...prev,
      members: [...prev.members, { ...emptyMember, id: Date.now() }]
    }));
  };

  const removeMember = (index) => {
    if (family.members.length > 1) {
      setFamily(prev => ({
        ...prev,
        members: prev.members.filter((_, i) => i !== index)
      }));
    }
  };

  const updateMember = (index, field, value) => {
    setFamily(prev => ({
      ...prev,
      members: prev.members.map((m, i) => i === index ? { ...m, [field]: value } : m)
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('family_info')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label={t('family_head_english')}
                value={family.familyHeadNameEnglish}
                onChange={(v) => setFamily(p => ({ ...p, familyHeadNameEnglish: v }))}
                required
              />
              <InputField
                label={t('family_head_hindi')}
                value={family.familyHeadNameHindi}
                onChange={(v) => setFamily(p => ({ ...p, familyHeadNameHindi: v }))}
                required
              />
              <InputField
                label={t('father_husband_english')}
                value={family.fatherNameEnglish}
                onChange={(v) => setFamily(p => ({ ...p, fatherNameEnglish: v }))}
                required
              />
              <InputField
                label={t('father_husband_hindi')}
                value={family.fatherNameHindi}
                onChange={(v) => setFamily(p => ({ ...p, fatherNameHindi: v }))}
                required
              />
              <InputField
                label={t('mobile')}
                value={family.mobile}
                onChange={(v) => setFamily(p => ({ ...p, mobile: v }))}
                required
              />
              <InputField
                label={t('alternate_mobile')}
                value={family.alternateMobile}
                onChange={(v) => setFamily(p => ({ ...p, alternateMobile: v }))}
              />
              <SelectField
                label={language === 'hi' ? 'गाँव का नाम *' : 'Village Name *'}
                value={family.village || (selectedVillage !== 'all' ? selectedVillage : (villages[0] || ''))}
                onChange={(v) => setFamily(p => ({ ...p, village: v }))}
                options={villages}
                required
              />
              <SelectField
                label={t('mohalla')}
                value={family.mohalla}
                onChange={(v) => setFamily(p => ({ ...p, mohalla: v }))}
                options={mohallas}
                required
              />
              <SelectField
                label={t('caste')}
                value={family.caste}
                onChange={(v) => setFamily(p => ({ ...p, caste: v }))}
                options={castes}
                required
              />
              <InputField
                label={t('house_number')}
                value={family.houseNumber}
                onChange={(v) => setFamily(p => ({ ...p, houseNumber: v }))}
              />
              <InputField
                label={t('pin_code')}
                value={family.pinCode}
                onChange={(v) => setFamily(p => ({ ...p, pinCode: v }))}
              />
              <div className="md:col-span-2">
                <TextAreaField
                  label={t('address')}
                  value={family.address}
                  onChange={(v) => setFamily(p => ({ ...p, address: v }))}
                />
              </div>

              {/* GPS Geotagging Section */}
              <div className="md:col-span-2 p-5 rounded-2xl border border-dashed border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {language === 'hi' ? 'घर की जीपीएस लोकेशन (GPS Geotagging)' : 'House GPS Location (Geotagging)'}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {language === 'hi'
                        ? 'गाँव के घर के सामने खड़े होकर वर्तमान जीपीएस लोकेशन कैप्चर करें।'
                        : 'Capture exact GPS coordinates standing in front of the house.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCaptureGps}
                    disabled={gpsLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all shrink-0 disabled:opacity-60"
                  >
                    {gpsLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{language === 'hi' ? 'लोकेशन ले रहे हैं...' : 'Capturing GPS...'}</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'वर्तमान लोकेशन लें' : 'Capture Current GPS'}</span>
                      </>
                    )}
                  </button>
                </div>

                {gpsError && (
                  <p className="mt-3 text-xs text-red-600 dark:text-red-400 font-medium">
                    ⚠️ {gpsError}
                  </p>
                )}

                {family.latitude && family.longitude && (
                  <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-mono font-medium">
                      <span>✓ Lat: {family.latitude}</span>
                      <span>•</span>
                      <span>Lng: {family.longitude}</span>
                      {family.gpsAccuracy && <span className="text-gray-500 font-sans">(±{family.gpsAccuracy}m)</span>}
                    </div>
                    <a
                      href={`https://maps.google.com/?q=${family.latitude},${family.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {language === 'hi' ? 'गूगल मैप्स पर देखें' : 'View on Google Maps'}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Government Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Aadhaar Number"
                value={family.aadhaarNumber}
                onChange={(v) => setFamily(p => ({ ...p, aadhaarNumber: v }))}
              />
              <InputField
                label="Jan Aadhaar Number"
                value={family.janAadhaarNumber}
                onChange={(v) => setFamily(p => ({ ...p, janAadhaarNumber: v }))}
              />
              <InputField
                label="Ration Card Number"
                value={family.rationCardNumber}
                onChange={(v) => setFamily(p => ({ ...p, rationCardNumber: v }))}
              />
              <InputField
                label="Voter ID"
                value={family.voterId}
                onChange={(v) => setFamily(p => ({ ...p, voterId: v }))}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Bank Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Bank Name"
                value={family.bankName}
                onChange={(v) => setFamily(p => ({ ...p, bankName: v }))}
              />
              <InputField
                label="Branch Name"
                value={family.branch}
                onChange={(v) => setFamily(p => ({ ...p, branch: v }))}
              />
              <InputField
                label="Account Holder Name"
                value={family.accountHolder}
                onChange={(v) => setFamily(p => ({ ...p, accountHolder: v }))}
              />
              <InputField
                label="Account Number"
                value={family.accountNumber}
                onChange={(v) => setFamily(p => ({ ...p, accountNumber: v }))}
              />
              <InputField
                label="IFSC Code"
                value={family.ifsc}
                onChange={(v) => setFamily(p => ({ ...p, ifsc: v }))}
                className="md:col-span-2"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">House Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Monthly Income"
                type="number"
                value={family.monthlyIncome}
                onChange={(v) => setFamily(p => ({ ...p, monthlyIncome: v }))}
              />
              <InputField
                label="Occupation"
                value={family.occupation}
                onChange={(v) => setFamily(p => ({ ...p, occupation: v }))}
              />
              <SelectField
                label="Category"
                value={family.category}
                onChange={(v) => setFamily(p => ({ ...p, category: v }))}
                options={['BPL', 'APL', 'Antyodaya']}
              />
              <SelectField
                label="House Type"
                value={family.houseType}
                onChange={(v) => setFamily(p => ({ ...p, houseType: v }))}
                options={['Pucca', 'Kutcha', 'Semi-Pucca']}
              />
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <ToggleField label="Water Connection" value={family.waterConnection} onChange={(v) => setFamily(p => ({ ...p, waterConnection: v }))} />
                <ToggleField label="Electricity" value={family.electricityConnection} onChange={(v) => setFamily(p => ({ ...p, electricityConnection: v }))} />
                <ToggleField label="Toilet" value={family.toilet} onChange={(v) => setFamily(p => ({ ...p, toilet: v }))} />
                <ToggleField label="Gas Connection" value={family.gasConnection} onChange={(v) => setFamily(p => ({ ...p, gasConnection: v }))} />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Family Members</h2>
              <button
                onClick={addMember}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            </div>
            <div className="space-y-4">
              {family.members.map((member, index) => (
                <div
                  key={member.id || index}
                  className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">Member {index + 1}</h3>
                    {family.members.length > 1 && (
                      <button
                        onClick={() => removeMember(index)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label={t('member_name_english')} value={member.nameEnglish} onChange={(v) => updateMember(index, 'nameEnglish', v)} />
                    <InputField label={t('member_name_hindi')} value={member.nameHindi} onChange={(v) => updateMember(index, 'nameHindi', v)} />
                    <InputField label={t('age')} type="number" value={member.age} onChange={(v) => updateMember(index, 'age', v)} />
                    <SelectField label={t('gender')} value={member.gender} onChange={(v) => updateMember(index, 'gender', v)} options={['Male', 'Female', 'Other']} />
                    <InputField label={t('relation')} value={member.relation} onChange={(v) => updateMember(index, 'relation', v)} />
                    <InputField label={t('aadhaar')} value={member.aadhaarNumber} onChange={(v) => updateMember(index, 'aadhaarNumber', v)} />
                    <InputField label={t('occupation')} value={member.occupation} onChange={(v) => updateMember(index, 'occupation', v)} />
                    <InputField label={t('member_education')} value={member.education} onChange={(v) => updateMember(index, 'education', v)} />
                    <SelectField label={t('member_marital_status')} value={member.maritalStatus} onChange={(v) => updateMember(index, 'maritalStatus', v)} options={['Married', 'Unmarried', 'Divorced', 'Widow', 'Widower']} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Photos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PhotoUploadField
                label="Family Photo"
                value={family.familyPhoto}
                onChange={(v) => setFamily(p => ({ ...p, familyPhoto: v }))}
              />
              <PhotoUploadField
                label="House Photo"
                value={family.housePhoto}
                onChange={(v) => setFamily(p => ({ ...p, housePhoto: v }))}
              />
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Review & Submit</h2>
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReviewItem label="Family Head" value={family.familyHeadNameEnglish || family.familyHeadNameHindi || family.familyHeadName} />
                <ReviewItem label={language === 'hi' ? 'गाँव' : 'Village'} value={family.village || 'Not specified'} />
                <ReviewItem label="Mobile" value={family.mobile} />
                <ReviewItem label="Mohalla" value={family.mohalla} />
                <ReviewItem label="Caste" value={family.caste} />
                <ReviewItem label="GPS Location" value={family.latitude ? `${family.latitude}, ${family.longitude}` : 'Not captured'} />
                <ReviewItem label="Surveyor" value={userProfile?.name || currentUser?.email || 'Admin'} />
                <ReviewItem label="Bank" value={family.bankName} />
                <ReviewItem label="Members" value={family.members.length} />
              </div>
            </div>
            <button
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all"
            >
              <Check className="w-5 h-5" />
              {id ? 'Update Family' : 'Submit Survey'}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  if (isUnassigned) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className={`p-8 rounded-3xl border text-center space-y-5 shadow-3d-card ${
          darkMode 
            ? 'bg-gradient-to-b from-gray-900 to-amber-950/20 border-amber-900/40 text-white' 
            : 'bg-gradient-to-b from-white to-amber-50/60 border-amber-200/80 text-gray-900'
        }`}>
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'सर्वेक्षण निर्माण प्रतिबंधित' : 'Survey Creation Restricted'}</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-bold">
              {language === 'hi' ? 'कोई गाँव आवंटित नहीं है' : 'Awaiting Village Assignment'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
              {language === 'hi'
                ? 'आपका खाता सफलतापूर्वक बन गया है। परिवार सर्वेक्षण दर्ज या संशोधित करने से पहले व्यवस्थापक (Admin) द्वारा आपको गाँव आवंटित किया जाना अनिवार्य है।'
                : 'Your account has been created successfully. Please wait for an administrator to assign your village before creating or modifying family surveys.'}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold shadow-md hover:opacity-90 transition-all"
            >
              {language === 'hi' ? 'डैशबोर्ड पर जाएँ' : 'Go to Dashboard'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
        >
          <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{id ? 'Edit Family' : 'New Survey'}</h1>
      </div>

      {/* Progress Steps */}
      <div className="mb-6">
        {/* Mobile Stepper */}
        <div className="block md:hidden">
          <div className={`p-4 rounded-2xl border mb-3 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-xs`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
                {language === 'hi' ? `चरण ${currentStep} / ${steps.length}` : `Step ${currentStep} of ${steps.length}`}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                {Math.round((currentStep / steps.length) * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              {(() => {
                const stepObj = steps.find(s => s.id === currentStep) || steps[0];
                const StepIcon = stepObj.icon || User;
                return (
                  <>
                    <div className="p-1.5 rounded-lg bg-green-500/15 text-green-600 dark:text-green-400">
                      <StepIcon className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
                      {language === 'hi' ? stepObj.labelHi : stepObj.label}
                    </h2>
                  </>
                );
              })()}
            </div>
            {/* Step mini-pills */}
            <div className="grid grid-cols-7 gap-1.5">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentStep > step.id
                      ? 'bg-green-500'
                      : currentStep === step.id
                        ? 'bg-gradient-to-r from-green-500 to-indigo-600'
                        : darkMode ? 'bg-gray-800' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Stepper */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                        ? 'bg-gradient-to-r from-green-500 to-indigo-600 text-white scale-110 shadow-md shadow-green-500/20'
                        : darkMode
                          ? 'bg-gray-800 text-gray-400'
                          : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <p className={`mt-2 text-xs font-medium text-center ${currentStep >= step.id ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>
                  {language === 'hi' ? step.labelHi : step.label}
                </p>
              </div>
            ))}
          </div>
          <div className="relative mt-4 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className={`p-4 sm:p-6 rounded-2xl border transition-colors ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-xs`}>
        {renderStep()}
      </div>

      <div className="flex justify-between items-center mt-6 gap-3">
        <button
          onClick={handlePrev}
          disabled={currentStep === 1}
          className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all ${
            currentStep === 1
              ? 'opacity-40 cursor-not-allowed'
              : darkMode
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>{language === 'hi' ? 'पिछला' : 'Previous'}</span>
        </button>
        {currentStep < steps.length && (
          <button
            onClick={handleNext}
            className="flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-indigo-600 text-white rounded-xl font-medium text-sm sm:text-base hover:shadow-lg hover:shadow-green-500/25 transition-all"
          >
            <span>{language === 'hi' ? 'अगला' : 'Next'}</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', required, className = '' }) {
  const { darkMode } = useData();
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-4 py-3 rounded-xl border outline-none transition-all
          ${darkMode
            ? 'bg-gray-800 border-gray-700 text-white focus:border-green-500'
            : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-green-500'
          }
        `}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange }) {
  const { darkMode } = useData();
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className={`
          w-full px-4 py-3 rounded-xl border outline-none transition-all resize-none
          ${darkMode
            ? 'bg-gray-800 border-gray-700 text-white focus:border-green-500'
            : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-green-500'
          }
        `}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }) {
  const { darkMode } = useData();
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-4 py-3 rounded-xl border outline-none transition-all
          ${darkMode
            ? 'bg-gray-800 border-gray-700 text-white focus:border-green-500'
            : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-green-500'
          }
        `}
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleField({ label, value, onChange }) {
  const { darkMode } = useData();
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
      <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`
          w-12 h-7 rounded-full transition-colors relative
          ${value ? 'bg-green-500' : darkMode ? 'bg-gray-700' : 'bg-gray-300'}
        `}
      >
        <div
          className={`
            absolute top-1 w-5 h-5 bg-white rounded-full transition-transform
            ${value ? 'left-6' : 'left-1'}
          `}
        />
      </button>
    </div>
  );
}

function PhotoUploadField({ label, value, onChange }) {
  const { darkMode } = useData();
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => onChange(e.target.result);
      reader.readAsDataURL(file);
    }
  };
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      {value ? (
        <div className="relative">
          <img src={value} alt={label} className="w-full h-48 object-cover rounded-xl" />
          <button
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className={`
          flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed cursor-pointer
          ${darkMode
            ? 'border-gray-700 hover:border-green-500 bg-gray-800/50'
            : 'border-gray-300 hover:border-green-500 bg-gray-50'
          }
        `}>
          <Image className="w-10 h-10 text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">Click to upload</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      )}
    </div>
  );
}

function ReviewItem({ label, value }) {
  const { darkMode } = useData();
  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-medium text-gray-900 dark:text-white">{value || '-'}</p>
    </div>
  );
}
