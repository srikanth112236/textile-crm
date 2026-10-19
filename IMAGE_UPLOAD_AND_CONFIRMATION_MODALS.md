# Image Upload & Confirmation Modals Implementation

## ✅ Completed Features

### 1. Image Upload for Profile Avatar
- **Replaced**: Avatar URL input field
- **With**: Image upload component with preview
- **Features**:
  - File selection with validation (image types only)
  - File size validation (max 5MB)
  - Image preview before upload
  - Upload progress indicator
  - Remove image functionality
  - Automatic old avatar deletion when new one is uploaded

### 2. Confirmation Modals for All Delete Operations
- **Replaced**: Browser `confirm()` and `alert()` dialogs
- **With**: Reusable `ConfirmationModal` component using Shadcn AlertDialog
- **Applied to**:
  - Address deletion (AddressList component)
  - Account deletion (DeleteAccount component - already had confirmation, kept existing flow)

## 📁 Files Created

### Frontend
1. **`app/components/ui/alert-dialog.tsx`**
   - Shadcn AlertDialog component for modals

2. **`app/components/ui/confirmation-modal.tsx`**
   - Reusable confirmation modal component
   - Supports destructive variant for dangerous actions
   - Loading states

3. **`app/components/profile/ImageUpload.tsx`**
   - Image upload component with preview
   - File validation and error handling
   - Next.js Image component for optimization

4. **`app/app/api/upload/avatar/route.ts`**
   - Next.js API route for image upload
   - Validates file type and size
   - Forwards to backend API

### Backend
1. **`server/src/routes/uploadRoutes.ts`**
   - Multer configuration for file uploads
   - File validation (image types, 5MB limit)
   - Creates uploads directory if needed

2. **`server/src/controllers/uploadController.ts`**
   - Handles avatar upload
   - Deletes old avatar when new one is uploaded
   - Updates user profile with new avatar URL

## 🔧 Files Modified

### Frontend
1. **`app/package.json`**
   - Added `@radix-ui/react-alert-dialog` package

2. **`app/components/profile/ProfileForm.tsx`**
   - Replaced avatar URL input with `ImageUpload` component
   - Removed avatar from form schema (handled separately)

3. **`app/components/profile/AddressList.tsx`**
   - Replaced `confirm()` with `ConfirmationModal`
   - Removed `alert()` error messages
   - Added proper modal state management

### Backend
1. **`server/package.json`**
   - Added `multer` and `@types/multer` packages

2. **`server/src/server.ts`**
   - Added static file serving for `/uploads` directory
   - Added upload routes

## 🎯 How It Works

### Image Upload Flow
1. User selects image file in `ImageUpload` component
2. File is validated (type and size)
3. Preview is shown immediately
4. File is uploaded to `/api/upload/avatar` (Next.js API route)
5. Next.js route forwards to backend `/api/upload/avatar`
6. Backend saves file to `server/uploads/avatars/`
7. Backend updates user profile with image URL
8. Image URL is returned and stored in component state
9. When profile is saved, avatar URL is included in update

### Confirmation Modal Flow
1. User clicks delete button
2. `ConfirmationModal` opens with warning message
3. User confirms or cancels
4. If confirmed, delete operation proceeds
5. Loading state shown during operation
6. Success/error feedback provided

## 📝 Usage Examples

### Using ConfirmationModal
```tsx
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

const [showModal, setShowModal] = useState(false);

<ConfirmationModal
  open={showModal}
  onOpenChange={setShowModal}
  onConfirm={handleDelete}
  title="Delete Address"
  description="Are you sure you want to delete this address? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  variant="destructive"
  isLoading={isDeleting}
/>
```

### Using ImageUpload
```tsx
import ImageUpload from '@/components/profile/ImageUpload';

<ImageUpload
  currentImageUrl={profile.avatar}
  onImageUploaded={(url) => setAvatarUrl(url)}
  maxSizeMB={5}
/>
```

## 🔒 Security Features

1. **File Validation**:
   - Only image files accepted
   - File size limit (5MB)
   - File type validation on both frontend and backend

2. **Authentication**:
   - All upload endpoints require authentication
   - Users can only upload their own avatars

3. **File Storage**:
   - Files stored in `server/uploads/avatars/`
   - Unique filenames prevent conflicts
   - Old avatars automatically deleted

## 🚀 Next Steps

1. **Install Dependencies**:
   ```bash
   cd app && npm install
   cd ../server && npm install
   ```

2. **Create Uploads Directory**:
   - Backend will create `server/uploads/avatars/` automatically
   - Or create manually: `mkdir -p server/uploads/avatars`

3. **Test Image Upload**:
   - Go to Profile page
   - Click "Upload Image" button
   - Select an image file
   - Verify upload and preview

4. **Test Delete Confirmations**:
   - Try deleting an address
   - Verify modal appears
   - Confirm deletion works

## ⚠️ Important Notes

1. **File Storage**: In production, consider using:
   - Cloud storage (AWS S3, Cloudinary, etc.)
   - CDN for serving images
   - Image optimization service

2. **File Cleanup**: Old avatars are deleted automatically, but consider:
   - Scheduled cleanup job for orphaned files
   - Backup strategy before deletion

3. **CORS**: If serving images from different domain, configure CORS properly

4. **Rate Limiting**: Consider adding rate limiting to upload endpoint

## 🐛 Troubleshooting

### Image not uploading
- Check backend server is running
- Verify uploads directory exists and is writable
- Check browser console for errors
- Verify file size is under 5MB

### Modal not appearing
- Check `@radix-ui/react-alert-dialog` is installed
- Verify component is imported correctly
- Check browser console for errors

### Old avatar not deleted
- Check file permissions on uploads directory
- Verify avatar URL format matches expected pattern
- Check server logs for errors

