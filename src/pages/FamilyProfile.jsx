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
  Users
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

export function FamilyProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getFamilyById, darkMode } = useData();
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
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${family.familyHeadName} - Family Details</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #16a34a; }
            .section { margin: 20px 0; padding: 20px; background: #f0fdf4; border-radius: 8px; }
            .label { font-weight: bold; color: #374151; display: inline-block; width: 150px; }
            h2 { color: #1f2937; border-bottom: 2px solid #16a34a; padding-bottom: 8px; }
            .member { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; }
          </style>
        </head>
        <body>
          <h1>GramPulse - Family Details</h1>
          <div class="section">
            <h2>Family ID: ${family.id}</h2>
          </div>
          
          <div class="section">
            <h2>Family Information</h2>
            <p><span class="label">Family Head:</span> ${family.familyHeadName}</p>
            <p><span class="label">Father/Husband:</span> ${family.fatherName || '-'}</p>
            <p><span class="label">Mobile:</span> ${family.mobile}</p>
            <p><span class="label">Alternate Mobile:</span> ${family.alternateMobile || '-'}</p>
            <p><span class="label">Mohalla:</span> ${family.mohalla}</p>
            <p><span class="label">Caste:</span> ${family.caste}</p>
            <p><span class="label">Address:</span> ${family.address || '-'}</p>
            <p><span class="label">House No:</span> ${family.houseNumber || '-'}</p>
            <p><span class="label">PIN Code:</span> ${family.pinCode || '-'}</p>
          </div>

          <div class="section">
            <h2>Government Documents</h2>
            <p><span class="label">Aadhaar:</span> ${family.aadhaarNumber || '-'}</p>
            <p><span class="label">Jan Aadhaar:</span> ${family.janAadhaarNumber || '-'}</p>
            <p><span class="label">Ration Card:</span> ${family.rationCardNumber || '-'}</p>
            <p><span class="label">Voter ID:</span> ${family.voterId || '-'}</p>
          </div>

          <div class="section">
            <h2>Bank Details</h2>
            <p><span class="label">Bank Name:</span> ${family.bankName || '-'}</p>
            <p><span class="label">Branch:</span> ${family.branch || '-'}</p>
            <p><span class="label">Account Holder:</span> ${family.accountHolder || '-'}</p>
            <p><span class="label">Account No:</span> ${family.accountNumber || '-'}</p>
            <p><span class="label">IFSC:</span> ${family.ifsc || '-'}</p>
          </div>

          <div class="section">
            <h2>House Information</h2>
            <p><span class="label">Monthly Income:</span> ${family.monthlyIncome || '-'}</p>
            <p><span class="label">Occupation:</span> ${family.occupation || '-'}</p>
            <p><span class="label">Category:</span> ${family.category}</p>
            <p><span class="label">House Type:</span> ${family.houseType}</p>
            <p><span class="label">Water Connection:</span> ${family.waterConnection ? 'Yes' : 'No'}</p>
            <p><span class="label">Electricity:</span> ${family.electricityConnection ? 'Yes' : 'No'}</p>
            <p><span class="label">Toilet:</span> ${family.toilet ? 'Yes' : 'No'}</p>
            <p><span class="label">Gas Connection:</span> ${family.gasConnection ? 'Yes' : 'No'}</p>
          </div>

          <div class="section">
            <h2>Family Members (${family.members.length})</h2>
            ${family.members.map(m => `
              <div class="member">
                <p><span class="label">Name:</span> ${m.name}</p>
                <p><span class="label">Age:</span> ${m.age}</p>
                <p><span class="label">Gender:</span> ${m.gender}</p>
                <p><span class="label">Relation:</span> ${m.relation}</p>
                <p><span class="label">Aadhaar:</span> ${m.aadhaarNumber || '-'}</p>
                <p><span class="label">Occupation:</span> ${m.occupation || '-'}</p>
                <p><span class="label">Education:</span> ${m.education || '-'}</p>
                <p><span class="label">Marital Status:</span> ${m.maritalStatus}</p>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/families')}
            className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
          >
            <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{family.familyHeadName}</h1>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <ProfileItem label="Family Head Name" value={family.familyHeadName} />
          <ProfileItem label="Father/Husband Name" value={family.fatherName} />
          <ProfileItem label="Mobile Number" value={family.mobile} />
          <ProfileItem label="Alternate Mobile" value={family.alternateMobile} />
          <ProfileItem label="Mohalla" value={family.mohalla} />
          <ProfileItem label="Caste" value={family.caste} />
          <ProfileItem label="House Number" value={family.houseNumber} />
          <ProfileItem label="PIN Code" value={family.pinCode} />
          <ProfileItem label="Address" value={family.address} className="md:col-span-2" />
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
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{member.name}</h4>
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
