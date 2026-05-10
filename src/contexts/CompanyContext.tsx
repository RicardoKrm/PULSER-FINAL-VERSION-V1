import React, { createContext, useContext, useState } from 'react';

export interface Company {
  id: string;
  name: string;
  fleetSize: number;
  usersCount: number;
  status: 'Activo' | 'Inactivo';
  joinDate: string;
  razonSocial?: string;
  expirationDate?: string;
}

export const mockCompanies: Company[] = [
  { id: 'GLOBAL', name: '🏢 Visión Global (Todas las empresas)', fleetSize: 217, usersCount: 45, status: 'Activo', joinDate: '2020-01-01' },
  { id: 'COMP-001', name: 'Logística Sur S.A.', fleetSize: 30, usersCount: 5, status: 'Activo', joinDate: '2023-05-15', razonSocial: 'Logística del Sur S.A.', expirationDate: '2026-05-15' },
  { id: 'COMP-002', name: 'Minerals Corp', fleetSize: 12, usersCount: 3, status: 'Activo', joinDate: '2023-11-02' },
  { id: 'COMP-003', name: 'Transportes ACME', fleetSize: 45, usersCount: 7, status: 'Activo', joinDate: '2022-08-20' },
  { id: 'COMP-004', name: 'Distribuidora Central', fleetSize: 80, usersCount: 15, status: 'Activo', joinDate: '2021-03-10' },
  { id: 'COMP-005', name: 'Constructora Alfa', fleetSize: 25, usersCount: 6, status: 'Inactivo', joinDate: '2024-01-05' },
  { id: 'COMP-006', name: 'Servicios Express', fleetSize: 15, usersCount: 4, status: 'Activo', joinDate: '2023-09-18' },
  { id: 'COMP-007', name: 'Forestal Maderera', fleetSize: 10, usersCount: 5, status: 'Activo', joinDate: '2022-11-30' },
];

export interface ExpirationOption {
  value: string;
  label: string;
}

export const initialExpirationOptions: ExpirationOption[] = [
  { value: '6m', label: '6 Meses' },
  { value: '1y', label: '1 Año' },
];

interface CompanyContextType {
  companies: Company[];
  activeCompanyId: string;
  setActiveCompanyId: (id: string) => void;
  activeCompany: Company | undefined;
  addCompany: (company: Omit<Company, 'id'>) => void;
  expirationOptions: ExpirationOption[];
  addExpirationOption: (option: ExpirationOption) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [activeCompanyId, setActiveCompanyId] = useState<string>(mockCompanies[0].id);
  const [expirationOptions, setExpirationOptions] = useState<ExpirationOption[]>(initialExpirationOptions);

  const activeCompany = companies.find(c => c.id === activeCompanyId);

  const addCompany = (company: Omit<Company, 'id'>) => {
    const newId = `COMP-${(companies.length + 1).toString().padStart(3, '0')}`;
    setCompanies([...companies, { ...company, id: newId }]);
  };

  const addExpirationOption = (option: ExpirationOption) => {
    if (!expirationOptions.some(opt => opt.value === option.value)) {
      setExpirationOptions([...expirationOptions, option]);
    }
  };

  return (
    <CompanyContext.Provider value={{ companies, activeCompanyId, setActiveCompanyId, activeCompany, addCompany, expirationOptions, addExpirationOption }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
