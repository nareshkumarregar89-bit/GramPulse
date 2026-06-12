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
  X
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';

const steps = [
  { id: 1, label: 'Family Info', icon: User },
  { id: 2, label: 'Documents', icon: FileText },
  { id: 3, label: 'Bank Details', icon: Banknote },
  { id: 4, label: 'House Info', icon: Home },
  { id: 5, label: 'Members', icon: Users },
  { id: 6, label: 'Photos', icon: Image },
  { id: 7, label: 'Review', icon: CheckCircle },
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
  members: [{ ...emptyMember }]
};

export function NewSurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { families, mohallas, castes, addFamily, updateFamily, getFamilyById, t, darkMode, language } = useData();
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [family, setFamily] = useState(emptyFamily);

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

  const handleSubmit = () => {
    if (id) {
      updateFamily(id, family);
      addToast('Family updated successfully!', 'success');
    } else {
      addFamily(family);
      addToast('Family added successfully!', 'success');
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
                <ReviewItem label="Family Head" value={family.familyHeadName} />
                <ReviewItem label="Mobile" value={family.mobile} />
                <ReviewItem label="Mohalla" value={family.mohalla} />
                <ReviewItem label="Caste" value={family.caste} />
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  currentStep > step.id
                    ? 'bg-green-500 text-white'
                    : currentStep === step.id
                      ? 'bg-gradient-to-r from-green-500 to-indigo-600 text-white scale-110'
                      : darkMode
                        ? 'bg-gray-800 text-gray-500'
                        : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <p className={`mt-2 text-xs font-medium text-center ${currentStep >= step.id ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                {step.label}
              </p>
            </div>
          ))}
        </div>
        <div className="relative mt-4 h-1 bg-gray-200 dark:bg-gray-800 rounded-full">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-indigo-600 rounded-full transition-all"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        {renderStep()}
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={handlePrev}
          disabled={currentStep === 1}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            currentStep === 1
              ? 'opacity-50 cursor-not-allowed'
              : darkMode
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>
        {currentStep < steps.length && (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all"
          >
            Next
            <ChevronRight className="w-5 h-5" />
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
