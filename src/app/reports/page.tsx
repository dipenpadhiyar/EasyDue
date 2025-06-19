
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '@/components/PageHeader';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { getYear, format } from 'date-fns';
import type { Customer } from '@/lib/types';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82Ca9D'];

export default function ReportsPage() {
  const { expenses, customers, getYearlySummary } = useAppContext();
  const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const yearlyData = useMemo(() => {
    if (!mounted) return [];
    return getYearlySummary(selectedYear).map(item => ({
      month: format(new Date(selectedYear, item.month - 1), 'MMM'),
      Billed: item.totalBilled,
      Paid: item.totalPaid,
    }));
  }, [selectedYear, getYearlySummary, mounted]);

  const customerBalances = useMemo(() => {
    if (!mounted) return [];
    return customers.map(customer => {
      const customerExpenses = expenses.filter(e => e.customerId === customer.id);
      const totalBilled = customerExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalPaid = customerExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
      return {
        id: customer.id,
        name: customer.name,
        totalBilled,
        totalPaid,
        outstanding: totalBilled - totalPaid,
      };
    }).filter(cb => cb.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding);
  }, [customers, expenses, mounted]);
  
  const overallStats = useMemo(() => {
    if (!mounted) return { totalBilled: 0, totalPaid: 0, totalOutstanding: 0, activeCustomers: 0 };
    const totalBilled = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPaid = expenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
    return {
      totalBilled,
      totalPaid,
      totalOutstanding: totalBilled - totalPaid,
      activeCustomers: customers.length,
    };
  }, [expenses, customers, mounted]);

  const paymentStatusData = useMemo(() => {
    if (!mounted) return [];
    const paidAmount = overallStats.totalPaid;
    const outstandingAmount = overallStats.totalOutstanding;
    return [
      { name: 'Total Paid', value: paidAmount },
      { name: 'Total Outstanding', value: outstandingAmount },
    ].filter(item => item.value > 0);
  }, [overallStats, mounted]);


  const availableYears = useMemo(() => {
    if (!mounted || expenses.length === 0) return [getYear(new Date())];
    const years = new Set(expenses.map(e => e.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [expenses, mounted]);
  
  useEffect(() => {
    if (mounted && availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear, mounted]);

  const handleDownloadBalances = () => {
    const dataToExport = customerBalances.map(cb => ({
      'Customer Name': cb.name,
      'Outstanding Amount (₹)': cb.outstanding.toFixed(2),
    }));

    if (dataToExport.length === 0) {
      toast({ title: "No Data", description: "There are no outstanding balances to download." });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Outstanding Balances");
    XLSX.writeFile(workbook, "customer_outstanding_balances.xlsx");
  };

  if (!mounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Reports" description="View financial summaries and key metrics." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Billed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{overallStats.totalBilled.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{overallStats.totalPaid.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">₹{overallStats.totalOutstanding.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Yearly Financial Summary</CardTitle>
            <div className="mt-2">
              <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="h-[350px]">
            {yearlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="Billed" fill="hsl(var(--accent))" />
                <Bar dataKey="Paid" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
            ) : ( <p className="text-muted-foreground text-center pt-10">No data available for {selectedYear}.</p>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall Payment Status</CardTitle>
            <CardDescription>Distribution of paid vs. outstanding amounts.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {paymentStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            ) : ( <p className="text-muted-foreground text-center pt-10">No payment data available.</p>)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Customers with Outstanding Balances</CardTitle>
              <CardDescription>List of customers who have unpaid bills.</CardDescription>
            </div>
            {customerBalances.length > 0 && (
              <Button onClick={handleDownloadBalances} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {customerBalances.length > 0 ? (
            <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead className="text-right">Outstanding Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerBalances.map(cb => (
                  <TableRow key={cb.id}>
                    <TableCell>{cb.name}</TableCell>
                    <TableCell className="text-right font-medium">₹{cb.outstanding.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">No customers with outstanding balances. Great job!</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
