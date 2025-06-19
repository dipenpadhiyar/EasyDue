
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/contexts/AppContext';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit, PlusCircle, Search, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CustomerFormSheet from './CustomerFormSheet';
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";

export default function CustomersPage() {
  const { customers } = useAppContext();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!mounted) return [];
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm))
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, searchTerm, mounted]);

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsSheetOpen(true);
  };

  const handleEditCustomer = (customerId: string) => {
    setEditingCustomer(customerId);
    setIsSheetOpen(true);
  };

  const handleDownloadAllCustomers = () => {
    const dataToExport = filteredCustomers.map(customer => ({
      'ID': customer.id,
      'Name': customer.name,
      'Phone': customer.phone || 'N/A',
      'Address': customer.address || 'N/A',
      'Notes': customer.notes || 'N/A',
      'Joined Date': customer.createdAt ? format(parseISO(customer.createdAt), 'yyyy-MM-dd') : 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "All Customers");
    XLSX.writeFile(workbook, "all_customers.xlsx");
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
      <PageHeader title="Customers" description="Manage your customer records.">
        <div className="flex space-x-2">
          <Button onClick={handleAddCustomer}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
          </Button>
          <Button onClick={handleDownloadAllCustomers} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Download All
          </Button>
        </div>
      </PageHeader>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>View, search, and manage your customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers by name or phone..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {filteredCustomers.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer, index) => (
                    <TableRow 
                      key={customer.id}
                      className={cn(
                        searchTerm && index === 0 ? "bg-accent/20" : ""
                      )}
                    >
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>{customer.address || '-'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/customers/${customer.id}`)} title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditCustomer(customer.id)} title="Edit Customer">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm ? "No customers match your search." : "No customers found. Add your first customer!"}
            </div>
          )}
        </CardContent>
      </Card>
      <CustomerFormSheet 
        isOpen={isSheetOpen} 
        onOpenChange={setIsSheetOpen}
        customerId={editingCustomer}
      />
    </>
  );
}
