import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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
  currentCompany: Company | undefined;
  addCompany: (company: Omit<Company, 'id'>) => void;
  toggleCompanyStatus: (id: string) => void;
  expirationOptions: ExpirationOption[];
  addExpirationOption: (option: ExpirationOption) => void;
  isSuperAdmin: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string>('');
  const [expirationOptions, setExpirationOptions] = useState<ExpirationOption[]>(initialExpirationOptions);

  const isSuperAdmin = profile?.rol?.nombre === 'Súper Administrador' || profile?.rol?.nombre === 'Super Administrador';

  useEffect(() => {
    const fetchCompanies = async () => {
      // Si es super admin, cargar todas las empresas. Si no, solo la suya (o quizás no necesite cargar la lista completa, pero la cargamos por consistencia)
      if (isSuperAdmin) {
        try {
          const { data, error } = await supabase.from('empresa').select('*').order('nombre', { ascending: true });
          if (data && data.length > 0 && !error) {
            const mapped: Company[] = data.map(e => ({
              id: e.id,
              name: e.nombre,
              razonSocial: e.razon_social,
              status: e.estado as any,
              joinDate: e.created_at,
              fleetSize: 0,
              usersCount: 0
            }));
            setCompanies(mapped);
            
            if (!activeCompanyId && mapped.length > 0) {
              // Check if there is a saved tenant id in local storage
              const savedTenant = localStorage.getItem('superAdminTenantId');
              if (savedTenant && mapped.find(c => c.id === savedTenant)) {
                setActiveCompanyId(savedTenant);
              } else {
                setActiveCompanyId(mapped[0].id);
              }
            }
          } else {
            // Fallback para super admin si no hay empresas en la base de datos
            const defaultId = 'emp-001';
            const fallbackComp: Company = {
              id: defaultId,
              name: 'Empresa Principal (Demo)',
              razonSocial: 'Empresa Principal S.A.',
              status: 'Activo',
              joinDate: new Date().toISOString(),
              fleetSize: 0,
              usersCount: 0
            };
            setCompanies([fallbackComp]);
            setActiveCompanyId(defaultId);
          }
        } catch (err) {
          console.warn('Error fetching companies, using fallback:', err);
          const defaultId = 'emp-001';
          const fallbackComp: Company = {
            id: defaultId,
            name: 'Empresa Principal (Demo)',
            razonSocial: 'Empresa Principal S.A.',
            status: 'Activo',
            joinDate: new Date().toISOString(),
            fleetSize: 0,
            usersCount: 0
          };
          setCompanies([fallbackComp]);
          setActiveCompanyId(defaultId);
        }
      } else if (profile?.empresa_id) {
        // Cargar solo su empresa o usar fallback si no existe
        try {
          const { data, error } = await supabase.from('empresa').select('*').eq('id', profile.empresa_id).single();
          if (data && !error) {
            const comp: Company = {
              id: data.id,
              name: data.nombre,
              razonSocial: data.razon_social,
              status: data.estado as any,
              joinDate: data.created_at,
              fleetSize: 0,
              usersCount: 0
            };
            setCompanies([comp]);
            setActiveCompanyId(comp.id);
          } else {
            // Fallback si la empresa no existe en la base de datos
            const fallbackComp: Company = {
              id: profile.empresa_id,
              name: profile.empresa?.nombre || 'Empresa Principal',
              razonSocial: profile.empresa?.rut || 'Empresa Principal S.A.',
              status: 'Activo',
              joinDate: new Date().toISOString(),
              fleetSize: 0,
              usersCount: 0
            };
            setCompanies([fallbackComp]);
            setActiveCompanyId(fallbackComp.id);
          }
        } catch (err) {
          console.warn('Error fetching single company, using fallback:', err);
          const fallbackComp: Company = {
            id: profile.empresa_id,
            name: profile.empresa?.nombre || 'Empresa Principal',
            razonSocial: profile.empresa?.rut || 'Empresa Principal S.A.',
            status: 'Activo',
            joinDate: new Date().toISOString(),
            fleetSize: 0,
            usersCount: 0
          };
          setCompanies([fallbackComp]);
          setActiveCompanyId(fallbackComp.id);
        }
      } else {
        // Fallback cuando no hay perfil o no tiene empresa_id
        const defaultId = 'emp-001';
        const fallbackComp: Company = {
          id: defaultId,
          name: 'Empresa Principal',
          status: 'Activo',
          joinDate: new Date().toISOString(),
          fleetSize: 0,
          usersCount: 0
        };
        setCompanies([fallbackComp]);
        setActiveCompanyId(defaultId);
      }
    };

    // Load initially or when profile changes
    if (profile) {
      fetchCompanies();
    }
  }, [profile, isSuperAdmin]); // activeCompanyId removed from deps to prevent reset

  const switchTenant = (id: string) => {
    if (isSuperAdmin) {
      setActiveCompanyId(id);
      localStorage.setItem('superAdminTenantId', id);
    }
  };

  const currentCompany = companies.find(c => c.id === activeCompanyId) || (companies.length > 0 ? companies[0] : undefined);
  const activeCompany = currentCompany; // Alias for legacy code

  const addCompany = (company: Omit<Company, 'id'>) => {
    // Legacy mock function
    const newId = `COMP-${(companies.length + 1).toString().padStart(3, '0')}`;
    setCompanies([...companies, { ...company, id: newId }]);
  };

  const toggleCompanyStatus = (id: string) => {
    // Legacy mock function
    setCompanies(companies.map(c => 
      c.id === id 
        ? { ...c, status: c.status === 'Activo' ? 'Inactivo' : 'Activo' } 
        : c
    ));
  };

  const addExpirationOption = (option: ExpirationOption) => {
    if (!expirationOptions.some(opt => opt.value === option.value)) {
      setExpirationOptions([...expirationOptions, option]);
    }
  };

  return (
    <CompanyContext.Provider value={{ 
      companies, 
      activeCompanyId, 
      setActiveCompanyId: switchTenant, 
      activeCompany, 
      currentCompany,
      addCompany, 
      toggleCompanyStatus, 
      expirationOptions, 
      addExpirationOption,
      isSuperAdmin
    }}>
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
