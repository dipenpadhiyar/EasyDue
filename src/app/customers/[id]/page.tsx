
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import type { Customer, ExpenseRecord } from '@/lib/types';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, PlusCircle } from 'lucide-react';
import ExpenseFormModal from './ExpenseFormModal';
import { format, getYear } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getCustomerById, getExpensesForCustomer, updateExpense } = useAppContext();
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerExpenses, setCustomerExpenses] = useState<ExpenseRecord[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [targetMonthYear, setTargetMonthYear] = useState<{ month: number, year: number} | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    if (customerId) {
      const cust = getCustomerById(customerId);
      if (cust) {
        setCustomer(cust);
        setCustomerExpenses(getExpensesForCustomer(customerId));
      } else {
        router.push('/customers'); 
      }
    }
  }, [customerId, getCustomerById, getExpensesForCustomer, router]);

  const availableYears = useMemo(() => {
    if (!mounted) return [getYear(new Date())];
    const expenseYears = new Set(customerExpenses.map(e => e.year));
    const currentActionYear = getYear(new Date()); // Year for actions like adding new expense for current year
    expenseYears.add(currentActionYear); 
    
    // Ensure selectedYear is an option, especially if navigating or no expenses exist for it yet
    if (selectedYear && !expenseYears.has(selectedYear)) {
        expenseYears.add(selectedYear);
    }

    const sortedYears = Array.from(expenseYears).sort((a, b) => b - a);
    return sortedYears;
  }, [customerExpenses, mounted, selectedYear]);

  // Adjust selectedYear if it becomes invalid (e.g., after deleting all expenses for that year)
  useEffect(() => {
    if (mounted && availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0] || getYear(new Date()));
    }
  }, [availableYears, selectedYear, mounted]);


  const handleAddExpenseClick = (year: number, month: number) => {
    setEditingExpense(null);
    setTargetMonthYear({ year, month });
    setIsExpenseModalOpen(true);
  };

  const handleEditExpenseClick = (expense: ExpenseRecord) => {
    setEditingExpense(expense);
    setTargetMonthYear(null); 
    setIsExpenseModalOpen(true);
  };

  const handleTogglePaidStatus = (expense: ExpenseRecord) => {
    updateExpense({ ...expense, paid: !expense.paid });
    setCustomerExpenses(getExpensesForCustomer(customerId)); 
    toast({ title: "Payment Status Updated", description: `Expense for ${format(new Date(expense.year, expense.month -1), 'MMMM yyyy')} marked as ${!expense.paid ? 'paid' : 'unpaid'}.`});
  };

  const monthsForDisplay = Array.from({ length: 12 }).map((_, i) => {
    return { year: selectedYear, month: i + 1 };
  });

  if (!mounted || !customer) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title={customer.name} description={`Details for ${customer.name}.`}>
        <Button variant="outline" onClick={() => router.push('/customers')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
        </Button>
      </PageHeader>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Phone:</strong> {customer.phone || 'N/A'}</p>
          <p><strong>Address:</strong> {customer.address || 'N/A'}</p>
          <p><strong>Notes:</strong> {customer.notes || 'N/A'}</p>
          <p><strong>Joined:</strong> {customer.createdAt ? format(new Date(customer.createdAt), 'PPP') : 'N/A'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Monthly Expenses for {selectedYear}</CardTitle>
              <CardDescription>Track payments and outstanding amounts for {selectedYear}.</CardDescription>
            </div>
            {availableYears.length > 0 && (
            <Select
              value={String(selectedYear)}
              onValueChange={(value) => setSelectedYear(Number(value))}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthsForDisplay.map(({ year, month }) => {
              const expense = customerExpenses.find(e => e.year === year && e.month === month);
              const monthLabel = format(new Date(year, month - 1), 'MMMM yyyy');
              
              return (
                <Card key={`${year}-${month}`} className={expense && expense.paid ? 'border-green-500' : (expense ? 'border-red-500' : '')}>
                  <CardHeader>
                    <CardTitle className="text-lg">{format(new Date(year, month - 1), 'MMMM')}</CardTitle> {/* Only month name here */}
                  </CardHeader>
                  <CardContent>
                    {expense ? (
                      <>
                        <p className="text-2xl font-bold mb-2">₹{expense.amount.toFixed(2)}</p>
                        <p className={`font-semibold mb-3 ${expense.paid ? 'text-green-600' : 'text-red-600'}`}>
                          {expense.paid ? 'Paid' : 'Unpaid'}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleTogglePaidStatus(expense)}>
                            {expense.paid ? 'Mark Unpaid' : 'Mark Paid'}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditExpenseClick(expense)} title="Edit Expense">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground mb-2">No record</p>
                        <Button size="sm" onClick={() => handleAddExpenseClick(year, month)}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onOpenChange={setIsExpenseModalOpen}
        customerId={customerId}
        expense={editingExpense}
        targetMonthYear={targetMonthYear}
        onSuccess={() => {
          setCustomerExpenses(getExpensesForCustomer(customerId)); // Refresh expenses
        }} 
      />
    </>
  );
}

