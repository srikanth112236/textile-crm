'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/contexts/CartContext';
import { profileApi, Address } from '@/lib/api/profile';
import { createOrder, CreateOrderRequest } from '@/lib/api/orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import {
  CreditCard,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

type Step = 'address' | 'review' | 'confirmation';

export default function CheckoutClient() {
  const router = useRouter();
  const { items, total, itemCount, loading: cartLoading, refresh } = useCart();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('address');
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<Omit<Address, '_id' | 'isDefault'>>({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  useEffect(() => {
    if (items.length === 0 && !cartLoading) {
      router.push('/cart');
    }
  }, [items, cartLoading, router]);

  const loadAddresses = async () => {
    try {
      const userAddresses = await profileApi.getAddresses();
      setAddresses(userAddresses);
      if (userAddresses && userAddresses.length > 0) {
        const defaultAddress = userAddresses.find((addr) => addr.isDefault) || userAddresses[0];
        if (defaultAddress && defaultAddress._id) {
          setSelectedAddressId(defaultAddress._id);
          setUseNewAddress(false);
        }
      } else {
        setUseNewAddress(true);
      }
    } catch (error: any) {
      setUseNewAddress(true);
      toast({
        title: 'Notice',
        description: 'Please enter your shipping address to proceed.',
      });
    }
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    setUseNewAddress(false);
  };

  const handleNewAddressChange = (field: keyof typeof newAddress, value: string) => {
    setNewAddress((prev) => ({ ...prev, [field]: value }));
  };

  const validateAddress = (address: Omit<Address, '_id' | 'isDefault'>): boolean => {
    return !!(
      address.street.trim() &&
      address.city.trim() &&
      address.state.trim() &&
      address.zip.trim() &&
      address.country.trim()
    );
  };

  const handleContinueToReview = () => {
    if (useNewAddress) {
      if (!validateAddress(newAddress)) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all address fields',
          variant: 'destructive',
        });
        return;
      }
    } else {
      if (!selectedAddressId) {
        toast({
          title: 'Validation Error',
          description: 'Please select a shipping address',
          variant: 'destructive',
        });
        return;
      }
    }
    setCurrentStep('review');
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const orderData: CreateOrderRequest = {
        paymentMethod: 'manual',
      };

      if (useNewAddress) {
        orderData.shippingAddress = newAddress;
      } else if (selectedAddressId) {
        orderData.shippingAddressId = selectedAddressId;
      } else {
        throw new Error('No shipping address selected');
      }

      const response = await createOrder(orderData);
      setOrderId(response.data._id);
      await refresh();
      setCurrentStep('confirmation');
      toast({
        title: 'Order Placed',
        description: 'Your order has been placed successfully!',
      });
    } catch (error: any) {
      console.error('Create order error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (image: string | { url: string; altText?: string }): string => {
    if (typeof image === 'string') return image;
    return image.url;
  };


  if (cartLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0 && currentStep !== 'confirmation') {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'address'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/20 text-primary'
              }`}
            >
              {currentStep !== 'address' ? <CheckCircle2 className="h-5 w-5" /> : '1'}
            </div>
            <span className={currentStep === 'address' ? 'font-medium' : ''}>Address</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'review'
                  ? 'bg-primary text-primary-foreground'
                  : currentStep === 'confirmation'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {currentStep === 'confirmation' ? <CheckCircle2 className="h-5 w-5" /> : '2'}
            </div>
            <span className={currentStep === 'review' || currentStep === 'confirmation' ? 'font-medium' : ''}>
              Review
            </span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'confirmation'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {currentStep === 'confirmation' ? <CheckCircle2 className="h-5 w-5" /> : '3'}
            </div>
            <span className={currentStep === 'confirmation' ? 'font-medium' : ''}>Confirmation</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {currentStep === 'address' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
                <CardDescription>Select or enter a shipping address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Existing Addresses */}
                {addresses.length > 0 && (
                  <div className="space-y-3">
                    <Label>Select an existing address</Label>
                    {addresses.map((address) => (
                      <div
                        key={address._id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedAddressId === address._id && !useNewAddress
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleAddressSelect(address._id || '')}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{address.street}</div>
                            <div className="text-sm text-muted-foreground">
                              {address.city}, {address.state} {address.zip}
                            </div>
                            <div className="text-sm text-muted-foreground">{address.country}</div>
                            {address.isDefault && (
                              <Badge variant="secondary" className="mt-2">
                                Default
                              </Badge>
                            )}
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedAddressId === address._id && !useNewAddress
                                ? 'border-primary bg-primary'
                                : 'border-border'
                            }`}
                          >
                            {selectedAddressId === address._id && !useNewAddress && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {addresses.length > 0 && (
                  <Separator className="my-6" />
                )}

                {/* New Address Option */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useNewAddress"
                      checked={useNewAddress}
                      onChange={(e) => {
                        setUseNewAddress(e.target.checked);
                        if (e.target.checked) {
                          setSelectedAddressId(null);
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="useNewAddress" className="cursor-pointer font-medium">
                      Use a new address
                    </Label>
                  </div>

                  {useNewAddress && (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div>
                        <Label htmlFor="street">Street Address *</Label>
                        <Input
                          id="street"
                          value={newAddress.street}
                          onChange={(e) => handleNewAddressChange('street', e.target.value)}
                          placeholder="123 Main St"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={newAddress.city}
                            onChange={(e) => handleNewAddressChange('city', e.target.value)}
                            placeholder="New York"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State *</Label>
                          <Input
                            id="state"
                            value={newAddress.state}
                            onChange={(e) => handleNewAddressChange('state', e.target.value)}
                            placeholder="NY"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="zip">ZIP Code *</Label>
                          <Input
                            id="zip"
                            value={newAddress.zip}
                            onChange={(e) => handleNewAddressChange('zip', e.target.value)}
                            placeholder="10001"
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">Country *</Label>
                          <Input
                            id="country"
                            value={newAddress.country}
                            onChange={(e) => handleNewAddressChange('country', e.target.value)}
                            placeholder="United States"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" asChild>
                    <Link href="/cart">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Cart
                    </Link>
                  </Button>
                  <Button onClick={handleContinueToReview} className="flex-1">
                    Continue to Review
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'review' && (
            <Card>
              <CardHeader>
                <CardTitle>Review Your Order</CardTitle>
                <CardDescription>Please review your order before placing it</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Shipping Address Summary */}
                <div>
                  <h3 className="font-medium mb-2">Shipping Address</h3>
                  <div className="p-4 border rounded-lg bg-muted/50">
                    {useNewAddress ? (
                      <div>
                        <div>{newAddress.street}</div>
                        <div className="text-sm text-muted-foreground">
                          {newAddress.city}, {newAddress.state} {newAddress.zip}
                        </div>
                        <div className="text-sm text-muted-foreground">{newAddress.country}</div>
                      </div>
                    ) : selectedAddressId ? (
                      (() => {
                        const address = addresses.find((a) => a._id === selectedAddressId);
                        return address ? (
                          <div>
                            <div>{address.street}</div>
                            <div className="text-sm text-muted-foreground">
                              {address.city}, {address.state} {address.zip}
                            </div>
                            <div className="text-sm text-muted-foreground">{address.country}</div>
                          </div>
                        ) : null;
                      })()
                    ) : null}
                  </div>
                  <Button
                    variant="link"
                    className="p-0 mt-2"
                    onClick={() => setCurrentStep('address')}
                  >
                    Change Address
                  </Button>
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="font-medium mb-2">Payment Method</h3>
                  <div className="p-4 border rounded-lg bg-muted/50 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <span>Manual Payment (Payment will be confirmed by admin)</span>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setCurrentStep('address')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handlePlaceOrder} disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        Place Order
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'confirmation' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Order Confirmed!
                </CardTitle>
                <CardDescription>Your order has been placed successfully</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Your order has been placed successfully. Payment will be confirmed by an admin, and you will
                    receive updates on your order status.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button asChild variant="outline">
                    <Link href="/products">Continue Shopping</Link>
                  </Button>
                  {orderId && (
                    <Button asChild>
                      <Link href={`/orders/${orderId}`}>View Order</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary Sidebar */}
        {(currentStep === 'address' || currentStep === 'review') && (
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={`${item.productId}-${index}`} className="flex gap-3">
                      <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                        {item.product.images && item.product.images.length > 0 && (
                          <Image
                            src={getImageUrl(item.product.images[0])}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm line-clamp-2">{item.product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × {formatPrice(item.price)}
                        </div>
                        {item.variations && item.variations.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.variations.map((v) => `${v.name}: ${v.value}`).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-medium">{formatPrice(item.subtotal)}</div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

