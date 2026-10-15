import { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Building2, 
  Mail, 
  Lock, 
  KeyRound, 
  Edit, 
  Search,
  UserCheck,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';

export function UserManagement() {
  const { 
    allUsers, 
    createUserByAdmin, 
    updateUserByAdmin, 
    toggleUserStatus, 
    sendUserPasswordReset, 
    deleteUserByAdmin,
    currentUser 
  } = useAuth();
  const { villages, activeVillageRecords = [], allFamilies = [], isFamilyInVillage, darkMode, language, t } = useData();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState('all');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Form states for Add User
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'surveyor',
    assignedVillages: []
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered users
  const filteredUsers = (allUsers || []).filter(user => {
    const matchesSearch = 
      (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesVillage = selectedVillageFilter === 'all' || 
      (user.assignedVillages && user.assignedVillages.includes(selectedVillageFilter));

    return matchesSearch && matchesVillage;
  });

  // Calculate user stats
  const totalUsers = allUsers.length;
  const activeSurveyors = allUsers.filter(u => u.role === 'surveyor' && u.status !== 'inactive').length;
  const inactiveUsers = allUsers.filter(u => u.status === 'inactive').length;

  // Handle Add User submission
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setFormError(language === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें।' : 'Please fill all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setFormError(language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createUserByAdmin(formData);
      addToast(language === 'hi' ? 'नया यूज़र सफलतापूर्वक बनाया गया!' : 'New user created successfully!', 'success');
      setIsAddUserModalOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'surveyor',
        assignedVillages: []
      });
    } catch (err) {
      console.error('Error adding user:', err);
      if (err.code === 'auth/email-already-in-use') {
        setFormError(language === 'hi' ? 'यह ईमेल पहले से पंजीकृत है।' : 'Email is already registered.');
      } else {
        setFormError(err.message || 'Failed to create user');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit User submission
  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setIsSubmitting(true);
      await updateUserByAdmin(editingUser.uid, {
        name: editingUser.name,
        role: editingUser.role,
        assignedVillages: editingUser.assignedVillages || [],
        status: editingUser.status || 'active'
      });
      addToast(language === 'hi' ? 'यूज़र विवरण सफलतापूर्वक अपडेट हुआ!' : 'User updated successfully!', 'success');
      setEditingUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      addToast(language === 'hi' ? 'अपडेट करने में त्रुटि हुई।' : 'Failed to update user.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle user status
  const handleToggleStatus = async (user) => {
    if (user.uid === currentUser?.uid) {
      addToast(language === 'hi' ? 'आप स्वयं के खाते को निष्क्रिय नहीं कर सकते।' : 'You cannot deactivate your own account.', 'error');
      return;
    }

    const next = await toggleUserStatus(user.uid, user.status || 'active');
    addToast(
      language === 'hi' 
        ? `यूज़र को ${next === 'active' ? 'सक्रिय' : 'निष्क्रिय'} कर दिया गया!` 
        : `User marked as ${next}!`,
      'success'
    );
  };

  // Send password reset
  const handlePasswordReset = async (email) => {
    try {
      await sendUserPasswordReset(email);
      addToast(language === 'hi' ? `पासवर्ड रीसेट ईमेल ${email} पर भेज दी गई!` : `Password reset email sent to ${email}!`, 'success');
    } catch (err) {
      console.error('Password reset error:', err);
      addToast(language === 'hi' ? 'पासवर्ड रीसेट ईमेल भेजने में विफल।' : 'Failed to send password reset email.', 'error');
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    if (userToDelete.uid === currentUser?.uid) {
      addToast(language === 'hi' ? 'आप स्वयं के खाते को नहीं हटा सकते।' : 'You cannot delete your own account.', 'error');
      setUserToDelete(null);
      return;
    }
    if (userToDelete.uid === 'sJwiZZ6cf8Ze8YAmMMK8T1FwF232') {
      addToast(language === 'hi' ? 'सुपर एडमिन खाता नहीं हटाया जा सकता।' : 'Super Admin account cannot be deleted.', 'error');
      setUserToDelete(null);
      return;
    }

    try {
      setIsDeletingUser(true);
      await deleteUserByAdmin(userToDelete.uid, userToDelete);
      addToast(
        language === 'hi' 
          ? `यूज़र "${userToDelete.name || userToDelete.email}" सफलतापूर्वक हटा दिया गया!` 
          : `User "${userToDelete.name || userToDelete.email}" deleted successfully!`,
        'success'
      );
      setUserToDelete(null);
    } catch (err) {
      console.error('Delete user error:', err);
      addToast(
        err.message || (language === 'hi' ? 'यूज़र हटाने में त्रुटि हुई।' : 'Failed to delete user.'),
        'error'
      );
    } finally {
      setIsDeletingUser(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'hi' ? 'यूज़र एवं विलेज प्रबंधन' : 'User & Village Management'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {language === 'hi' 
              ? 'सर्वेयर यूज़र्स बनाएं, उन्हें गाँव आवंटित करें और एक्सेस नियंत्रित करें' 
              : 'Manage surveyor accounts, assign villages, and control permissions'}
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: '',
              email: '',
              password: '',
              role: 'surveyor',
              assignedVillages: villages.length > 0 ? [villages[0]] : []
            });
            setFormError('');
            setIsAddUserModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-indigo-600 hover:from-green-600 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>{language === 'hi' ? 'नया यूज़र जोड़ें' : 'Add New User'}</span>
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              {language === 'hi' ? 'कुल यूज़र्स' : 'Total Users'}
            </span>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{totalUsers}</p>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              {language === 'hi' ? 'सक्रिय सर्वेयर' : 'Active Surveyors'}
            </span>
            <UserCheck className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">{activeSurveyors}</p>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              {language === 'hi' ? 'निष्क्रिय खाते' : 'Deactivated'}
            </span>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">{inactiveUsers}</p>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              {language === 'hi' ? 'कुल गाँव' : 'Villages'}
            </span>
            <Building2 className="w-5 h-5 text-teal-500" />
          </div>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-2">{villages.length}</p>
        </div>
      </div>

      {/* Village Distribution Summary Card */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" />
            <span>{language === 'hi' ? 'गाँव-वार परिवार एवं सर्वेयर स्थिति' : 'Village-wise Family & Surveyor Distribution'}</span>
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {language === 'hi' ? 'सक्रिय गाँव: समोड़ी, कोटड़ी' : 'Active Villages: Samodi, Kotdi'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(activeVillageRecords.length > 0 ? activeVillageRecords : villages.map(v => ({ id: v, name: v, nameEnglish: v, nameHindi: v }))).map(vObj => {
            const villageName = vObj.name || vObj.nameEnglish || vObj.id;
            const villageFamilies = (allFamilies || []).filter(f => isFamilyInVillage ? isFamilyInVillage(f, vObj.id || villageName) : f.village === villageName);
            const assignedUsers = (allUsers || []).filter(u => 
              u.assignedVillages && u.assignedVillages.some(av => isFamilyInVillage ? isFamilyInVillage({ village: av }, vObj.id || villageName) : av === villageName)
            );
            const popCount = villageFamilies.reduce((sum, f) => sum + (f.members?.length || 0), 0);

            return (
              <div 
                key={vObj.id || villageName}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-white block truncate" title={villageName}>
                      {vObj.nameHindi || villageName}
                    </span>
                    {vObj.nameEnglish && (
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 block truncate">
                        {vObj.nameEnglish}
                      </span>
                    )}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                    {villageFamilies.length}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                  {popCount} {language === 'hi' ? 'जनसंख्या' : 'population'}
                </p>
                <div className="mt-3 pt-2.5 border-t border-gray-200 dark:border-gray-700/60">
                  <span className="text-[11px] text-gray-400 block mb-1">
                    {language === 'hi' ? 'आवंटित सर्वेयर:' : 'Assigned Surveyors:'}
                  </span>
                  {assignedUsers.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {assignedUsers.map(u => (
                        <span key={u.uid} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium">
                          {u.name || u.email.split('@')[0]}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-amber-500 italic">
                      {language === 'hi' ? 'कोई सर्वेयर नहीं' : 'No surveyor assigned'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
        darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={language === 'hi' ? 'नाम या ईमेल से खोजें...' : 'Search users by name, email...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs outline-none ${
              darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500 whitespace-nowrap">{language === 'hi' ? 'गाँव फ़िल्टर:' : 'Filter Village:'}</span>
          <select
            value={selectedVillageFilter}
            onChange={(e) => setSelectedVillageFilter(e.target.value)}
            className={`text-xs px-3 py-2 rounded-xl border outline-none font-medium ${
              darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <option value="all">{language === 'hi' ? 'सभी गाँव' : 'All Villages'}</option>
            {villages.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={darkMode ? 'bg-gray-800/80 text-gray-300' : 'bg-gray-50 text-gray-700'}>
              <tr>
                <th className="p-4 font-semibold">{language === 'hi' ? 'यूज़र विवरण' : 'User Details'}</th>
                <th className="p-4 font-semibold">{language === 'hi' ? 'रोल' : 'Role'}</th>
                <th className="p-4 font-semibold">{language === 'hi' ? 'आवंटित गाँव (Assigned Villages)' : 'Assigned Villages'}</th>
                <th className="p-4 font-semibold">{language === 'hi' ? 'दर्ज परिवार' : 'Families Surveyed'}</th>
                <th className="p-4 font-semibold">{language === 'hi' ? 'स्थिति' : 'Status'}</th>
                <th className="p-4 font-semibold text-right">{language === 'hi' ? 'कार्रवाई' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredUsers.map((user) => {
                const surveyCount = (allFamilies || []).filter(f => f.surveyorId === user.uid || f.createdBy === user.uid).length;
                const isUserActive = user.status !== 'inactive';
                const isSelf = user.uid === currentUser?.uid;

                return (
                  <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <span>{user.name || 'Unnamed User'}</span>
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 font-bold">
                                {language === 'hi' ? 'आप' : 'You'}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span>{user.email}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        user.role === 'admin'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}>
                        <Shield className="w-3 h-3" />
                        <span>{user.role === 'admin' ? (language === 'hi' ? 'एडमिन' : 'Admin') : (language === 'hi' ? 'सर्वेयर' : 'Surveyor')}</span>
                      </span>
                    </td>

                    <td className="p-4">
                      {user.role === 'admin' ? (
                        <span className="text-gray-500 text-[11px] italic">
                          {language === 'hi' ? 'सभी गाँव (Global Access)' : 'All Villages (Global Access)'}
                        </span>
                      ) : (user.assignedVillages && user.assignedVillages.length > 0) ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {user.assignedVillages.map(v => (
                            <span 
                              key={v}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                            >
                              <Building2 className="w-2.5 h-2.5" />
                              <span>{v}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-red-500 text-[11px] italic">
                          {language === 'hi' ? 'कोई गाँव आवंटित नहीं' : 'No village assigned'}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {surveyCount} {language === 'hi' ? 'परिवार' : 'families'}
                      </span>
                    </td>

                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        disabled={isSelf}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                          isUserActive
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                        } ${isSelf ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                      >
                        {isUserActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{language === 'hi' ? 'सक्रिय' : 'Active'}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-red-500" />
                            <span>{language === 'hi' ? 'निष्क्रिय' : 'Inactive'}</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingUser({ ...user, assignedVillages: user.assignedVillages || [] })}
                          className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                          title={language === 'hi' ? 'संपादित करें' : 'Edit User'}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePasswordReset(user.email)}
                          className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                          title={language === 'hi' ? 'पासवर्ड रीसेट ईमेल भेजें' : 'Send Password Reset'}
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserToDelete(user)}
                          disabled={isSelf || user.uid === 'sJwiZZ6cf8Ze8YAmMMK8T1FwF232'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isSelf || user.uid === 'sJwiZZ6cf8Ze8YAmMMK8T1FwF232'
                              ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-30'
                              : 'text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer'
                          }`}
                          title={language === 'hi' ? 'यूज़र हटाएं' : 'Delete User'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View: High-Touch Responsive Cards */}
        <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400">
              {language === 'hi' ? 'कोई यूज़र नहीं मिला' : 'No users found'}
            </div>
          ) : (
            filteredUsers.map((user) => {
              const surveyCount = (allFamilies || []).filter(f => f.surveyorId === user.uid || f.createdBy === user.uid).length;
              const isUserActive = user.status !== 'inactive';
              const isSelf = user.uid === currentUser?.uid;
              const isSuperAdmin = user.uid === 'sJwiZZ6cf8Ze8YAmMMK8T1FwF232';

              return (
                <div key={user.uid} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
                        {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                            {user.name || 'Unnamed User'}
                          </p>
                          {isSelf && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                              {language === 'hi' ? 'आप' : 'You'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                          <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 ${
                      user.role === 'admin'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    }`}>
                      <Shield className="w-3 h-3" />
                      <span>{user.role === 'admin' ? (language === 'hi' ? 'एडमिन' : 'Admin') : (language === 'hi' ? 'सर्वेयर' : 'Surveyor')}</span>
                    </span>
                  </div>

                  {/* Village and Survey stats row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 text-[11px]">{language === 'hi' ? 'सर्वेक्षण:' : 'Surveys:'}</span>
                      <span className="font-bold text-gray-900 dark:text-white px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800">
                        {surveyCount} {language === 'hi' ? 'परिवार' : 'families'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(user)}
                      disabled={isSelf}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                        isUserActive
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      } ${isSelf ? 'cursor-not-allowed opacity-70' : 'cursor-pointer active:scale-95'}`}
                    >
                      {isUserActive ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span>{language === 'hi' ? 'सक्रिय' : 'Active'}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-red-500" />
                          <span>{language === 'hi' ? 'निष्क्रिय' : 'Inactive'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Assigned Villages */}
                  <div className="text-xs">
                    <span className="text-[11px] text-gray-400 block mb-1">
                      {language === 'hi' ? 'आवंटित गाँव:' : 'Assigned Villages:'}
                    </span>
                    {user.role === 'admin' ? (
                      <span className="text-gray-500 text-[11px] italic">
                        {language === 'hi' ? 'सभी गाँव (Global Access)' : 'All Villages (Global Access)'}
                      </span>
                    ) : (user.assignedVillages && user.assignedVillages.length > 0) ? (
                      <div className="flex flex-wrap gap-1">
                        {user.assignedVillages.map(v => (
                          <span 
                            key={v}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                          >
                            <Building2 className="w-2.5 h-2.5" />
                            <span>{v}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-red-500 text-[11px] italic">
                        {language === 'hi' ? 'कोई गाँव आवंटित नहीं' : 'No village assigned'}
                      </span>
                    )}
                  </div>

                  {/* Mobile Actions Button Row */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => setEditingUser({ ...user, assignedVillages: user.assignedVillages || [] })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-semibold text-xs transition-colors active:scale-95"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'संपादित' : 'Edit'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePasswordReset(user.email)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 font-semibold text-xs transition-colors active:scale-95"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'पासवर्ड' : 'Reset'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserToDelete(user)}
                      disabled={isSelf || isSuperAdmin}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-semibold text-xs transition-colors active:scale-95 ${
                        isSelf || isSuperAdmin
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed opacity-50'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'हटाएं' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal 1: Add New User */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl border p-6 space-y-4 transition-all ${
            darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-500" />
                <span>{language === 'hi' ? 'नया सर्वेयर / यूज़र जोड़ें' : 'Create New User Account'}</span>
              </h2>
              <button onClick={() => setIsAddUserModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {language === 'hi' ? 'पूरा नाम *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder={language === 'hi' ? 'उदा. राहुल कुमार' : 'e.g. John Doe'}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {language === 'hi' ? 'ईमेल आईडी *' : 'Email Address *'}
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="surveyor@grampulse.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {language === 'hi' ? 'पासवर्ड * (न्यूनतम 6 अक्षर)' : 'Initial Password * (min 6 characters)'}
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {language === 'hi' ? 'रोल (Role)' : 'Role'}
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="surveyor">{language === 'hi' ? 'सर्वेयर (Surveyor)' : 'Surveyor'}</option>
                  <option value="admin">{language === 'hi' ? 'व्यवस्थापक (Admin)' : 'Admin'}</option>
                </select>
              </div>

              {formData.role === 'surveyor' && (
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    {language === 'hi' ? 'आवंटित गाँव (एक या अधिक चुनें) *' : 'Assign Villages *'}
                  </label>
                  <div className={`p-3 rounded-xl border max-h-36 overflow-y-auto space-y-1.5 ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    {villages.map(village => {
                      const isChecked = formData.assignedVillages.includes(village);
                      return (
                        <label key={village} className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(p => ({ ...p, assignedVillages: [...p.assignedVillages, village] }));
                              } else {
                                setFormData(p => ({ ...p, assignedVillages: p.assignedVillages.filter(v => v !== village) }));
                              }
                            }}
                            className="rounded text-green-600 focus:ring-green-500"
                          />
                          <span className="text-gray-800 dark:text-gray-200">{village}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-gray-600 dark:text-gray-300 font-semibold"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-green-600 to-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? (language === 'hi' ? 'बनाया जा रहा है...' : 'Creating...') : (language === 'hi' ? 'यूज़र बनाएं' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit User */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl border p-6 space-y-4 transition-all ${
            darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-500" />
                <span>{language === 'hi' ? 'यूज़र विवरण संपादित करें' : 'Edit User Settings'}</span>
              </h2>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {language === 'hi' ? 'नाम' : 'Full Name'}
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser(p => ({ ...p, name: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {language === 'hi' ? 'रोल' : 'Role'}
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser(p => ({ ...p, role: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="surveyor">{language === 'hi' ? 'सर्वेयर (Surveyor)' : 'Surveyor'}</option>
                  <option value="admin">{language === 'hi' ? 'व्यवस्थापक (Admin)' : 'Admin'}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {language === 'hi' ? 'खाता स्थिति (Status)' : 'Account Status'}
                </label>
                <select
                  value={editingUser.status || 'active'}
                  onChange={(e) => setEditingUser(p => ({ ...p, status: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium ${
                    darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="active">{language === 'hi' ? 'सक्रिय (Active)' : 'Active'}</option>
                  <option value="inactive">{language === 'hi' ? 'निष्क्रिय (Inactive)' : 'Inactive'}</option>
                </select>
              </div>

              {editingUser.role === 'surveyor' && (
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    {language === 'hi' ? 'आवंटित गाँव (एक या अधिक चुनें)' : 'Assigned Villages'}
                  </label>
                  <div className={`p-3 rounded-xl border max-h-36 overflow-y-auto space-y-1.5 ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    {villages.map(village => {
                      const isChecked = (editingUser.assignedVillages || []).includes(village);
                      return (
                        <label key={village} className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditingUser(p => ({ ...p, assignedVillages: [...(p.assignedVillages || []), village] }));
                              } else {
                                setEditingUser(p => ({ ...p, assignedVillages: (p.assignedVillages || []).filter(v => v !== village) }));
                              }
                            }}
                            className="rounded text-green-600 focus:ring-green-500"
                          />
                          <span className="text-gray-800 dark:text-gray-200">{village}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border text-gray-600 dark:text-gray-300 font-semibold"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-green-600 to-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? (language === 'hi' ? 'सहेज रहे हैं...' : 'Saving...') : (language === 'hi' ? 'बदलाव सहेजें' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Delete User Confirmation */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl border p-6 space-y-4 transition-all ${
            darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-base font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                <Trash2 className="w-5 h-5" />
                <span>{language === 'hi' ? 'यूज़र खाता हटाएं' : 'Delete User Account'}</span>
              </h2>
              <button 
                onClick={() => setUserToDelete(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    {language === 'hi' ? 'चेतावनी: यह कार्रवाई स्थायी है!' : 'Warning: This action is permanent!'}
                  </p>
                  <p className="mt-1 text-red-600 dark:text-red-300">
                    {language === 'hi'
                      ? 'इस यूज़र का खाता और सिस्टम एक्सेस हटा दिया जाएगा। वे दोबारा लॉगिन नहीं कर सकेंगे।'
                      : 'This user account and system access will be removed immediately. They will not be able to log in again.'}
                  </p>
                </div>
              </div>

              {/* User preview card */}
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {userToDelete.name?.charAt(0)?.toUpperCase() || userToDelete.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{userToDelete.name || 'Unnamed User'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userToDelete.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {userToDelete.role || 'surveyor'}
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">
                        {(allFamilies || []).filter(f => f.surveyorId === userToDelete.uid || f.createdBy === userToDelete.uid).length} {language === 'hi' ? 'सर्वे रिकॉर्ड्स' : 'survey records'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 rounded-xl border text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={handleDeleteUser}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isDeletingUser
                    ? (language === 'hi' ? 'हटा रहे हैं...' : 'Deleting...')
                    : (language === 'hi' ? 'हाँ, यूज़र हटाएं' : 'Yes, Delete User')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
