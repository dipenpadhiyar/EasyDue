
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/contexts/AppContext';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const customerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  customerId?: string | null; // For editing
}

export default function CustomerFormSheet({ isOpen, onOpenChange, customerId }: CustomerFormSheetProps) {
  const { addCustomer, updateCustomer, getCustomerById } = useAppContext();
  const { toast } = useToast();
  
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      notes: '',
    },
  });

  const editingCustomer = customerId ? getCustomerById(customerId) : null;

  useEffect(() => {
    if (editingCustomer) {
      form.reset({
        name: editingCustomer.name,
        phone: editingCustomer.phone || '',
        address: editingCustomer.address || '',
        notes: editingCustomer.notes || '',
      });
    } else {
      form.reset({ name: '', phone: '', address: '', notes: '' });
    }
  }, [editingCustomer, form, isOpen]);

  const onSubmit = (data: CustomerFormData) => {
    try {
      if (editingCustomer) {
        updateCustomer({ ...editingCustomer, ...data });
        toast({ title: "Customer Updated", description: `${data.name} has been updated successfully.` });
      } else {
        addCustomer(data);
        toast({ title: "Customer Added", description: `${data.name} has been added successfully.` });
      }
      onOpenChange(false); 
      form.reset(); 
    } catch (error) {
      toast({ title: "Error", description: "An error occurred. Please try again.", variant: "destructive" });
      console.error("Form submission error:", error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <div className="flex flex-col space-y-2 text-center sm:text-left mb-6">
          <SheetTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</SheetTitle>
          <SheetDescription>
            {editingCustomer ? 'Update the details of this customer.' : 'Enter the details for the new customer.'}
          </SheetDescription>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Customer's address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any specific notes about the customer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="pt-6">
              <SheetClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </SheetClose>
              <Button type="submit">{editingCustomer ? 'Save Changes' : 'Add Customer'}</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
