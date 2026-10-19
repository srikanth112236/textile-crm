'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { profileApi, UserProfile, Address } from '@/lib/api/profile';
import ProfileForm from './ProfileForm';
import { MeasurementsForm } from './MeasurementsForm';
import AddressList from './AddressList';
import LoyaltyPointsCard from '@/components/loyalty/LoyaltyPointsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export default function ProfileClient() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    // Auth is handled centrally (interceptor + AuthSessionManager) — no
    // manual session sync here; the old call could overwrite a fresh token
    // with the login-time snapshot.
    loadProfile();
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileApi.getProfile();
      // Decode HTML-encoded avatar URL if present
      if (data.avatar) {
        data.avatar = data.avatar.replace(/&amp;#x2F;/g, '/').replace(/&amp;/g, '&');
      }
      setProfile(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load profile';
      setError(errorMessage);
      console.error('Load profile error:', err);
      
      // If it's an auth error, redirect to login
      if (err.response?.status === 401) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const data = await profileApi.getAddresses();
      setAddresses(data);
    } catch (err: any) {
      console.error('Load addresses error:', err);
      // Don't show error for addresses if profile loaded successfully
    }
  };

  const handleProfileUpdate = async (data: Partial<UserProfile>) => {
    try {
      const updated = await profileApi.updateProfile(data);
      setProfile(updated);
      return true;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleAddressAdd = async (address: Omit<Address, '_id'>) => {
    try {
      const newAddress = await profileApi.addAddress(address);
      setAddresses([...addresses, newAddress]);
      return true;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to add address');
    }
  };

  const handleAddressUpdate = async (addressId: string, address: Partial<Address>) => {
    try {
      const updated = await profileApi.updateAddress(addressId, address);
      setAddresses(addresses.map((addr) => (addr._id === addressId ? updated : addr)));
      return true;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to update address');
    }
  };

  const handleAddressDelete = async (addressId: string) => {
    try {
      await profileApi.deleteAddress(addressId);
      setAddresses(addresses.filter((addr) => addr._id !== addressId));
      return true;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to delete address');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive text-sm mb-4">
              {typeof error === 'string' ? error : 'Failed to load profile. Please try again.'}
            </p>
            <div className="flex gap-3">
              <Button onClick={loadProfile}>
                Retry
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/login'}
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile information and addresses
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="size">My Size</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty Points</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              {profile && (
                <ProfileForm
                  profile={profile}
                  onUpdate={handleProfileUpdate}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="size" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Size</CardTitle>
              <CardDescription>Your body measurements power Find My Size on every product</CardDescription>
            </CardHeader>
            <CardContent>
              {profile && (
                <MeasurementsForm
                  initial={(profile as any).measurements}
                  onSaved={(m) => setProfile({ ...profile, measurements: m } as any)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Addresses</CardTitle>
              <CardDescription>Manage your shipping addresses</CardDescription>
            </CardHeader>
            <CardContent>
              <AddressList
                addresses={addresses}
                onAdd={handleAddressAdd}
                onUpdate={handleAddressUpdate}
                onDelete={handleAddressDelete}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loyalty" className="mt-6">
          <LoyaltyPointsCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

