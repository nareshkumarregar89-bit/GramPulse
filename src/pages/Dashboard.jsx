import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  User,
  MapPin,
  UsersRound,
  TrendingUp,
  Plus,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { ExcelImportModal } from '../components/ExcelImportModal';
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
  Cell
} from 'recharts';

const COLORS = ['#22c55e', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

export function Dashboard() {
  const { families, allFamilies = [], mohallas, castes, darkMode, t, language, villages, activeVillageRecords = [], isFamilyInVillage, selectedVillage, setSelectedVillage } = useData();
  const { isAdmin, userProfile, currentUser, assignedVillages, allUsers = [] } = useAuth();
  const navigate = useNavigate();
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Calculate stats
  const totalFamilies = families.length;
  const totalPopulation = families.reduce((sum, f) => sum + f.members.length, 0);
  const malePopulation = families.reduce((sum, f) => sum + f.members.filter(m => m.gender === 'Male').length, 0);
  const femalePopulation = families.reduce((sum, f) => sum + f.members.filter(m => m.gender === 'Female').length, 0);
  const totalMohallas = mohallas.length;
  const totalCastes = castes.length;

  // Population by mohalla
  const populationByMohalla = mohallas.map(mohalla => ({
    name: mohalla.length > 10 ? mohalla.substring(0, 10) + '...' : mohalla,
    fullName: mohalla,
    population: families.filter(f => f.mohalla === mohalla).reduce((sum, f) => sum + f.members.length, 0)
  }));

  // Population by caste
  const populationByCaste = castes.map(caste => ({
    name: caste.length > 10 ? caste.substring(0, 10) + '...' : caste,
    fullName: caste,
    population: families.filter(f => f.caste === caste).reduce((sum, f) => sum + f.members.length, 0)
  }));

  // Family distribution by category
  const familyByCategory = [
    { name: 'BPL', value: families.filter(f => f.category === 'BPL').length },
    { name: 'APL', value: families.filter(f => f.category === 'APL').length },
    { name: 'Antyodaya', value: families.filter(f => f.category === 'Antyodaya').length }
  ];

  // Recent families (last 5)
  const recentFamilies = [...families].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === 'en' 
              ? (!isAdmin ? `Surveyor Dashboard • Showing your records` : "Welcome back! Here's your village survey overview.") 
              : (!isAdmin ? `सर्वेयर डैशबोर्ड • आपके द्वारा जोड़े गए रिकॉर्ड` : "वापस आकर अच्छा लगा! यहाँ आपका ग्राम सर्वे अवलोकन है।")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Village Filter */}
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className={`text-xs md:text-sm px-3 py-2 rounded-xl border outline-none font-medium transition-colors ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                <option value="all">{t('all_villages')}</option>
                {villages.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="text-xs md:text-sm font-semibold">
                {assignedVillages?.join(', ') || (language === 'hi' ? 'समोड़ी' : 'Samodi')}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-semibold shadow-md transition-all shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t('import_excel')}</span>
          </button>

          <button
            onClick={() => navigate('/survey')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-indigo-600 text-white rounded-xl text-xs md:text-sm font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t('new_survey')}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={Users}
          label={t('total_families')}
          value={totalFamilies}
          trend="+12%"
          trendUp
          color="from-green-500 to-green-600"
        />
        <StatCard
          icon={User}
          label={t('total_population')}
          value={totalPopulation}
          trend="+8%"
          trendUp
          color="from-indigo-500 to-indigo-600"
        />
        <StatCard
          icon={User}
          label={t('male_population')}
          value={malePopulation}
          iconColor="text-blue-500"
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          icon={User}
          label={t('female_population')}
          value={femalePopulation}
          iconColor="text-pink-500"
          color="from-pink-500 to-pink-600"
        />
        <StatCard
          icon={Building2}
          label={t('total_villages')}
          value={villages.length}
          color="from-teal-500 to-teal-600"
        />
        <StatCard
          icon={MapPin}
          label={t('total_mohallas')}
          value={totalMohallas}
          color="from-amber-500 to-amber-600"
        />
        <StatCard
          icon={UsersRound}
          label={t('total_castes')}
          value={totalCastes}
          color="from-purple-500 to-purple-600"
        />
      </div>

      {/* Admin Village-wise Family & Surveyor Distribution Section */}
      {isAdmin && (
        <div className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-xs'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" />
                <span>{language === 'hi' ? 'गाँव-वार परिवार एवं सर्वेयर स्थिति' : 'Village-wise Family & Surveyor Distribution'}</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {language === 'hi'
                  ? 'डेटाबेस से वास्तविक समय गणना: समोड़ी एवं कोटड़ी'
                  : 'Real-time database statistics: Samodi and Kotdi'}
              </p>
            </div>

            <button
              onClick={() => navigate('/admin/villages')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>{language === 'hi' ? 'गाँव प्रबंधन खोलें' : 'Manage Villages'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(activeVillageRecords.length > 0 ? activeVillageRecords : villages.map(v => ({ id: v, name: v, nameEnglish: v, nameHindi: v }))).map((vObj) => {
              const vName = vObj.name || vObj.nameEnglish || vObj.id;
              const villageFamilies = allFamilies.filter(f => isFamilyInVillage ? isFamilyInVillage(f, vObj.id || vName) : f.village === vName);
              const pop = villageFamilies.reduce((sum, f) => sum + (f.members?.length || 0), 0);
              const assigned = allUsers.filter(u => 
                u.role === 'surveyor' && 
                u.assignedVillages && 
                u.assignedVillages.some(av => isFamilyInVillage ? isFamilyInVillage({ village: av }, vObj.id || vName) : av === vName)
              );

              return (
                <div
                  key={vObj.id || vName}
                  className={`p-4 rounded-2xl border card-hover-lift transition-all ${
                    darkMode ? 'bg-gray-800/40 border-gray-800' : 'bg-gray-50/70 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                        {vObj.nameHindi || vName}
                      </h3>
                      {vObj.nameEnglish && (
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                          {vObj.nameEnglish}
                        </span>
                      )}
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-bold">
                      {language === 'hi' ? 'सक्रिय' : 'Active'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-3">
                    <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">
                        {language === 'hi' ? 'परिवार' : 'Families'}
                      </span>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{villageFamilies.length}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">
                        {language === 'hi' ? 'जनसंख्या' : 'Population'}
                      </span>
                      <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{pop}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700/60">
                    <span className="text-[11px] text-gray-400 block mb-1">
                      {language === 'hi' ? 'आवंटित सर्वेयर:' : 'Assigned Surveyors:'}
                    </span>
                    {assigned.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {assigned.map(u => (
                          <span 
                            key={u.uid}
                            className="text-[10px] px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium"
                          >
                            {u.name || u.email?.split('@')[0]}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-500 italic">
                        {language === 'hi' ? 'कोई सर्वेयर नहीं' : 'No surveyor assigned'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Population by Mohalla */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('population_by_mohalla')}</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={populationByMohalla}>
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
        </div>

        {/* Population by Caste */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('population_by_caste')}</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={populationByCaste}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  dataKey="population"
                >
                  {populationByCaste.map((entry, index) => (
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
        </div>

        {/* Family Distribution */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('family_distribution')}</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={familyByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {familyByCategory.map((entry, index) => (
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
        </div>

        {/* Recent Activity */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('recent_activity')}</h3>
          </div>
          <div className="space-y-4">
            {recentFamilies.map((family) => (
              <div
                key={family.id}
                onClick={() => navigate(`/families/${family.id}`)}
                className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {(family.familyHeadNameEnglish || family.familyHeadNameHindi || family.familyHeadName || 'F').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {language === 'hi'
                      ? (family.familyHeadNameHindi || family.familyHeadNameEnglish || family.familyHeadName || 'Unknown')
                      : (family.familyHeadNameEnglish || family.familyHeadNameHindi || family.familyHeadName || 'Unknown')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{family.mohalla}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(family.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, trendUp, color, iconColor }) {
  const { darkMode } = useData();
  return (
    <div className={`p-5 rounded-2xl border card-hover-lift ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className={`flex items-center text-sm font-medium ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
            {trendUp ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}
