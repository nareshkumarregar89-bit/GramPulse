import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  FileText,
  MapPin,
  Users,
  Banknote,
  Download,
  UsersRound,
  ChevronDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

const COLORS = ['#22c55e', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

export function Reports() {
  const { families, mohallas, castes, darkMode } = useData();
  const [exportFormat, setExportFormat] = useState('json');
  const [exportFilter, setExportFilter] = useState('all');
  const [selectedMohalla, setSelectedMohalla] = useState('');
  const [selectedCaste, setSelectedCaste] = useState('');

  // Stats
  const totalFamilies = families.length;
  const totalPopulation = families.reduce((sum, f) => sum + f.members.length, 0);
  const malePopulation = families.reduce((sum, f) => sum + f.members.filter(m => m.gender === 'Male').length, 0);
  const femalePopulation = families.reduce((sum, f) => sum + f.members.filter(m => m.gender === 'Female').length, 0);

  // Mohalla data
  const mohallaData = mohallas.map(mohalla => ({
    name: mohalla.length > 10 ? mohalla.substring(0, 10) + '...' : mohalla,
    fullName: mohalla,
    families: families.filter(f => f.mohalla === mohalla).length,
    population: families.filter(f => f.mohalla === mohalla).reduce((sum, f) => sum + f.members.length, 0)
  })).sort((a, b) => b.population - a.population);

  // Caste data
  const casteData = castes.map(caste => ({
    name: caste.length > 10 ? caste.substring(0, 10) + '...' : caste,
    fullName: caste,
    families: families.filter(f => f.caste === caste).length,
    population: families.filter(f => f.caste === caste).reduce((sum, f) => sum + f.members.length, 0)
  })).sort((a, b) => b.population - a.population);

  // Category data
  const categoryData = [
    { name: 'BPL', value: families.filter(f => f.category === 'BPL').length },
    { name: 'APL', value: families.filter(f => f.category === 'APL').length },
    { name: 'Antyodaya', value: families.filter(f => f.category === 'Antyodaya').length }
  ];

  // Gender data
  const genderData = [
    { name: 'Male', value: malePopulation },
    { name: 'Female', value: femalePopulation },
    { name: 'Other', value: totalPopulation - malePopulation - femalePopulation }
  ];

  // Filter data based on selected options
  const getFilteredData = () => {
    let filteredFamilies = [...families];
    if (exportFilter === 'mohalla' && selectedMohalla) {
      filteredFamilies = filteredFamilies.filter(f => f.mohalla === selectedMohalla);
    } else if (exportFilter === 'caste' && selectedCaste) {
      filteredFamilies = filteredFamilies.filter(f => f.caste === selectedCaste);
    }
    return filteredFamilies;
  };

  // Export as JSON
  const exportToJSON = (data) => {
    const exportData = {
      families: data,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    let filename = `grampulse-report-${new Date().toISOString().split('T')[0]}`;
    if (exportFilter === 'mohalla') filename += `-mohalla-${selectedMohalla}`;
    if (exportFilter === 'caste') filename += `-caste-${selectedCaste}`;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as Excel - with ALL details
  const exportToExcel = (data) => {
    // Prepare data for Excel - flatten family data with ALL fields
    const excelData = data.flatMap(family => {
      return family.members.map(member => ({
        'Family ID': family.id,
        'Family Head Name': family.familyHeadName,
        'Father/Husband Name': family.fatherName || '',
        'Mobile Number': family.mobile,
        'Alternate Mobile': family.alternateMobile || '',
        'Mohalla': family.mohalla,
        'Caste': family.caste,
        'Address': family.address || '',
        'House Number': family.houseNumber || '',
        'PIN Code': family.pinCode || '',
        'Aadhaar Number': family.aadhaarNumber || '',
        'Jan Aadhaar Number': family.janAadhaarNumber || '',
        'Ration Card Number': family.rationCardNumber || '',
        'Voter ID': family.voterId || '',
        'Bank Name': family.bankName || '',
        'Branch Name': family.branch || '',
        'Account Holder': family.accountHolder || '',
        'Account Number': family.accountNumber || '',
        'IFSC Code': family.ifsc || '',
        'Monthly Income': family.monthlyIncome || '',
        'Occupation': family.occupation || '',
        'Category': family.category || '',
        'House Type': family.houseType || '',
        'Water Connection': family.waterConnection ? 'Yes' : 'No',
        'Electricity Connection': family.electricityConnection ? 'Yes' : 'No',
        'Toilet Available': family.toilet ? 'Yes' : 'No',
        'Gas Connection': family.gasConnection ? 'Yes' : 'No',
        'Member ID': member.id,
        'Member Name': member.name,
        'Member Age': member.age,
        'Member Gender': member.gender,
        'Member Relation': member.relation,
        'Member Aadhaar Number': member.aadhaarNumber || '',
        'Member Occupation': member.occupation || '',
        'Member Education': member.education || '',
        'Member Marital Status': member.maritalStatus || ''
      }));
    });
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Complete Family Data");
    let filename = `grampulse-report-${new Date().toISOString().split('T')[0]}`;
    if (exportFilter === 'mohalla') filename += `-mohalla-${selectedMohalla}`;
    if (exportFilter === 'caste') filename += `-caste-${selectedCaste}`;
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  // Export as PDF - with ALL details
  const exportToPDF = (data) => {
    const doc = new jsPDF();
    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    
    // Title
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('GramPulse - Complete Village Survey Report', 14, yPos);
    yPos += 10;
    doc.setFont(undefined, 'normal');
    
    // Subtitle
    doc.setFontSize(12);
    let subtitle = 'Complete Data Report';
    if (exportFilter === 'mohalla') subtitle = `Report for Mohalla: ${selectedMohalla}`;
    if (exportFilter === 'caste') subtitle = `Report for Caste: ${selectedCaste}`;
    doc.text(subtitle, 14, yPos);
    yPos += 7;
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, yPos);
    yPos += 15;
    
    // Summary
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Summary', 14, yPos);
    yPos += 8;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    doc.text(`Total Families: ${data.length}`, 16, yPos);
    yPos += 6;
    const totalPop = data.reduce((sum, f) => sum + f.members.length, 0);
    doc.text(`Total Population: ${totalPop}`, 16, yPos);
    yPos += 12;
    
    // Families
    data.forEach((family, idx) => {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      // Family Header
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`${idx + 1}. Family: ${family.familyHeadName}`, 14, yPos);
      yPos += 8;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      
      // Family Details - Section 1
      doc.text('--- Family Information ---', 16, yPos);
      yPos += 6;
      doc.text(`Father/Husband Name: ${family.fatherName || 'N/A'}`, 18, yPos);
      yPos += 5;
      doc.text(`Mobile: ${family.mobile}`, 18, yPos);
      yPos += 5;
      if (family.alternateMobile) { doc.text(`Alternate Mobile: ${family.alternateMobile}`, 18, yPos); yPos += 5; }
      doc.text(`Mohalla: ${family.mohalla}`, 18, yPos);
      yPos += 5;
      doc.text(`Caste: ${family.caste}`, 18, yPos);
      yPos += 5;
      if (family.address) { doc.text(`Address: ${family.address}`, 18, yPos); yPos += 5; }
      if (family.houseNumber) { doc.text(`House Number: ${family.houseNumber}`, 18, yPos); yPos += 5; }
      if (family.pinCode) { doc.text(`PIN Code: ${family.pinCode}`, 18, yPos); yPos += 5; }
      
      // Govt Documents
      yPos += 4;
      doc.text('--- Government Documents ---', 16, yPos);
      yPos += 6;
      if (family.aadhaarNumber) { doc.text(`Aadhaar Number: ${family.aadhaarNumber}`, 18, yPos); yPos += 5; }
      if (family.janAadhaarNumber) { doc.text(`Jan Aadhaar Number: ${family.janAadhaarNumber}`, 18, yPos); yPos += 5; }
      if (family.rationCardNumber) { doc.text(`Ration Card Number: ${family.rationCardNumber}`, 18, yPos); yPos += 5; }
      if (family.voterId) { doc.text(`Voter ID: ${family.voterId}`, 18, yPos); yPos += 5; }
      
      // Bank Details
      yPos += 4;
      doc.text('--- Bank Details ---', 16, yPos);
      yPos += 6;
      if (family.bankName) { doc.text(`Bank Name: ${family.bankName}`, 18, yPos); yPos += 5; }
      if (family.branch) { doc.text(`Branch: ${family.branch}`, 18, yPos); yPos += 5; }
      if (family.accountHolder) { doc.text(`Account Holder: ${family.accountHolder}`, 18, yPos); yPos += 5; }
      if (family.accountNumber) { doc.text(`Account Number: ${family.accountNumber}`, 18, yPos); yPos += 5; }
      if (family.ifsc) { doc.text(`IFSC Code: ${family.ifsc}`, 18, yPos); yPos += 5; }
      
      // House Info
      yPos += 4;
      doc.text('--- House Information ---', 16, yPos);
      yPos += 6;
      if (family.monthlyIncome) { doc.text(`Monthly Income: ₹${family.monthlyIncome}`, 18, yPos); yPos += 5; }
      if (family.occupation) { doc.text(`Occupation: ${family.occupation}`, 18, yPos); yPos += 5; }
      doc.text(`Category: ${family.category}`, 18, yPos); yPos +=5;
      if (family.houseType) { doc.text(`House Type: ${family.houseType}`, 18, yPos); yPos += 5; }
      doc.text(`Water Connection: ${family.waterConnection ? 'Yes' : 'No'}`, 18, yPos); yPos +=5;
      doc.text(`Electricity Connection: ${family.electricityConnection ? 'Yes' : 'No'}`, 18, yPos); yPos +=5;
      doc.text(`Toilet Available: ${family.toilet ? 'Yes' : 'No'}`, 18, yPos); yPos +=5;
      doc.text(`Gas Connection: ${family.gasConnection ? 'Yes' : 'No'}`, 18, yPos); yPos +=5;
      
      // Family Members
      yPos +=4;
      doc.text('--- Family Members ---',16, yPos);
      yPos +=6;
      family.members.forEach((member, mIdx) => {
        if (yPos > pageHeight -40) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont(undefined, 'bold');
        doc.text(`${mIdx+1}. ${member.name}`,18,yPos);
        yPos +=6;
        doc.setFont(undefined, 'normal');
        doc.text(`   Age: ${member.age} | Gender: ${member.gender} | Relation: ${member.relation}`,18,yPos);
        yPos +=5;
        if (member.aadhaarNumber) { doc.text(`   Aadhaar Number: ${member.aadhaarNumber}`,18,yPos); yPos +=5; }
        if (member.education) { doc.text(`   Education: ${member.education}`,18,yPos); yPos +=5; }
        if (member.occupation) { doc.text(`   Occupation: ${member.occupation}`,18,yPos); yPos +=5; }
        doc.text(`   Marital Status: ${member.maritalStatus}`,18,yPos);
        yPos +=8;
      });
      
      yPos += 10;
    });
    
    let filename = `grampulse-report-${new Date().toISOString().split('T')[0]}`;
    if (exportFilter === 'mohalla') filename += `-mohalla-${selectedMohalla}`;
    if (exportFilter === 'caste') filename += `-caste-${selectedCaste}`;
    doc.save(`${filename}.pdf`);
  };

  const handleExport = () => {
    const filteredData = getFilteredData();
    switch (exportFormat) {
      case 'json':
        exportToJSON(filteredData);
        break;
      case 'excel':
        exportToExcel(filteredData);
        break;
      case 'pdf':
        exportToPDF(filteredData);
        break;
      default:
        exportToJSON(filteredData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Analytics and insights from village data</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          {/* Filter Type Select */}
          <select
            value={exportFilter}
            onChange={(e) => {
              setExportFilter(e.target.value);
              setSelectedMohalla('');
              setSelectedCaste('');
            }}
            className={`px-4 py-2 rounded-xl border outline-none ${
              darkMode
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <option value="all">All Data</option>
            <option value="mohalla">By Mohalla</option>
            <option value="caste">By Caste</option>
          </select>

          {/* Mohalla Select */}
          {exportFilter === 'mohalla' && (
            <select
              value={selectedMohalla}
              onChange={(e) => setSelectedMohalla(e.target.value)}
              className={`px-4 py-2 rounded-xl border outline-none ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="">Select Mohalla</option>
              {mohallas.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}

          {/* Caste Select */}
          {exportFilter === 'caste' && (
            <select
              value={selectedCaste}
              onChange={(e) => setSelectedCaste(e.target.value)}
              className={`px-4 py-2 rounded-xl border outline-none ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="">Select Caste</option>
              {castes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Format Select */}
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className={`px-4 py-2 rounded-xl border outline-none ${
              darkMode
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <option value="json">JSON</option>
            <option value="excel">Excel</option>
            <option value="pdf">PDF</option>
          </select>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={
              (exportFilter === 'mohalla' && !selectedMohalla) ||
              (exportFilter === 'caste' && !selectedCaste)
            }
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportCard icon={FileText} label="Total Families" value={totalFamilies} color="from-green-500 to-green-600" />
        <ReportCard icon={Users} label="Total Population" value={totalPopulation} color="from-indigo-500 to-indigo-600" />
        <ReportCard icon={Users} label="Male" value={malePopulation} color="from-blue-500 to-blue-600" iconColor="text-blue-500" />
        <ReportCard icon={Users} label="Female" value={femalePopulation} color="from-pink-500 to-pink-600" iconColor="text-pink-500" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportSection title="Population by Mohalla" icon={MapPin}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mohallaData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke={darkMode ? '#9ca3af' : '#6b7280'}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke={darkMode ? '#9ca3af' : '#6b7280'}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="population" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ReportSection>

        <ReportSection title="Population by Caste" icon={UsersRound}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={casteData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  dataKey="population"
                >
                  {casteData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ReportSection>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportSection title="Families by Category" icon={FileText}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ReportSection>

        <ReportSection title="Gender Distribution" icon={Users}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ReportSection>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportSection title="Mohalla-wise Details" icon={MapPin}>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mohallaData.map((m) => (
              <div key={m.fullName} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{m.fullName}</h4>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{m.families} families</span>
                    <span className="font-medium text-gray-900 dark:text-white">{m.population} people</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ReportSection>

        <ReportSection title="Caste-wise Details" icon={UsersRound}>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {casteData.map((c) => (
              <div key={c.fullName} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{c.fullName}</h4>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{c.families} families</span>
                    <span className="font-medium text-gray-900 dark:text-white">{c.population} people</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ReportSection>
      </div>
    </div>
  );
}

function ReportCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`p-5 rounded-2xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800`}>
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function ReportSection({ title, icon: Icon, children }) {
  const { darkMode } = useData();
  return (
    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-indigo-600 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}
