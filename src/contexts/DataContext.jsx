import React, { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { initialFamilies } from '../data/villageData';
import { mohallas as initialMohallas } from '../data/mohallas';
import { castes as initialCastes } from '../data/castes';
import { translations } from '../utils/translations';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [families, setFamilies] = useLocalStorage('grampulse-families', initialFamilies);
  const [mohallas, setMohallas] = useLocalStorage('grampulse-mohallas', initialMohallas);
  const [castes, setCastes] = useLocalStorage('grampulse-castes', initialCastes);
  const [darkMode, setDarkMode] = useLocalStorage('grampulse-darkmode', false);
  const [language, setLanguage] = useLocalStorage('grampulse-language', 'en');
  
  // Translation function
  const t = useCallback((key) => {
    return translations[language][key] || key;
  }, [language]);

  // Add a family
  const addFamily = (family) => {
    const newFamily = {
      ...family,
      id: `FAM-${String(families.length + 1).padStart(4, '0')}`,
      createdAt: new Date().toISOString()
    };
    setFamilies([...families, newFamily]);
    return newFamily;
  };

  // Update a family
  const updateFamily = (id, updatedFamily) => {
    setFamilies(families.map(f => f.id === id ? { ...f, ...updatedFamily } : f));
  };

  // Delete a family
  const deleteFamily = (id) => {
    setFamilies(families.filter(f => f.id !== id));
  };

  // Get family by id
  const getFamilyById = (id) => {
    return families.find(f => f.id === id);
  };

  // Add mohalla
  const addMohalla = (mohalla) => {
    if (!mohallas.includes(mohalla)) {
      setMohallas([...mohallas, mohalla]);
    }
  };

  // Delete mohalla
  const deleteMohalla = (mohalla) => {
    setMohallas(mohallas.filter(m => m !== mohalla));
  };

  // Add caste
  const addCaste = (caste) => {
    if (!castes.includes(caste)) {
      setCastes([...castes, caste]);
    }
  };

  // Delete caste
  const deleteCaste = (caste) => {
    setCastes(castes.filter(c => c !== caste));
  };

  // Reset all data
  const resetData = () => {
    setFamilies(initialFamilies);
    setMohallas(initialMohallas);
    setCastes(initialCastes);
  };

  // Export data as JSON
  const exportData = () => {
    const data = {
      families,
      mohallas,
      castes,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grampulse-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import data from JSON
  const importData = (data) => {
    if (data.families) setFamilies(data.families);
    if (data.mohallas) setMohallas(data.mohallas);
    if (data.castes) setCastes(data.castes);
  };

  return (
    <DataContext.Provider value={{
      families,
      mohallas,
      castes,
      darkMode,
      setDarkMode,
      language,
      setLanguage,
      t,
      addFamily,
      updateFamily,
      deleteFamily,
      getFamilyById,
      addMohalla,
      deleteMohalla,
      addCaste,
      deleteCaste,
      resetData,
      exportData,
      importData
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
