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
  FileSpreadsheet,
  CheckCircle2,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { TiltCard } from '../components/TiltCard';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { IsometricVillageHero } from '../components/IsometricVillageHero';
import { EmptyState3D } from '../components/EmptyState3D';
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
      {/* 3D Isometric Village Hero Welcome Banner */}
      <IsometricVillageHero onOpenExcel={() => setIsExcelModalOpen(true)} />

      {/* Sub-bar: Active Filter & Scope Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-white/70 dark:bg-gray-900/70 border-gray-200 dark:border-gray-800 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
            {language === 'hi' 
              ? (!isAdmin ? `सर्वेयर डैशबोर्ड • आपके द्वारा जोड़े गए परिवार` : `व्यवस्थापक डेटा अवलोकन • समोड़ी एवं कोटड़ी`)
              : (!isAdmin ? `Surveyor Dashboard • Showing your records` : `Administrative Overview • Live Village Records`)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Village Filter */}
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className={`text-xs md:text-sm px-3 py-1.5 rounded-xl border outline-none font-medium transition-colors ${
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
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-xs font-semibold">
                {assignedVillages?.join(', ') || (language === 'hi' ? 'समोड़ी' : 'Samodi')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid with 3D TiltCards & Animated Counters */}
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

      {/* Admin Village-wise Family & Surveyor Distribution Section with 3D Depth */}
      {isAdmin && (
        <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-xs'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(activeVillageRecords.length > 0 ? activeVillageRecords : villages.map(v => ({ id: v, name: v, nameEnglish: v, nameHindi: v }))).map((vObj, idx) => {
              const vName = vObj.name || vObj.nameEnglish || vObj.id;
              const villageFamilies = allFamilies.filter(f => isFamilyInVillage ? isFamilyInVillage(f, vObj.id || vName) : f.village === vName);
              const pop = villageFamilies.reduce((sum, f) => sum + (f.members?.length || 0), 0);
              const assigned = allUsers.filter(u => 
                u.role === 'surveyor' && 
                u.assignedVillages && 
                u.assignedVillages.some(av => isFamilyInVillage ? isFamilyInVillage({ village: av }, vObj.id || vName) : av === vName)
              );

              // Percentage of total survey families
              const percentOfTotal = allFamilies.length > 0 
                ? Math.round((villageFamilies.length / allFamilies.length) * 100) 
                : 0;

              // Distinct accent theme for village cards (e.g. Samodi -> Emerald, Kotdi -> Indigo)
              const isSamodi = (vObj.nameEnglish || vName).toLowerCase().includes('samodi');
              const accentGradient = isSamodi
                ? 'from-emerald-500 to-teal-600'
                : idx % 2 === 0
                  ? 'from-emerald-500 to-teal-600'
                  : 'from-indigo-500 to-purple-600';

              const accentBorder = isSamodi 
                ? 'border-emerald-500/20 hover:border-emerald-500/40' 
                : 'border-indigo-500/20 hover:border-indigo-500/40';

              return (
                <TiltCard
                  key={vObj.id || vName}
                  maxTilt={6}
                  perspective={900}
                  scale={1.02}
                  className={`p-5 rounded-2xl border shadow-3d-card transition-all flex flex-col justify-between ${accentBorder} ${
                    darkMode ? 'bg-gray-800/50' : 'bg-gray-50/80'
                  }`}
                >
                  {/* Elegant Top Gradient Accent Bar */}
                  <div className={`h-1.5 w-full rounded-full bg-gradient-to-r ${accentGradient} mb-3.5`} />

                  <div className="transform-z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                          {vObj.nameHindi || vName}
                        </h3>
                        {vObj.nameEnglish && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {vObj.nameEnglish}
                          </span>
                        )}
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                        {language === 'hi' ? 'सक्रिय' : 'Active'}
                      </span>
                    </div>

                    {/* Animated Statistics Counters */}
                    <div className="grid grid-cols-2 gap-2.5 my-3.5">
                      <div className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100 shadow-2xs'}`}>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                          {language === 'hi' ? 'परिवार' : 'Families'}
                        </span>
                        <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-0.5">
                          <AnimatedCounter value={villageFamilies.length} />
                        </p>
                      </div>

                      <div className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100 shadow-2xs'}`}>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                          {language === 'hi' ? 'जनसंख्या' : 'Population'}
                        </span>
                        <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                          <AnimatedCounter value={pop} />
                        </p>
                      </div>
                    </div>

                    {/* Animated Survey Progress Indicator */}
                    <div className="my-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">
                          {language === 'hi' ? 'कुल सर्वे अनुपात:' : 'Survey Share:'}
                        </span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{percentOfTotal}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${accentGradient} progress-shimmer transition-all duration-700`}
                          style={{ width: `${Math.max(percentOfTotal, 5)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-gray-200 dark:border-gray-700/60">
                      <span className="text-[11px] text-gray-400 block mb-1 font-medium">
                        {language === 'hi' ? 'आवंटित सर्वेयर:' : 'Assigned Surveyors:'}
                      </span>
                      {assigned.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {assigned.map(u => (
                            <span 
                              key={u.uid}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold"
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
                </TiltCard>
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
        <div className={`p-6 rounded-3xl border shadow-3d-card ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              <span>{t('recent_activity')}</span>
            </h3>
            <span className="text-xs text-gray-400 font-medium">
              {recentFamilies.length} {language === 'hi' ? 'हालिया प्रविष्टियाँ' : 'recent entries'}
            </span>
          </div>

          {recentFamilies.length > 0 ? (
            <div className="space-y-3">
              {recentFamilies.map((family) => (
                <div
                  key={family.id}
                  onClick={() => navigate(`/families/${family.id}`)}
                  className={`flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border border-transparent ${
                    darkMode 
                      ? 'hover:bg-gray-800/80 hover:border-gray-700/60' 
                      : 'hover:bg-gray-50 hover:border-gray-200 shadow-2xs'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                    {(family.familyHeadNameEnglish || family.familyHeadNameHindi || family.familyHeadName || 'F').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                      {language === 'hi'
                        ? (family.familyHeadNameHindi || family.familyHeadNameEnglish || family.familyHeadName || 'Unknown')
                        : (family.familyHeadNameEnglish || family.familyHeadNameHindi || family.familyHeadName || 'Unknown')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      <span>{family.mohalla}</span>
                      {family.village && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-indigo-500">{family.village}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {new Date(family.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState3D
              title={language === 'hi' ? 'कोई हालिया सर्वे नहीं' : 'No Recent Surveys'}
              description={language === 'hi' ? 'अभी तक कोई परिवार रिकॉर्ड नहीं जोड़ा गया है।' : 'No survey records have been entered yet.'}
              actionLabel={t('new_survey')}
              onAction={() => navigate('/survey')}
            />
          )}
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
    <TiltCard
      maxTilt={6}
      perspective={850}
      scale={1.02}
      className={`p-5 rounded-2xl border shadow-3d-card transition-all ${
        darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200/90'
      }`}
    >
      <div className="flex items-center justify-between transform-z-20">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md shadow-black/10`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
            trendUp 
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' 
              : 'text-red-500 bg-red-500/10'
          }`}>
            {trendUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight transform-z-20">
        <AnimatedCounter value={value} />
      </p>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{label}</p>
    </TiltCard>
  );
}

