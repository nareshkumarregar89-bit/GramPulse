import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Edit,
  Printer,
  QrCode,
  User,
  FileText,
  Banknote,
  Home,
  Users,
  MapPin
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { PrintDocument } from '../components/PrintDocument';

export function FamilyProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getFamilyById, darkMode, language } = useData();
  const { currentUser, userProfile } = useAuth();
  const family = getFamilyById(id);

  if (!family) {
    return (
      <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <p className="text-gray-500 dark:text-gray-400">Family not found</p>
        <button
          onClick={() => navigate('/families')}
          className="mt-4 px-4 py-2 bg-gradient-to-r from-green-500 to-indigo-600 text-white rounded-xl"
        >
          Back to Families
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const printedBy = userProfile?.name || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'GramPulse Officer');

  return (
    <>
      <div className="space-y-6 max-w-4xl mx-auto no-print">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/families')}
            className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
          >
            <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {family.familyHeadNameEnglish || family.familyHeadNameHindi || family.familyHeadName || 'Family'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{family.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className={`p-3 rounded-xl ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-900 hover:bg-gray-50'} border`}
            title="Print"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(`/survey/${family.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-indigo-600 text-white rounded-xl font-medium"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>

      {/* QR Code Section */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="p-4 bg-white rounded-xl">
            <div className="w-32 h-32 flex items-center justify-center border-2 border-dashed rounded-xl">
              <QrCode className="w-24 h-24 text-gray-400" />
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">Family QR</p>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Family Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <Stat label="Village" value={family.village || '-'} />
              <Stat label="Members" value={family.members.length} />
              <Stat label="Mohalla" value={family.mohalla} />
              <Stat label="Caste" value={family.caste} />
              <Stat label="Category" value={family.category} />
            </div>
          </div>
        </div>
      </div>

      {/* Family Information */}
      <ProfileSection title="Family Information" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProfileItem label="Family Head Name" value={family.familyHeadNameEnglish || family.familyHeadNameHindi || family.familyHeadName} />
          <ProfileItem label="Village" value={family.village || '-'} />
          <ProfileItem label="Father/Husband Name" value={family.fatherNameEnglish || family.fatherNameHindi || family.fatherName} />
          <ProfileItem label="Mobile Number" value={family.mobile} />
          <ProfileItem label="Alternate Mobile" value={family.alternateMobile} />
          <ProfileItem label="Mohalla" value={family.mohalla} />
          <ProfileItem label="Caste" value={family.caste} />
          <ProfileItem label="House Number" value={family.houseNumber} />
          <ProfileItem label="PIN Code" value={family.pinCode} />
          <ProfileItem label="Address" value={family.address} className="md:col-span-2" />
          {family.latitude && family.longitude && (
            <div className="md:col-span-2 p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">GPS Geotag Location (घर की लोकेशन)</p>
                <p className="text-sm font-semibold font-mono text-green-700 dark:text-green-300 mt-0.5">
                  {family.latitude}° N, {family.longitude}° E {family.gpsAccuracy && `(±${family.gpsAccuracy}m)`}
                </p>
              </div>
              <a
                href={`https://maps.google.com/?q=${family.latitude},${family.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <MapPin className="w-3.5 h-3.5" />
                Google Maps
              </a>
            </div>
          )}
          {family.surveyorName && (
            <ProfileItem 
              label="Surveyor (सर्वेयर)" 
              value={`${family.surveyorName} ${family.surveyorEmail ? `(${family.surveyorEmail})` : ''}`} 
              className="md:col-span-2" 
            />
          )}
        </div>
      </ProfileSection>

      {/* Government Documents */}
      <ProfileSection title="Government Documents" icon={FileText}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProfileItem label="Aadhaar Number" value={family.aadhaarNumber} />
          <ProfileItem label="Jan Aadhaar Number" value={family.janAadhaarNumber} />
          <ProfileItem label="Ration Card Number" value={family.rationCardNumber} />
          <ProfileItem label="Voter ID" value={family.voterId} />
        </div>
      </ProfileSection>

      {/* Bank Details */}
      <ProfileSection title="Bank Details" icon={Banknote}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProfileItem label="Bank Name" value={family.bankName} />
          <ProfileItem label="Branch Name" value={family.branch} />
          <ProfileItem label="Account Holder" value={family.accountHolder} />
          <ProfileItem label="Account Number" value={family.accountNumber} />
          <ProfileItem label="IFSC Code" value={family.ifsc} className="md:col-span-2" />
        </div>
      </ProfileSection>

      {/* House Information */}
      <ProfileSection title="House Information" icon={Home}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProfileItem label="Monthly Income" value={family.monthlyIncome} />
          <ProfileItem label="Occupation" value={family.occupation} />
          <ProfileItem label="Category" value={family.category} />
          <ProfileItem label="House Type" value={family.houseType} />
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <ProfileToggle label="Water" value={family.waterConnection} />
            <ProfileToggle label="Electricity" value={family.electricityConnection} />
            <ProfileToggle label="Toilet" value={family.toilet} />
            <ProfileToggle label="Gas" value={family.gasConnection} />
          </div>
        </div>
      </ProfileSection>

      {/* Family Members */}
      <ProfileSection title="Family Members" icon={Users}>
        <div className="space-y-4">
          {family.members.map((member, index) => (
            <div
              key={member.id || index}
              className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {(member.nameEnglish || member.nameHindi || member.name || 'M').charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {member.nameEnglish || member.nameHindi || member.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{member.relation}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <ProfileItem label="Age" value={member.age} />
                <ProfileItem label="Gender" value={member.gender} />
                <ProfileItem label="Education" value={member.education} />
                <ProfileItem label="Marital Status" value={member.maritalStatus} />
                <ProfileItem label="Aadhaar" value={member.aadhaarNumber} className="md:col-span-2" />
                <ProfileItem label="Occupation" value={member.occupation} className="md:col-span-2" />
              </div>
            </div>
          ))}
        </div>
      </ProfileSection>

      {/* Photos */}
      {(family.familyPhoto || family.housePhoto) && (
        <ProfileSection title="Photos" icon={Home}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {family.familyPhoto && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Family Photo</p>
                <img src={family.familyPhoto} alt="Family" className="w-full h-64 object-cover rounded-xl" />
              </div>
            )}
            {family.housePhoto && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">House Photo</p>
                <img src={family.housePhoto} alt="House" className="w-full h-64 object-cover rounded-xl" />
              </div>
            )}
          </div>
        </ProfileSection>
      )}
      </div>

      {/* DEDICATED PRINT CONTAINER - TRIGGERED BY BROWSER PRINT */}
      <div className="print-only">
        <PrintDocument
          families={[family]}
          format="dossier"
          village={family.village || ''}
          printedBy={printedBy}
          language={language}
        />
      </div>
    </>
  );
}

function ProfileSection({ title, icon: Icon, children }) {
  const { darkMode } = useData();
  return (
    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-indigo-600 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ProfileItem({ label, value, className = '' }) {
  const { darkMode } = useData();
  return (
    <div className={className}>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-medium text-gray-900 dark:text-white">{value || '-'}</p>
    </div>
  );
}

function ProfileToggle({ label, value }) {
  const { darkMode } = useData();
  return (
    <div className={`p-3 rounded-xl ${value ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
      <p className={`text-xs ${value ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
        {value ? 'Available' : 'Not Available'}
      </p>
    </div>
  );
}

function Stat({ label, value }) {
  const { darkMode } = useData();
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">{value}</p>
    </div>
  );
}
