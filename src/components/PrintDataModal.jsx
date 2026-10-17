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
  Users,
  ArrowLeftRight
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs no-print animate-in fade-in duration-200">
        <div className="fixed inset-0" onClick={onClose} />

        <div className="relative w-full max-w-4xl max-h-[94vh] sm:max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
          
          {/* Modal Header */}
          <div className="px-3.5 py-3 sm:px-5 sm:py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-xs">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white truncate">
                  {language === 'hi' ? 'डेटा प्रिंट / PDF रिपोर्ट' : 'Professional Data Print'}
                </h2>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                  {language === 'hi' 
                    ? 'A4 पेपर फॉर्मेट में रिपोर्ट प्रिंट करें या PDF सेव करें' 
                    : 'Print official government A4 report or save as PDF'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-colors shrink-0"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Configuration Bar */}
          <div className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gray-100/70 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-700/80 shrink-0 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Format toggle: Table vs Dossier */}
              <div className="inline-flex items-center gap-1 p-1 rounded-xl sm:rounded-2xl bg-white dark:bg-gray-900 border border-gray-300/80 dark:border-gray-700 shadow-xs">
                <button
                  type="button"
                  onClick={() => setPrintFormat('table')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all active:scale-95 ${
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
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all active:scale-95 ${
                    printFormat === 'dossier'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'प्रपत्र (Dossiers)' : 'Family Dossiers'}</span>
                </button>
              </div>

              {/* Count badge */}
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {language === 'hi' ? 'परिवार:' : 'Records:'} <strong className="text-emerald-900 dark:text-emerald-100">{dataToPrint.length}</strong>
                </span>
              </div>
            </div>

            {/* Selection filter (if selectedFamilies > 0) */}
            {selectedFamilies.length > 0 && (
              <div className="flex items-center gap-2 text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 dark:text-gray-300 select-none">
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
          </div>

          {/* Document Preview Box with Full Left-Right & Up-Down Scrolling */}
          <div className="flex-1 overflow-hidden flex flex-col p-2 sm:p-5 bg-gray-200/60 dark:bg-gray-950/70">
            {/* Mobile horizontal swipe guidance banner */}
            <div className="md:hidden flex items-center justify-between px-3 py-1.5 mb-2 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-800 dark:text-indigo-200 text-[11px] font-medium shrink-0 shadow-xs">
              <div className="flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse shrink-0" />
                <span className="truncate">
                  {language === 'hi' ? 'पूरा टेबल देखने हेतु बाएँ-दाएँ स्वाइप करें' : 'Swipe horizontally to view full table'}
                </span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-200/70 dark:bg-indigo-800/70 font-bold shrink-0">
                ↔ स्वाइप (Swipe)
              </span>
            </div>

            {/* Preview scroll viewport (Both X and Y scroll with momentum) */}
            <div className="flex-1 preview-scroll-container rounded-xl sm:rounded-2xl border border-gray-300 dark:border-gray-800 bg-white shadow-inner">
              <div className="min-w-[760px] md:min-w-full p-2.5 sm:p-4 bg-white">
                <PrintDocument 
                  families={dataToPrint}
                  format={printFormat}
                  village={selectedVillage}
                  printedBy={printedBy}
                  language={language}
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="px-3.5 py-3 sm:px-5 sm:py-3.5 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3 bg-white dark:bg-gray-900 shrink-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              {language === 'hi' 
                ? '💡 टिप: प्रिंट विंडो में Paper Size "A4" और Margins "Default" रखें।' 
                : '💡 Tip: In print dialog, select Paper Size "A4" and Margins "Default".'}
            </p>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
              >
                {language === 'hi' ? 'रद्द करें' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleExecutePrint}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-indigo-700 hover:from-emerald-700 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition-all active:scale-95"
              >
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">
                  {language === 'hi' ? 'अभी प्रिंट करें / PDF सेव करें' : 'Print Now / Save PDF'}
                </span>
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
