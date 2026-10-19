import mongoose, { Document, Schema } from 'mongoose';

export interface ITag extends Document {
  name: string;
  slug: string;
  description?: string;
  color?: string; // Hex color code for UI display
  isActive: boolean;
  usageCount: number; // Number of products using this tag (for analytics)
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      trim: true,
      unique: true,
      maxlength: [50, 'Tag name cannot exceed 50 characters'],
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Tag slug is required'],
      trim: true,
      unique: true,
      lowercase: true,
      index: true,
      validate: {
        validator: function (v: string) {
          if (!v) return false; // Required field
          return /^[a-z0-9\-]+$/.test(v);
        },
        message: 'Slug must contain only lowercase letters, numbers, and hyphens',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    color: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string | undefined) {
          if (!v) return true; // Optional field
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: 'Color must be a valid hex color code (e.g., #FF5733 or #F53)',
      },
      default: '#6366f1', // Default indigo color
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug from name if not provided (runs before validation)
TagSchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Indexes
TagSchema.index({ slug: 1, isActive: 1 }); // Compound index for filtering
TagSchema.index({ usageCount: -1 }); // For analytics/sorting

export const Tag = mongoose.model<ITag>('Tag', TagSchema);

