
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/contexts/AppContext';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, FileText } from 'lucide-react';
import { getYear, getMonth, subMonths } from 'date-fns';

export default function DashboardPage() {
  const { customers, expenses } = useAppContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalCustomers = customers.length;

  const currentMonth = getMonth(new Date()) + 1; // 1-12
  const currentYear = getYear(new Date());
  
  const lastMonthDate = subMonths(new Date(), 1);
  const lastMonth = getMonth(lastMonthDate) + 1;
  const lastMonthYear = getYear(lastMonthDate);

  const calculateOutstanding = () => {
    return expenses
      .filter(e => !e.paid)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const calculateCollected = (year: number, month: number) => {
     return expenses
      .filter(e => e.paid && e.year === year && e.month === month)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const totalOutstanding = calculateOutstanding();
  const collectedThisMonth = calculateCollected(currentYear, currentMonth);
  const collectedLastMonth = calculateCollected(lastMonthYear, lastMonth);


  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your dairy business.">
        <Link href="/customers/add" passHref>
          <Button>Add New Customer</Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Currently active customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            {/* Icon removed, direct symbol used below */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalOutstanding.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total unpaid amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected (This Month)</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{collectedThisMonth.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">For {currentYear}-{String(currentMonth).padStart(2, '0')}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected (Last Month)</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{collectedLastMonth.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">For {lastMonthYear}-{String(lastMonth).padStart(2, '0')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link href="/customers" passHref>
            <Button variant="outline">View All Customers</Button>
          </Link>
          <Link href="/reports" passHref>
            <Button variant="outline">View Reports</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
