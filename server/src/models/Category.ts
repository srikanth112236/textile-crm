import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  parent?: mongoose.Types.ObjectId | ICategory;
  image?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
        },
        message: 'Slug must be a valid URL-friendly string (e.g., "electronics", "electronics-mobile")',
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    image: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CategorySchema.index({ slug: 1 });
CategorySchema.index({ parent: 1 });
CategorySchema.index({ status: 1 });
CategorySchema.index({ name: 'text', description: 'text' }); // Text search index

// Prevent circular parent references
CategorySchema.pre('save', async function (next) {
  if (this.isModified('parent') && this.parent) {
    if (this.parent.toString() === this._id.toString()) {
      return next(new Error('Category cannot be its own parent'));
    }
    
    // Check for circular references (max depth check)
    const Category = mongoose.model<ICategory>('Category');
    let currentParent: mongoose.Types.ObjectId | null = this.parent as mongoose.Types.ObjectId;
    let depth = 0;
    const maxDepth = 10;
    
    while (currentParent && depth < maxDepth) {
      if (currentParent.toString() === this._id.toString()) {
        return next(new Error('Circular parent reference detected'));
      }
      const parentCat = await Category.findById(currentParent);
      if (!parentCat || !parentCat.parent) {
        break;
      }
      currentParent = parentCat.parent as mongoose.Types.ObjectId;
      depth++;
    }
    
    if (depth >= maxDepth) {
      return next(new Error('Category hierarchy too deep'));
    }
  }
  next();
});

export const Category = mongoose.model<ICategory>('Category', CategorySchema);

