'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Send, User, ThumbsUp, ThumbsDown, CheckCircle2, ImageIcon, X, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LoginModal } from '@/components/auth/LoginModal';
import { uploadApi } from '@/lib/api/upload';

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

interface ReviewPhoto {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
}

interface Review {
  _id: string;
  userId: string;
  userName?: string;
  rating: number;
  comment: string;
  photos?: ReviewPhoto[];
  verifiedPurchase: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  userVote?: boolean;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  adminReply?: {
    comment: string;
    repliedBy: string;
    repliedAt: string;
  };
  createdAt: string;
}

interface ReviewsEnhancedProps {
  productId: string;
}

export const ReviewsEnhanced: React.FC<ReviewsEnhancedProps> = ({ productId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest' | 'most_helpful'>('newest');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { isAuthenticated, isCustomer, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [productId, sortBy, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getReviews(productId, page, 10, sortBy);
      if (response.success) {
        setReviews(response.data);
        setTotalPages(response.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reviews',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 5) {
      toast({
        title: 'Too many photos',
        description: 'Maximum 5 photos allowed per review',
        variant: 'destructive',
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file',
          description: 'Only images are supported',
          variant: 'destructive',
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum file size is 5MB',
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    setPhotos([...photos, ...validFiles]);

    // Create preview URLs
    const urls = validFiles.map((file) => URL.createObjectURL(file));
    setPhotoUrls([...photoUrls, ...urls]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    URL.revokeObjectURL(photoUrls[index]);
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // Staff (admin/superadmin) are dashboard-only and cannot post reviews.
    if (!isCustomer) {
      toast({
        title: 'Customers only',
        description: 'Reviews can only be posted from customer accounts.',
        variant: 'destructive',
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a rating',
        variant: 'destructive',
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: 'Comment required',
        description: 'Please write a review comment',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Upload photos first
      const uploadedPhotos: ReviewPhoto[] = [];
      for (const photo of photos) {
        const formData = new FormData();
        formData.append('image', photo);
        
        const uploadResponse = await uploadApi.uploadFile(formData, 'review');
        if (uploadResponse.success && uploadResponse.url) {
          uploadedPhotos.push({
            url: uploadResponse.url,
            type: 'image',
          });
        }
      }

      const response = await productsApi.submitReview(productId, {
        rating,
        comment: comment.trim(),
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
      });

      if (response.success) {
        toast({
          title: 'Review submitted',
          description: response.message || 'Thank you for your review!',
        });
        setRating(0);
        setComment('');
        setPhotos([]);
        photoUrls.forEach((url) => URL.revokeObjectURL(url));
        setPhotoUrls([]);
        fetchReviews();
      }
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to submit review',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteHelpful = async (reviewId: string, isHelpful: boolean) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    try {
      const response = await productsApi.voteReviewHelpful(productId, reviewId, isHelpful);
      if (response.success) {
        // Update local state
        setReviews((prev) =>
          prev.map((review) =>
            review._id === reviewId
              ? {
                  ...review,
                  helpfulCount: response.data.helpfulCount,
                  notHelpfulCount: response.data.notHelpfulCount,
                  userVote: response.data.userVote,
                }
              : review
          )
        );
      }
    } catch (error: any) {
      console.error('Failed to vote:', error);
      toast({
        title: 'Error',
        description: 'Failed to record your vote',
        variant: 'destructive',
      });
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="highest">Highest Rated</SelectItem>
            <SelectItem value="lowest">Lowest Rated</SelectItem>
            <SelectItem value="most_helpful">Most Helpful</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Review Form */}
      {isAuthenticated && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
            <CardDescription>Share your experience with this product</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Rating</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="comment">Your Review</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  rows={4}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="photos">Photos (Optional, Max 5)</Label>
                <div className="mt-2 space-y-2">
                  <input
                    id="photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <label htmlFor="photos">
                    <Button type="button" variant="outline" asChild>
                      <span>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Add Photos
                      </span>
                    </Button>
                  </label>
                  {photoUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {photoUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={url}
                            alt={`Preview ${index + 1}`}
                            width={100}
                            height={100}
                            className="rounded-md object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            aria-label="Remove photo"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button type="submit" disabled={submitting}>
                <Send className="mr-2 h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No reviews yet. Be the first to review this product!
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review._id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{review.userName || 'Anonymous'}</span>
                      {review.verifiedPurchase && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified Purchase
                        </Badge>
                      )}
                      {review.moderationStatus === 'pending' && (
                        <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-600">
                          <Clock className="h-3 w-3" />
                          Pending Review
                        </Badge>
                      )}
                      {review.moderationStatus === 'rejected' && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Rejected
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 mb-4">{review.comment}</p>
                  
                  {/* Review Photos */}
                  {review.photos && review.photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {review.photos.map((photo, index) => (
                        <div key={index} className="relative w-24 h-24 rounded-md overflow-hidden">
                          <Image
                            src={photo.url}
                            alt={`Review photo ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Admin Reply */}
                  {review.adminReply && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                          Admin Response
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(review.adminReply.repliedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {review.adminReply.comment}
                      </p>
                    </div>
                  )}

                  {/* Helpful Votes */}
                  <div className="flex items-center gap-4 mt-4">
                    <span className="text-sm text-muted-foreground">Helpful?</span>
                    <Button
                      variant={review.userVote === true ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleVoteHelpful(review._id, true)}
                      className="gap-2"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {review.helpfulCount}
                    </Button>
                    <Button
                      variant={review.userVote === false ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleVoteHelpful(review._id, false)}
                      className="gap-2"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      {review.notHelpfulCount}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        title="Login to Write a Review"
        description="You need to be logged in to submit a product review."
      />
    </div>
  );
};

