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
  IndianRupee
} from 'lucide-react';
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
  Cell
} from 'recharts';

const COLORS = ['#22c55e', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

export function Dashboard() {
  const { families, mohallas, castes, darkMode, t, language } = useData();
  const navigate = useNavigate();

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
            {language === 'en' ? "Welcome back! Here's your village survey overview." : "वापस आकर अच्छा लगा! यहाँ आपका ग्राम सर्वे अवलोकन है।"}
          </p>
        </div>
        <button
          onClick={() => navigate('/survey')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all"
        >
          <Plus className="w-5 h-5" />
          {t('new_survey')}
        </button>
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
                  {family.familyHeadName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{family.familyHeadName}</p>
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
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, trendUp, color, iconColor }) {
  const { darkMode } = useData();
  return (
    <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
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
