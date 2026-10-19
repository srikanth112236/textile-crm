'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Address } from '@/lib/api/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required').max(200, 'Street address cannot exceed 200 characters'),
  city: z.string().min(1, 'City is required').max(100, 'City cannot exceed 100 characters'),
  state: z.string().min(1, 'State is required').max(100, 'State cannot exceed 100 characters'),
  zip: z.string().min(1, 'ZIP code is required').max(20, 'ZIP code cannot exceed 20 characters'),
  country: z.string().min(1, 'Country is required').max(100, 'Country cannot exceed 100 characters'),
  isDefault: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  address: Address | null;
  onSave: (address: Omit<Address, '_id'> | Partial<Address>) => Promise<void>;
  onCancel: () => void;
}

export default function AddressForm({ address, onSave, onCancel }: AddressFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: address
      ? {
          street: address.street,
          city: address.city,
          state: address.state,
          zip: address.zip,
          country: address.country,
          isDefault: address.isDefault,
        }
      : {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: '',
          isDefault: false,
        },
  });

  const onSubmit = async (data: AddressFormData) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSave(data);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to save address');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="street">Street Address</Label>
          <Input
            id="street"
            type="text"
            placeholder="123 Main St"
            {...register('street')}
            className={errors.street ? 'border-destructive' : ''}
          />
          {errors.street && (
            <p className="text-sm text-destructive">{errors.street.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            type="text"
            placeholder="New York"
            {...register('city')}
            className={errors.city ? 'border-destructive' : ''}
          />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State/Province</Label>
          <Input
            id="state"
            type="text"
            placeholder="NY"
            {...register('state')}
            className={errors.state ? 'border-destructive' : ''}
          />
          {errors.state && (
            <p className="text-sm text-destructive">{errors.state.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="zip">ZIP/Postal Code</Label>
          <Input
            id="zip"
            type="text"
            placeholder="10001"
            {...register('zip')}
            className={errors.zip ? 'border-destructive' : ''}
          />
          {errors.zip && (
            <p className="text-sm text-destructive">{errors.zip.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            type="text"
            placeholder="United States"
            {...register('country')}
            className={errors.country ? 'border-destructive' : ''}
          />
          {errors.country && (
            <p className="text-sm text-destructive">{errors.country.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isDefault"
          {...register('isDefault')}
          className="h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="isDefault" className="text-sm font-normal cursor-pointer">
          Set as default address
        </Label>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-md bg-red-50 text-red-800 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {address ? 'Update Address' : 'Add Address'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

