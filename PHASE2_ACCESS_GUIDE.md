# Phase 2 Features - Access & Testing Guide

## 🎯 Quick Access Links

### From User Dashboard (`/user/dashboard`)
1. **Profile Card** - Click "View Profile" button
2. **Account Settings Card** - Click "Open Settings" button

### From Header Navigation (Top Right)
- **Profile** button - Direct link to `/profile`
- **Settings** button - Direct link to `/profile/settings`

## 📍 Direct URLs

### Profile Management
- **Profile Page**: `http://localhost:3001/profile`
  - View and edit your profile information
  - Manage shipping addresses
  - Update name, phone, avatar

- **Account Settings**: `http://localhost:3001/profile/settings`
  - Export your data (GDPR)
  - Delete your account

## 🧪 Testing Phase 2 Features

### 1. Profile Management (`/profile`)

#### Test Profile Information:
1. Navigate to `/profile` or click "Profile" in header
2. **Edit Profile Tab**:
   - Update your name
   - Add/change phone number
   - Add avatar URL (e.g., `https://via.placeholder.com/150`)
   - Click "Save Changes"
   - Verify success message appears

#### Test Address Management:
1. Click on **"Addresses"** tab
2. **Add Address**:
   - Click "Add Address" button
   - Fill in: Street, City, State, ZIP, Country
   - Check "Set as default address" if needed
   - Click "Add Address"
   - Verify address appears in list
3. **Edit Address**:
   - Click edit icon (pencil) on any address
   - Modify fields
   - Click "Update Address"
4. **Delete Address**:
   - Click delete icon (trash) on any address
   - Confirm deletion
   - Verify address is removed
5. **Default Address**:
   - Add multiple addresses
   - Set one as default
   - Verify only one can be default at a time

### 2. GDPR Features (`/profile/settings`)

#### Test Data Export:
1. Navigate to `/profile/settings` or click "Settings" in header
2. Click **"Export Data"** button
3. Verify:
   - JSON file downloads
   - File contains your profile data
   - File contains your addresses
   - File name includes date

#### Test Account Deletion:
1. In Settings page, scroll to **"Delete Account"** section
2. Click **"Delete My Account"** button
3. Review warning message
4. ⚠️ **WARNING**: This will permanently delete your account!
5. If you proceed:
   - Account data will be anonymized
   - You'll be redirected to login
   - Email will be changed to `deleted_<id>@deleted.local`

### 3. Real-Time Notifications

#### Test Socket.io Connection:
1. Open browser console (F12)
2. Look for: `✅ Socket.io connected`
3. Verify connection status

#### Test Notifications (Backend Required):
- Notifications will appear when:
  - Order status updates (Phase 5)
  - Promotions are sent (Phase 6)
  - Low stock alerts (Admin only, Phase 3)

### 4. Cookie Consent

#### Test Cookie Banner:
1. Clear browser localStorage: `localStorage.removeItem('cookie-consent-accepted')`
2. Refresh page
3. Verify cookie consent banner appears at bottom
4. Test buttons:
   - **Accept All Cookies** - Banner disappears
   - **Decline** - Banner disappears
   - **Learn More** - Can add privacy page link later

## 🔍 What to Check

### Profile Page Features:
- ✅ Profile information displays correctly
- ✅ Form validation works (invalid phone, invalid URL)
- ✅ Avatar preview shows when URL is provided
- ✅ Success/error messages appear
- ✅ Address CRUD operations work
- ✅ Only one default address allowed
- ✅ Responsive design (test on mobile)

### Settings Page Features:
- ✅ Data export downloads JSON file
- ✅ Account deletion shows warnings
- ✅ Rate limiting works (try exporting 4+ times quickly)

### Navigation:
- ✅ Header shows Profile and Settings links
- ✅ Dashboard cards link to correct pages
- ✅ All pages have Header navigation
- ✅ Back navigation works

## 🐛 Common Issues & Solutions

### Issue: "Failed to load profile"
- **Solution**: Ensure backend server is running on port 5000
- **Check**: `http://localhost:5000/api/health`

### Issue: "Unauthorized" errors
- **Solution**: Make sure you're logged in
- **Check**: Token in localStorage: `localStorage.getItem('accessToken')`

### Issue: Socket.io not connecting
- **Solution**: 
  1. Check backend Socket.io is initialized
  2. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
  3. Check browser console for connection errors

### Issue: Address not saving
- **Solution**: 
  1. Check all required fields are filled
  2. Verify backend is running
  3. Check browser console for errors

## 📝 API Endpoints Used

### Profile Endpoints:
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `GET /api/profile/addresses` - Get addresses
- `POST /api/profile/addresses` - Add address
- `PUT /api/profile/addresses/:id` - Update address
- `DELETE /api/profile/addresses/:id` - Delete address

### GDPR Endpoints:
- `GET /api/profile/export` - Export data (rate limited: 3/hour)
- `DELETE /api/profile` - Delete account (rate limited: 3/hour)

## 🎨 UI Features to Test

1. **Responsive Design**:
   - Test on mobile (375px width)
   - Test on tablet (768px width)
   - Test on desktop (1920px width)

2. **Accessibility**:
   - Tab navigation works
   - Form labels are associated
   - Error messages are visible
   - Color contrast is sufficient

3. **User Experience**:
   - Loading states show during API calls
   - Success/error feedback is clear
   - Forms reset correctly
   - Navigation is intuitive

## ✅ Phase 2 Checklist

- [x] Profile page accessible
- [x] Profile edit form works
- [x] Address management works
- [x] GDPR export works
- [x] Account deletion works (test carefully!)
- [x] Cookie consent banner appears
- [x] Socket.io client connects
- [x] Navigation links work
- [x] All pages have Header
- [x] Responsive design works

## 🚀 Next Steps

After testing Phase 2, you're ready for:
- **Phase 3**: Product Catalog & Admin Basics
- Products will be searchable
- Admin can manage products
- Real-time stock updates

---

**Note**: Make sure both frontend (`npm run dev` in `app/`) and backend (`npm run dev` in `server/`) are running for full functionality!

