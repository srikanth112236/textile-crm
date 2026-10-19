'use client';

import { useState } from 'react';
import { Address, profileApi } from '@/lib/api/profile';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import AddressForm from './AddressForm';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

interface AddressListProps {
  addresses: Address[];
  onAdd: (address: Omit<Address, '_id'>) => Promise<boolean>;
  onUpdate: (addressId: string, address: Partial<Address>) => Promise<boolean>;
  onDelete: (addressId: string) => Promise<boolean>;
}

export default function AddressList({
  addresses,
  onAdd,
  onUpdate,
  onDelete,
}: AddressListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleEdit = (addressId: string) => {
    setEditingId(addressId);
    setShowAddForm(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleSave = async (address: Omit<Address, '_id'> | Partial<Address>) => {
    try {
      if (editingId) {
        await onUpdate(editingId, address);
        setEditingId(null);
      } else {
        await onAdd(address as Omit<Address, '_id'>);
        setShowAddForm(false);
      }
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteClick = (addressId: string) => {
    setAddressToDelete(addressId);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!addressToDelete) return;

    try {
      setDeletingId(addressToDelete);
      setDeleteError(null);
      await onDelete(addressToDelete);
      setShowDeleteModal(false);
      setAddressToDelete(null);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete address';
      setDeleteError(errorMessage);
      // Keep modal open if it's a connection error so user can see the message
      if (errorMessage.includes('Backend server is not running')) {
        // Don't close modal, show error
      } else {
        setShowDeleteModal(false);
        setAddressToDelete(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const editingAddress = editingId
    ? addresses.find((addr) => addr._id === editingId)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Addresses</h3>
        {!showAddForm && !editingId && (
          <Button onClick={() => setShowAddForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Address
          </Button>
        )}
      </div>

      {showAddForm && (
        <div className="border rounded-lg p-4 bg-muted/50">
          <AddressForm
            address={null}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      )}

      {addresses.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No addresses added yet</p>
          <Button onClick={() => setShowAddForm(true)} className="mt-4" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Address
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {addresses.map((address) => (
          <div
            key={address._id}
            className={`border rounded-lg p-4 ${
              address.isDefault ? 'border-primary bg-primary/5' : ''
            }`}
          >
            {editingId === address._id ? (
              <AddressForm
                address={address}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ) : (
              <>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    {address.isDefault && (
                      <span className="inline-block px-2 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded mb-2">
                        Default
                      </span>
                    )}
                    <p className="font-medium">{address.street}</p>
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.state} {address.zip}
                    </p>
                    <p className="text-sm text-muted-foreground">{address.country}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(address._id!)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(address._id!)}
                      disabled={deletingId === address._id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Delete Address"
        description={
          deleteError ? (
            <div className="space-y-2">
              <p>Are you sure you want to delete this address? This action cannot be undone.</p>
              <p className="text-destructive text-sm font-medium">{deleteError}</p>
              {deleteError.includes('Backend server is not running') && (
                <p className="text-xs text-muted-foreground mt-2">
                  Please start the backend server: <code className="bg-muted px-1 py-0.5 rounded text-xs">cd server && npm run dev</code>
                </p>
              )}
            </div>
          ) : (
            "Are you sure you want to delete this address? This action cannot be undone."
          )
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deletingId !== null}
      />
    </div>
  );
}

