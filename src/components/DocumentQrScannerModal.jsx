import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  X, 
  Camera, 
  Upload, 
  Flashlight, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  FileText,
  Scan
} from 'lucide-react';
import { parseSurveyDocumentQr } from '../utils/qrParser';

/**
 * Play a short pleasant success chime using the Web Audio API
 */
function playScanBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch (e) {
    // Audio synthesis not permitted or unavailable
  }
}

export function DocumentQrScannerModal({ isOpen, onClose, onScanSuccess, targetLabel = 'परिवार मुखिया' }) {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [scannerStatus, setScannerStatus] = useState('initializing'); // 'initializing' | 'scanning' | 'detected' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [detectedData, setDetectedData] = useState(null);
  const [rawScannedText, setRawScannedText] = useState('');
  
  const scannerRef = useRef(null);
  const readerElementId = 'html5qr-code-full-region';
  const fileInputRef = useRef(null);

  // Initialize Cameras & Scanner
  useEffect(() => {
    if (!isOpen) return;

    let html5QrCode = null;
    let isSubscribed = true;

    setScannerStatus('initializing');
    setErrorMessage('');
    setDetectedData(null);
    setTorchOn(false);

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isSubscribed) return;
        if (!devices || devices.length === 0) {
          setScannerStatus('error');
          setErrorMessage('डिवाइस पर कोई कैमरा उपलब्ध नहीं मिला (No Camera Found)');
          return;
        }

        setCameras(devices);
        // Default to back/environment camera if available
        const backCamera = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        ) || devices[0];

        setSelectedCameraId(backCamera.id);
        startScanner(backCamera.id);
      })
      .catch((err) => {
        if (!isSubscribed) return;
        console.warn('Camera enumeration error:', err);
        setScannerStatus('error');
        setErrorMessage('कैमरा एक्सेस की अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में कैमरा की अनुमति दें।');
      });

    const startScanner = (cameraId) => {
      try {
        if (scannerRef.current) {
          scannerRef.current.stop().catch(() => {}).finally(() => {
            initNewScanner(cameraId);
          });
        } else {
          initNewScanner(cameraId);
        }
      } catch (e) {
        console.error('Scanner init error:', e);
      }
    };

    const initNewScanner = (cameraId) => {
      try {
        html5QrCode = new Html5Qrcode(readerElementId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        html5QrCode.start(
          cameraId,
          config,
          (decodedText) => {
            handleScanComplete(decodedText);
          },
          () => {
            // Frame scan failure (expected during continuous video feed)
          }
        ).then(() => {
          if (isSubscribed) {
            setScannerStatus('scanning');
          }
        }).catch((err) => {
          if (isSubscribed) {
            console.warn('Failed to start camera feed:', err);
            setScannerStatus('error');
            setErrorMessage('कैमरा स्ट्रीम प्रारंभ करने में विफल। कृपया किसी अन्य कैमरे का चयन करें या फ़ोटो अपलोड करें।');
          }
        });
      } catch (err) {
        if (isSubscribed) {
          setScannerStatus('error');
          setErrorMessage(err.message || 'कैमरा स्कैनर प्रारंभ नहीं हो सका');
        }
      }
    };

    return () => {
      isSubscribed = false;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
          scannerRef.current.clear();
        } catch (e) {}
        scannerRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle successful scan from video or file
  const handleScanComplete = (decodedText) => {
    if (!decodedText) return;
    playScanBeep();

    // Vibrate device briefly if supported
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    setRawScannedText(decodedText);
    const parsed = parseSurveyDocumentQr(decodedText);
    setDetectedData(parsed);
    setScannerStatus('detected');

    // Pause camera scanning while reviewing
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.pause(true);
    }
  };

  // Switch between cameras (front/rear)
  const handleCameraChange = (e) => {
    const newCameraId = e.target.value;
    setSelectedCameraId(newCameraId);
    if (scannerRef.current) {
      setScannerStatus('initializing');
      scannerRef.current.stop().then(() => {
        scannerRef.current.start(
          newCameraId,
          { fps: 15, qrbox: { width: 250, height: 250 } },
          handleScanComplete,
          () => {}
        ).then(() => {
          setScannerStatus('scanning');
        }).catch((err) => {
          setScannerStatus('error');
          setErrorMessage('कैमरा बदलने में त्रुटि: ' + err.message);
        });
      }).catch((e) => {
        console.warn('Stop on change camera error:', e);
      });
    }
  };

  // Flashlight / Torch toggle
  const toggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      const nextTorch = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch toggle not supported on this device/camera:', e);
    }
  };

  // Handle gallery/file image upload
  const handleFileScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setScannerStatus('initializing');
      const html5QrCode = scannerRef.current || new Html5Qrcode(readerElementId);
      const decodedText = await html5QrCode.scanFile(file, true);
      handleScanComplete(decodedText);
    } catch (err) {
      setScannerStatus('error');
      setErrorMessage('इस छवि में कोई स्पष्ट QR कोड नहीं पाया गया। कृपया अच्छी रोशनी वाली सीधी फ़ोटो चुनें।');
    }
  };

  // Apply parsed data and close modal
  const handleConfirmAutoFill = () => {
    if (detectedData) {
      onScanSuccess(detectedData);
      onClose();
    }
  };

  // Resume scanning
  const handleScanAgain = () => {
    setDetectedData(null);
    setRawScannedText('');
    setScannerStatus('scanning');
    if (scannerRef.current) {
      try {
        scannerRef.current.resume();
      } catch (e) {}
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-green-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>दस्तावेज़ QR स्कैनर</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
                  {targetLabel}
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                आधार कार्ड या जन-आधार कार्ड का QR कोड कैमरे के सामने लाएं
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col items-center justify-center bg-gray-950 relative overflow-hidden min-h-[340px]">
          
          {/* HTML5 QR Code Mount Region */}
          <div 
            id={readerElementId} 
            className="w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-indigo-500/40 bg-black relative"
          />

          {/* Scanner Optical Viewfinder Overlay (Shown while scanning) */}
          {scannerStatus === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[250px] h-[250px] border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                {/* 4 Corner Markers */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br-lg"></div>

                {/* Animated Laser Scanning Line */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#34d399] animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {scannerStatus === 'initializing' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white space-y-2 z-10">
              <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold">कैमरा चालू किया जा रहा है...</p>
            </div>
          )}

          {/* Error View */}
          {scannerStatus === 'error' && (
            <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center p-6 text-center text-white space-y-3 z-10">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-red-200 max-w-xs">{errorMessage}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>गैलरी से QR फ़ोटो अपलोड करें</span>
              </button>
            </div>
          )}

          {/* Success Detected Result Card */}
          {scannerStatus === 'detected' && detectedData && (
            <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-md p-4 sm:p-5 flex flex-col items-center justify-between text-white z-20 overflow-y-auto animate-in zoom-in-95 duration-200">
              <div className="w-full space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm border-b border-gray-800 pb-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>दस्तावेज़ सफलतापूर्वक डीकोड हो गया!</span>
                </div>

                {/* Parsed Attributes */}
                <div className="p-3.5 rounded-2xl bg-gray-900 border border-emerald-500/30 space-y-2 text-xs">
                  {detectedData.familyHeadName && (
                    <div>
                      <span className="text-[10px] text-gray-400 block">नाम (Name):</span>
                      <strong className="text-sm text-white">
                        {detectedData.familyHeadNameHindi || detectedData.familyHeadNameEnglish || detectedData.familyHeadName}
                      </strong>
                      {detectedData.familyHeadNameEnglish && detectedData.familyHeadNameHindi && (
                        <span className="text-[11px] text-gray-400 block">({detectedData.familyHeadNameEnglish})</span>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-800 text-[11px]">
                    {detectedData.fatherName && (
                      <div>
                        <span className="text-[10px] text-gray-400 block">पिता/पति:</span>
                        <span className="font-semibold text-gray-200">{detectedData.fatherNameHindi || detectedData.fatherName}</span>
                      </div>
                    )}
                    {detectedData.aadhaarNumber && (
                      <div>
                        <span className="text-[10px] text-gray-400 block">आधार क्रमांक:</span>
                        <span className="font-mono font-bold text-amber-300">
                          {detectedData.aadhaarNumber.slice(0, 4)} {detectedData.aadhaarNumber.slice(4, 8)} {detectedData.aadhaarNumber.slice(8)}
                        </span>
                      </div>
                    )}
                    {detectedData.janAadhaarNumber && (
                      <div>
                        <span className="text-[10px] text-gray-400 block">जन-आधार:</span>
                        <span className="font-mono font-bold text-blue-300">{detectedData.janAadhaarNumber}</span>
                      </div>
                    )}
                    {detectedData.age && (
                      <div>
                        <span className="text-[10px] text-gray-400 block">उम्र / लिंग:</span>
                        <span className="font-semibold text-gray-200">{detectedData.age} वर्ष • {detectedData.gender}</span>
                      </div>
                    )}
                    {detectedData.pinCode && (
                      <div>
                        <span className="text-[10px] text-gray-400 block">पिन कोड:</span>
                        <span className="font-mono text-gray-200">{detectedData.pinCode}</span>
                      </div>
                    )}
                    {detectedData.address && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-gray-400 block">पता:</span>
                        <span className="text-gray-300 text-[10px] line-clamp-2">{detectedData.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex items-center gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={handleScanAgain}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>पुनः स्कैन करें</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAutoFill}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>फ़ॉर्म में भरें</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls Footer */}
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          
          {/* Camera Selector */}
          {cameras.length > 1 && (
            <div className="flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-gray-500" />
              <select
                value={selectedCameraId}
                onChange={handleCameraChange}
                className="py-1 px-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-medium outline-none"
              >
                {cameras.map((c, idx) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `कैमरा ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Flashlight Button */}
          <button
            type="button"
            onClick={toggleTorch}
            className={`p-2 rounded-xl border flex items-center gap-1.5 transition-all text-xs font-medium ${
              torchOn
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
            }`}
            title="फ़्लैशलाइट चालू/बंद करें"
          >
            <Flashlight className="w-4 h-4" />
            <span className="hidden sm:inline">{torchOn ? 'लाइट बंद' : 'फ़्लैशलाइट'}</span>
          </button>

          {/* Hidden File Input & Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileScan}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            title="गैलरी से QR फोटो चुनें"
          >
            <Upload className="w-4 h-4 text-indigo-500" />
            <span>फ़ोटो से स्कैन</span>
          </button>
        </div>
      </div>
    </div>
  );
}
