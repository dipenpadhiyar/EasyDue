
"use client";

import type { Customer, ExpenseRecord, Theme } from "@/lib/types";
import useLocalStorage from "@/hooks/useLocalStorage";
import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo } from "react";
import { formatISO, parseISO } from 'date-fns';

interface AppContextType {
  customers: Customer[];
  expenses: ExpenseRecord[];
  addCustomer: (customerData: Omit<Customer, "id" | "createdAt">) => Customer;
  updateCustomer: (customerData: Customer) => void;
  getCustomerById: (id: string) => Customer | undefined;
  addExpense: (expenseData: Omit<ExpenseRecord, "id" | "dateAdded" | "lastUpdated">) => ExpenseRecord;
  updateExpense: (expenseData: ExpenseRecord) => void;
  getExpensesForCustomer: (customerId: string) => ExpenseRecord[];
  getExpenseForCustomerByMonthYear: (customerId: string, year: number, month: number) => ExpenseRecord | undefined;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  getMonthlySummary: (year: number, month: number) => { totalBilled: number; totalPaid: number };
  getYearlySummary: (year: number) => Array<{ month: number; totalBilled: number; totalPaid: number }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Define stable initial values outside the component to prevent new references on each render
const STABLE_INITIAL_CUSTOMERS: Customer[] = [];
const STABLE_INITIAL_EXPENSES: ExpenseRecord[] = [];
const STABLE_INITIAL_THEME: Theme = "system";

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useLocalStorage<Customer[]>("dairytrack_customers", STABLE_INITIAL_CUSTOMERS);
  const [expenses, setExpenses] = useLocalStorage<ExpenseRecord[]>("dairytrack_expenses", STABLE_INITIAL_EXPENSES);
  const [theme, setThemeState] = useLocalStorage<Theme>("dairytrack_theme", STABLE_INITIAL_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    if (mounted) {
      const root = window.document.documentElement;
      const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const applyCurrentTheme = () => {
        root.classList.remove("light", "dark"); 
        if (theme === "system") {
          root.classList.add(systemThemeQuery.matches ? "dark" : "light");
        } else {
          root.classList.add(theme);
        }
      };
      
      const handleSystemThemeChange = (event: MediaQueryListEvent) => {
        if (theme === "system") { 
          root.classList.remove("light", "dark");
          root.classList.add(event.matches ? "dark" : "light");
        }
      };

      applyCurrentTheme(); 

      if (theme === "system") {
        systemThemeQuery.addEventListener('change', handleSystemThemeChange);
      }
      
      return () => {
        if (theme === "system") {
          systemThemeQuery.removeEventListener('change', handleSystemThemeChange);
        }
      };
    }
  }, [theme, mounted]);


  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, [setThemeState]);

  const addCustomer = useCallback((customerData: Omit<Customer, "id" | "createdAt">): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(),
      createdAt: formatISO(new Date()),
    };
    setCustomers(prevCustomers => [...prevCustomers, newCustomer]);
    return newCustomer;
  }, [setCustomers]);

  const updateCustomer = useCallback((customerData: Customer) => {
    setCustomers(prevCustomers =>
      prevCustomers.map((c) => (c.id === customerData.id ? customerData : c))
    );
  }, [setCustomers]);

  const getCustomerById = useCallback((id: string): Customer | undefined => {
    return customers.find((c) => c.id === id);
  }, [customers]);

  const addExpense = useCallback((expenseData: Omit<ExpenseRecord, "id" | "dateAdded" | "lastUpdated">): ExpenseRecord => {
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: Date.now().toString(),
      dateAdded: formatISO(new Date()),
      lastUpdated: formatISO(new Date()),
    };
    setExpenses(prevExpenses => [...prevExpenses, newExpense]);
    return newExpense;
  }, [setExpenses]);

  const updateExpense = useCallback((expenseData: ExpenseRecord) => {
    setExpenses(prevExpenses =>
      prevExpenses.map((e) =>
        e.id === expenseData.id ? { ...expenseData, lastUpdated: formatISO(new Date()) } : e
      )
    );
  }, [setExpenses]);

  const getExpensesForCustomer = useCallback((customerId: string): ExpenseRecord[] => {
    return expenses.filter((e) => e.customerId === customerId).sort((a,b) => parseISO(b.dateAdded).getTime() - parseISO(a.dateAdded).getTime());
  }, [expenses]);

  const getExpenseForCustomerByMonthYear = useCallback((customerId: string, year: number, month: number): ExpenseRecord | undefined => {
    return expenses.find(e => e.customerId === customerId && e.year === year && e.month === month);
  }, [expenses]);
  
  const getMonthlySummary = useCallback((year: number, month: number): { totalBilled: number; totalPaid: number } => {
    const monthlyExpenses = expenses.filter(e => e.year === year && e.month === month);
    const totalBilled = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPaid = monthlyExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
    return { totalBilled, totalPaid };
  }, [expenses]);

  const getYearlySummary = useCallback((year: number): Array<{ month: number; totalBilled: number; totalPaid: number }> => {
    const summary = [];
    for (let i = 1; i <= 12; i++) {
      summary.push({ month: i, ...getMonthlySummary(year, i) });
    }
    return summary;
  }, [getMonthlySummary]); // Removed 'expenses' as getMonthlySummary already depends on it


  const contextValue = useMemo(() => ({
    customers,
    expenses,
    addCustomer,
    updateCustomer,
    getCustomerById,
    addExpense,
    updateExpense,
    getExpensesForCustomer,
    getExpenseForCustomerByMonthYear,
    theme,
    setTheme,
    getMonthlySummary,
    getYearlySummary,
  }), [
    customers, expenses, addCustomer, updateCustomer, getCustomerById,
    addExpense, updateExpense, getExpensesForCustomer, getExpenseForCustomerByMonthYear,
    theme, setTheme, getMonthlySummary, getYearlySummary
  ]);

  if (!mounted) {
    // Render nothing or a loading indicator until the client has mounted
    // This helps prevent hydration mismatches with localStorage
    return null; 
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

