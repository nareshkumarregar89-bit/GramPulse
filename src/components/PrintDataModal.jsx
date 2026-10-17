import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Printer, 
  FileText, 
  Table, 
  CheckCircle, 
  Eye, 
  Info, 
  Building2,
  Users
} from 'lucide-react';
import { PrintDocument } from './PrintDocument';

export function PrintDataModal({
  isOpen,
  onClose,
  families = [],
  selectedFamilies = [],
  selectedVillage = 'all',
  currentUser = null,
  userProfile = null,
  language = 'hi'
}) {
  const [printFormat, setPrintFormat] = useState('table'); // 'table' | 'dossier'
  const [useOnlySelected, setUseOnlySelected] = useState(selectedFamilies.length > 0);

  // Clean up print classes on print dialog completion or modal close
  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove('is-printing-report');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('is-printing-report');
    };
  }, []);

  if (!isOpen) return null;

  const dataToPrint = useOnlySelected && selectedFamilies.length > 0 
    ? selectedFamilies 
    : families;

  const printedBy = userProfile?.name || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'VillagePulse Surveyor');

  const handleExecutePrint = () => {
    document.body.classList.add('is-printing-report');
    // Ensure state and portal DOM are painted before triggering browser print
    setTimeout(() => {
      window.print();
      // Auto-fallback cleanup in case afterprint does not fire
      setTimeout(() => {
        document.body.classList.remove('is-printing-report');
      }, 800);
    }, 150);
  };

  return (
    <>
      {/* 1. INTERACTIVE SCREEN MODAL (COMPLETELY HIDDEN ON PRINT) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print">
        <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden z-10">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0 bg-gray-50/70 dark:bg-gray-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {language === 'hi' ? 'डेटा प्रिंट करें (Professional Print)' : 'Professional Data Print'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'hi' 
                  ? 'A4 पेपर फॉर्मेट में आधिकारिक रिपोर्ट प्रिंट करें या PDF सेव करें' 
                  : 'Print official government A4 report or save as PDF'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="p-4 bg-gray-100/60 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700/80 shrink-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Format toggle: Table vs Dossier */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setPrintFormat('table')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  printFormat === 'table'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'तालिका रिपोर्ट (Table)' : 'Summary Table'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPrintFormat('dossier')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  printFormat === 'dossier'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'विस्तृत प्रपत्र (Dossiers)' : 'Family Dossiers'}</span>
              </button>
            </div>

            {/* Selection filter (if selectedFamilies > 0) */}
            {selectedFamilies.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={useOnlySelected}
                    onChange={(e) => setUseOnlySelected(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    {language === 'hi' 
                      ? `केवल चयनित रिकॉर्ड्स (${selectedFamilies.length}) प्रिंट करें` 
                      : `Print only selected records (${selectedFamilies.length})`}
                  </span>
                </label>
              </div>
            )}

            {/* Count badge */}
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <Users className="w-3.5 h-3.5" />
              <span>
                {language === 'hi' ? 'प्रिंट होने वाले परिवार:' : 'Records to Print:'} {dataToPrint.length}
              </span>
            </div>
          </div>
        </div>

        {/* Document Preview Box */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-200/50 dark:bg-gray-950/50 scrollbar-thin">
          <div className="max-w-3xl mx-auto shadow-lg rounded-xl overflow-hidden bg-white border border-gray-300">
            <PrintDocument 
              families={dataToPrint}
              format={printFormat}
              village={selectedVillage}
              printedBy={printedBy}
              language={language}
            />
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3 bg-white dark:bg-gray-900 shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
            {language === 'hi' 
              ? '💡 टिप: प्रिंट विंडो में Paper Size "A4" और Margins "Default" रखें।' 
              : '💡 Tip: In print dialog, select Paper Size "A4" and Margins "Default".'}
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleExecutePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'hi' ? 'अभी प्रिंट करें / PDF सेव करें' : 'Print Now / Save PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* 2. DEDICATED CLEAN PRINTABLE DOCUMENT (PORTALED DIRECTLY TO BODY, VISIBLE ONLY IN PRINT MODE) */}
    {createPortal(
      <div id="print-report-portal" className="print-only print-portal-area">
        <PrintDocument 
          families={dataToPrint}
          format={printFormat}
          village={selectedVillage}
          printedBy={printedBy}
          language={language}
        />
      </div>,
      document.body
    )}
  </>
  );
}
