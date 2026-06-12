import { Trash2, RotateCcw, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';

export function DeletedRecords() {
  const { deletedFamilies, restoreFamily, permanentlyDeleteFamily, t, darkMode, language } = useData();
  const { addToast } = useToast();

  const handleRestore = (id) => {
    restoreFamily(id);
    addToast(t('family') + ' restored successfully!', 'success');
  };

  const handlePermanentDelete = (id) => {
    permanentlyDeleteFamily(id);
    addToast(t('family') + ' permanently deleted!', 'success');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('deleted_records')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {language === 'en' ? 'Restore or permanently delete records' : 'रिकॉर्ड पुनर्स्थापित या स्थायी रूप से हटाएं'}
        </p>
      </div>

      {deletedFamilies.length === 0 ? (
        <div className={`p-12 rounded-2xl border text-center ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <Trash2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {language === 'en' ? 'No deleted records' : 'कोई हटाया हुआ रिकॉर्ड नहीं'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {language === 'en' ? 'Deleted records will appear here' : 'हटाए गए रिकॉर्ड यहां दिखाई देंगे'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deletedFamilies.map((family) => (
            <div
              key={family.id}
              className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {family.familyHeadNameEnglish || family.familyHeadNameHindi || 'Unknown'}
                </h3>
                {family.familyHeadNameEnglish && family.familyHeadNameHindi && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'hi' ? family.familyHeadNameHindi : family.familyHeadNameEnglish}
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('deleted_on')}: {new Date(family.deletedAt).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('mohalla')}: {family.mohalla} • {t('caste')}: {family.caste} • {t('members')}: {family.members.length}
                </p>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => handleRestore(family.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t('restore')}
                </button>
                <button
                  onClick={() => handlePermanentDelete(family.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  {t('permanently_delete')}
                </button>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
