'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { productsApi, ProductFilters } from '@/lib/api/products';
import type { IProduct } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Star, CheckCircle2, XCircle, Clock, Eye, MessageSquare, Reply, EyeOff, Flag, Trash2, ArrowLeft, Search, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/DataTable';
import { RowActions } from '@/components/admin/RowActions';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

interface Review {
  _id: string;
  userId: string;
  userName?: string;
  rating: number;
  comment: string;
  photos?: Array<{ url: string; type: 'image' | 'video'; thumbnailUrl?: string }>;
  verifiedPurchase: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  moderationNotes?: string;
  adminReply?: {
    comment: string;
    repliedBy: string;
    repliedAt: string;
  };
  isHidden?: boolean;
  isFlagged?: boolean;
  createdAt: string;
}

const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function AdminReviewsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading reviews…</div>}>
      <AdminReviewsContent />
    </Suspense>
  );
}

function AdminReviewsContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  
  // Dialog states
  const [replyDialog, setReplyDialog] = useState<{
    open: boolean;
    review: Review | null;
    reply: string;
  }>({
    open: false,
    review: null,
    reply: '',
  });
  
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    review: Review | null;
  }>({
    open: false,
    review: null,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const filters: ProductFilters = {
        page: 1,
        limit: 100, // Get products for the table
        search: searchQuery || undefined,
      };
      const response = await productsApi.getProducts(filters);
      
      // Show all products - we'll check for reviews when user clicks on a product
      // This ensures we show products even if totalReviews field is not populated
      setProducts(response.data);
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProductReviews = async (productId: string) => {
    setReviewsLoading(true);
    try {
      const response = await productsApi.getReviewsWithStatus(productId, 'all', 1, 100);
      setReviews(response.data);
    } catch (error: any) {
      console.error('Failed to fetch reviews:', error);
      const errorMessage = error.message || error.response?.data?.error || 'Failed to load reviews';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleProductClick = (product: IProduct) => {
    setSelectedProduct(product);
    fetchProductReviews(product._id);
  };

  const handleReply = async () => {
    if (!replyDialog.review || !selectedProduct || !replyDialog.reply.trim()) return;

    try {
      await productsApi.replyToReview(
        selectedProduct._id,
        replyDialog.review._id,
        replyDialog.reply
      );

      toast({
        title: 'Success',
        description: 'Reply added successfully',
      });

      setReplyDialog({ open: false, review: null, reply: '' });
      fetchProductReviews(selectedProduct._id);
    } catch (error: any) {
      console.error('Failed to reply to review:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add reply',
        variant: 'destructive',
      });
    }
  };

  const handleToggleHide = async (review: Review, hide: boolean) => {
    if (!selectedProduct) return;

    try {
      await productsApi.toggleReviewVisibility(selectedProduct._id, review._id, hide);
      toast({
        title: 'Success',
        description: `Review ${hide ? 'hidden' : 'unhidden'} successfully`,
      });
      fetchProductReviews(selectedProduct._id);
    } catch (error: any) {
      console.error('Failed to toggle visibility:', error);
      toast({
        title: 'Error',
        description: 'Failed to update review visibility',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFlag = async (review: Review, flag: boolean) => {
    if (!selectedProduct) return;

    try {
      await productsApi.toggleReviewFlag(selectedProduct._id, review._id, flag);
      toast({
        title: 'Success',
        description: `Review ${flag ? 'flagged' : 'unflagged'} successfully`,
      });
      fetchProductReviews(selectedProduct._id);
    } catch (error: any) {
      console.error('Failed to toggle flag:', error);
      toast({
        title: 'Error',
        description: 'Failed to update review flag',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.review || !selectedProduct) return;

    try {
      await productsApi.deleteReview(selectedProduct._id, deleteDialog.review._id);
      toast({
        title: 'Success',
        description: 'Review deleted successfully',
      });
      setDeleteDialog({ open: false, review: null });
      fetchProductReviews(selectedProduct._id);
    } catch (error: any) {
      console.error('Failed to delete review:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete review',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (review: Review) => {
    if (review.isFlagged) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Flag className="h-3 w-3" />
          Flagged
        </Badge>
      );
    }
    if (review.isHidden) {
      return (
        <Badge variant="outline" className="gap-1 text-gray-600">
          <EyeOff className="h-3 w-3" />
          Hidden
        </Badge>
      );
    }
    switch (review.moderationStatus) {
      case 'approved':
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-600">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  if (selectedProduct) {
    return (
      <div className="container mx-auto px-3 py-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setSelectedProduct(null)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{selectedProduct.name}</h1>
              <p className="text-muted-foreground mt-1">
                Manage reviews for this product
              </p>
            </div>
          </div>
          <Link href={`/products/${selectedProduct.slug}`}>
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              View Product
            </Button>
          </Link>
        </div>

        {reviewsLoading ? (
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
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
              <p className="text-muted-foreground">
                This product doesn't have any reviews yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card 
                key={review._id}
                className={review.isHidden ? 'border-gray-300 bg-gray-50 dark:bg-gray-900 opacity-75' : ''}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getStatusBadge(review)}
                        {review.isHidden && (
                          <Badge variant="outline" className="gap-1 text-gray-600 border-gray-400 bg-gray-100 dark:bg-gray-800">
                            <EyeOff className="h-3 w-3" />
                            Hidden from public view
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="font-medium">{review.userName || 'Anonymous'}</span>
                        {review.verifiedPurchase && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified Purchase
                          </Badge>
                        )}
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
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
                        <span className="text-sm text-muted-foreground ml-2">
                          ({review.helpfulCount} helpful, {review.notHelpfulCount} not helpful)
                        </span>
                      </div>
                      <p className="text-sm mb-3 whitespace-pre-wrap">{review.comment}</p>

                      {/* Review Photos */}
                      {review.photos && review.photos.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {review.photos.map((photo, index) => (
                            <div
                              key={index}
                              className="relative w-24 h-24 rounded-md overflow-hidden border"
                            >
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
                              Admin Reply
                            </span>
                            {review.adminReply.repliedAt && (
                              <span className="text-xs text-muted-foreground">
                                {formatDate(review.adminReply.repliedAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            {review.adminReply.comment}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReplyDialog({ open: true, review, reply: review.adminReply?.comment || '' })}
                        className="gap-2 w-full"
                      >
                        <Reply className="h-4 w-4" />
                        {review.adminReply ? 'Edit Reply' : 'Reply'}
                      </Button>
                      {review.isHidden ? (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleToggleHide(review, false)}
                          className="gap-2 w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Eye className="h-4 w-4" />
                          Unhide Review
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleHide(review, true)}
                          className="gap-2 w-full"
                        >
                          <EyeOff className="h-4 w-4" />
                          Hide Review
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleFlag(review, !review.isFlagged)}
                        className="gap-2 w-full"
                      >
                        <Flag className="h-4 w-4" />
                        {review.isFlagged ? 'Unflag' : 'Flag as Inappropriate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteDialog({ open: true, review })}
                        className="gap-2 w-full"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reply Dialog */}
        <Dialog open={replyDialog.open} onOpenChange={(open) => {
          if (!open) setReplyDialog({ open: false, review: null, reply: '' });
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reply to Review</DialogTitle>
              <DialogDescription>
                Write a response to this customer review
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="reply">Your Reply</Label>
                <Textarea
                  id="reply"
                  placeholder="Write your reply here..."
                  value={replyDialog.reply}
                  onChange={(e) => setReplyDialog({ ...replyDialog, reply: e.target.value })}
                  rows={6}
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReplyDialog({ open: false, review: null, reply: '' })}
              >
                Cancel
              </Button>
              <Button onClick={handleReply} disabled={!replyDialog.reply.trim()}>
                {replyDialog.review?.adminReply ? 'Update Reply' : 'Post Reply'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => {
          if (!open) setDeleteDialog({ open: false, review: null });
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Review</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this review? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 py-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Review Management</h1>
          <p className="text-muted-foreground mt-1">
            Select a product to manage its reviews
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchProducts();
                }
              }}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={fetchProducts}>Search</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try a different search term' : 'No products available'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Products ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminTable>
              <AdminTableHeader>
                <AdminTableRow>
                  <AdminTableHead>Product Name</AdminTableHead>
                  <AdminTableHead>SKU</AdminTableHead>
                  <AdminTableHead>Price</AdminTableHead>
                  <AdminTableHead>Status</AdminTableHead>
                  <AdminTableHead>Reviews</AdminTableHead>
                  <AdminTableHead>Rating</AdminTableHead>
                  <AdminTableHead className="text-right">Actions</AdminTableHead>
                </AdminTableRow>
              </AdminTableHeader>
              <AdminTableBody>
                {products.map((product) => (
                  <AdminTableRow
                    key={product._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleProductClick(product)}
                  >
                    <AdminTableCell className="font-medium truncate max-w-[220px]">{product.name}</AdminTableCell>
                    <AdminTableCell className="font-mono text-xs">{product.sku}</AdminTableCell>
                    <AdminTableCell className="whitespace-nowrap">${product.price.toFixed(2)}</AdminTableCell>
                    <AdminTableCell>
                      <Badge variant={
                        product.status === 'active' ? 'default' :
                        product.status === 'draft' ? 'secondary' :
                        'outline'
                      } className="text-[11px]">
                        {product.status}
                      </Badge>
                    </AdminTableCell>
                    <AdminTableCell className="whitespace-nowrap">
                      {product.totalReviews || 0} review{(product.totalReviews || 0) !== 1 ? 's' : ''}
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{product.averageRating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell className="text-right">
                      <RowActions
                        label={`Actions for ${product.name}`}
                        items={[
                          {
                            label: 'View Reviews',
                            icon: <Eye className="h-3.5 w-3.5 mr-2" />,
                            onSelect: () => handleProductClick(product),
                          },
                        ]}
                      />
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTableBody>
            </AdminTable>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
