# Industrial Parts E-Commerce Website - Specification

## 1. Concept & Vision

一个专业级的工业零部件产品展示平台，类似于Radwell和RS Online的设计风格。网站以产品展示为核心，无交易功能，访客通过"询价"按钮联系卖家。界面采用工业风格设计——专业、简洁、信息密度高，强调产品的技术规格和品牌信息。

**核心体验**：快速检索产品 → 查看详细参数 → 一键询价

---

## 2. Design Language

### Aesthetic Direction
**工业专业风格** — 参考RS Online和Radwell的专业感，结合现代扁平化设计。使用深色导航栏、白色内容区、高对比度的产品卡片。

### Color Palette
```
Primary:        #1E40AF (Industrial Blue)
Primary Dark:   #1E3A8A
Secondary:      #64748B (Slate Gray)
Accent:         #F59E0B (Warning/Inquiry Yellow)
Background:     #F8FAFC (Light Gray)
Surface:        #FFFFFF
Text Primary:    #1E293B
Text Secondary:  #64748B
Border:         #E2E8F0
Success:        #10B981
Error:          #EF4444
```

### Typography
- **Headings**: Inter (700, 600) - 清晰专业的无衬线字体
- **Body**: Inter (400, 500) - 优秀的可读性
- **Monospace**: JetBrains Mono - 型号、规格参数
- **Fallback**: system-ui, -apple-system, sans-serif

### Spatial System
- Base unit: 4px
- Content max-width: 1280px
- Grid: 12-column with 24px gaps
- Card padding: 16px-24px
- Section spacing: 48px-64px

### Motion Philosophy
- **Subtle and professional** — 避免过度动画
- Page transitions: None (instant navigation)
- Hover states: 150ms ease-out transforms
- Loading states: Skeleton screens with pulse animation
- Modals: 200ms fade + scale

### Visual Assets
- **Icons**: Lucide React (consistent stroke width)
- **Product Images**: 1:1 aspect ratio, gray background placeholder
- **Category Icons**: 自定义SVG图标表示各工业类别
- **Decorative**: 最小化，仅使用微妙的阴影和边框

---

## 3. Layout & Structure

### Page Architecture

#### Header (Sticky)
```
[Logo] [Category Menu ▼] [Search Bar ----------------] [Lang] [Admin]
```
- Height: 64px
- Background: #1E40AF (Primary Blue)
- Category dropdown on hover
- Search bar: prominent, auto-suggest enabled

#### Footer
```
[Company Info] [Quick Links] [Categories] [Contact] [Copyright]
```
- Background: #1E293B (Dark Slate)
- 4-column layout
- Contact email and seller info

### Page Types

#### 1. Home Page
- Hero banner (optional, simple gradient)
- Featured Categories grid (8-12 categories)
- Recent Products carousel
- Why Choose Us section (if needed)

#### 2. Category Listing Page (`/category/[slug]`)
- Breadcrumb: Home > Category > Subcategory
- Filter sidebar (brand, specs if applicable)
- Product grid: 3-4 columns, responsive
- Pagination or infinite scroll
- Subcategory tabs if applicable

#### 3. Product Listing Page (`/products`)
- Search results or all products
- Sort options: newest, alphabetical
- Grid/List view toggle

#### 4. Product Detail Page (`/product/[slug]`)
```
[Breadcrumb]
[Product Images Gallery] | [Product Info]
                        | Brand: SIEMENS
                        | Model: 6AV7704-0BB10-0AD0
                        | Category: HMI Panels
                        | [Inquire Now Button]
                        |
[Specifications Table]
[Description/Details]
[Related Products]
```

#### 5. Search Results Page (`/search?q=xxx`)
- Search query displayed
- Results count
- Filtered product grid

### Responsive Strategy
- Desktop: Full layout, 4-column product grid
- Tablet: 2-3 column grid, collapsible sidebar
- Mobile: Single column, hamburger menu, full-width cards

---

## 4. Features & Interactions

### 4.1 Navigation & Search

#### Category Menu
- Top-level categories in dropdown
- Hover reveals subcategories
- Click navigates to category page

#### Search Functionality
- **Input**: Debounced (300ms), minimum 2 characters
- **Auto-suggest**: Shows matching products/categories as user types
- **Results**: Click product → detail page, click category → category page
- **Empty state**: "No results found for 'xxx'"

### 4.2 Product Display

#### Product Card
- Image (hover: slight zoom)
- Brand badge (top-left corner)
- Product name (truncated at 2 lines)
- Model number (monospace)
- "Inquire" button (yellow accent)
- Click card → product detail page

#### Product Detail Page
- **Image Gallery**: Main image + thumbnails (max 10)
- **Specifications**: Key-value table
- **Description**: HTML content, SEO-optimized
- **Inquire Button**: Opens mailto: or contact modal
- **Related Products**: 4-6 products from same category

### 4.3 Inquiry System

#### Inquiry Button Behavior
- Click opens contact modal OR redirects to mailto:
- Contact info set in admin settings
- Subject line: "Inquiry about [Product Name] - [Model Number]"

### 4.4 Admin Dashboard

#### Access
- URL: `/admin`
- Simple login (username/password from env)
- Session-based authentication

#### Dashboard Sections
1. **Dashboard Home** - Stats overview (products count, categories count)
2. **Products** - List, edit, delete products
3. **Categories** - Manage categories
4. **Bulk Upload** - Two upload methods
5. **Settings** - Contact info, site settings

### 4.5 Bulk Upload Methods

#### Method 1: Folder Structure Upload
**流程**:
1. Admin compresses category folder (e.g., `SIEMENS.zip`)
2. Upload ZIP file
3. System extracts and processes:
   ```
   SIEMENS/
   ├── 6AV7704-0BB10-0AD0/
   │   ├── photo1.jpg
   │   ├── photo2.jpg
   │   └── ...
   ├── SIMATIC-S7-1200/
   │   ├── photo1.jpg
   │   └── ...
   ```

**验证规则**:
- Category name from ZIP filename
- Subfolder name = Product name
- Max 10 images per product
- Valid image formats: jpg, png, webp
- Max image size: 5MB

**Success**: Products created with all images
**Failure**: Error report with reason:
- "Product 'xxx': Invalid image format"
- "Product 'xxx': More than 10 images"
- "Missing product name"

#### Method 2: Excel + Single Image Upload
**流程**:
1. Admin uploads Excel file (e.g., `SIEMENS.xlsx`)
2. Admin uploads single "virtual" product image
3. System reads Excel and creates products:

**Excel Format**:
|序号|产品名称|型号|品牌|规格参数|描述|
|---|---|---|---|---|---|
|1|HMI Panel|6AV7704-0BB10-0AD0|SIEMENS|7" TFT|Industrial touchscreen|

**Validation**:
- Excel must have headers
- "产品名称" and "型号" required
- Others optional

**Error Report**:
- "Row 3: Missing model number"
- "Row 7: Invalid specification format"

### 4.6 Product SEO & Auto-Fetch

#### SEO Fields (editable per product)
- Meta Title (auto-generated from name if empty)
- Meta Description (auto-generated from description if empty)
- SEO Slug (auto-generated from name if empty)

#### Auto-Fetch Feature (Token-based)
- Admin can set template with tokens like `{{name}}`, `{{model}}`
- Or use "Auto-fetch" button per product
- System searches web for product info based on model number
- Populates: specifications, description
- **Note**: Auto-fetch is best-effort, may not find all products

---

## 5. Component Inventory

### Navigation Components

#### Header
- **Default**: Blue background, white text
- **Scrolled**: Same (sticky, no change)
- **Mobile**: Hamburger menu icon, slide-out drawer

#### CategoryDropdown
- **Closed**: Just button visible
- **Open**: Overlay with category list
- **Hover on item**: Subcategories appear on right

#### SearchBar
- **Empty**: Placeholder "Search products..."
- **Typing**: Auto-suggest dropdown appears
- **No results**: "No matches found"
- **Loading**: Spinner in input

### Product Components

#### ProductCard
- **Default**: White background, subtle shadow
- **Hover**: Elevated shadow, image zoom 1.02
- **Loading**: Skeleton with pulse animation

#### ProductGallery
- **Main image**: 400x400 display area
- **Thumbnails**: Horizontal scroll below
- **Single image**: No thumbnails shown
- **Lightbox**: Click to enlarge

#### ProductSpecTable
- **Layout**: Two-column (label: value)
- **Alternating rows**: Subtle gray background

### Form Components

#### Button
- **Primary**: Blue background, white text
- **Secondary**: Gray outline
- **Accent**: Yellow background (Inquire button)
- **Disabled**: Grayed out, cursor not-allowed
- **Loading**: Spinner replaces text

#### Input / TextArea
- **Default**: Border with rounded corners
- **Focus**: Blue border, subtle shadow
- **Error**: Red border, error message below
- **Disabled**: Gray background

#### FileUpload
- **Default**: Dashed border drop zone
- **Dragover**: Blue border, blue background tint
- **Uploading**: Progress bar
- **Success**: Green checkmark
- **Error**: Red border, error message

### Admin Components

#### AdminSidebar
- Fixed left sidebar
- Active item highlighted
- Collapsible on tablet

#### BulkUploadTabs
- Tab 1: Folder Upload
- Tab 2: Excel Upload
- Active tab: Blue underline

#### UploadProgress
- Overall progress bar
- Per-file status list
- Expandable error details

---

## 6. Technical Approach

### Stack
- **Framework**: Next.js 14 (App Router) - SSR for SEO
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM (easy deployment)
- **File Storage**: Local filesystem (./public/uploads)
- **Excel Parsing**: xlsx library
- **Admin Auth**: NextAuth.js or simple session

### Project Structure
```
/app
  /page.tsx                 # Home page
  /category/[slug]/page.tsx # Category listing
  /product/[slug]/page.tsx  # Product detail
  /search/page.tsx          # Search results
  /admin
    /page.tsx               # Dashboard
    /products/page.tsx      # Product management
    /categories/page.tsx    # Category management
    /upload/page.tsx        # Bulk upload
    /settings/page.tsx      # Site settings
  /api
    /products/route.ts      # Product CRUD
    /categories/route.ts    # Category CRUD
    /upload/route.ts        # File upload handling
    /search/route.ts        # Search API
/components
  /ui                       # Reusable UI components
  /layout                   # Layout components
  /product                  # Product-specific components
/lib
  /db.ts                    # Database client
  /prisma.ts                # Prisma client
  /upload.ts                # Upload utilities
  /excel.ts                 # Excel parsing
/prisma
  /schema.prisma            # Database schema
/public
  /uploads                  # Uploaded files
```

### Database Schema

```prisma
model Category {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String?
  image       String?
  parentId    String?
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Product {
  id             String      @id @default(cuid())
  name           String
  slug           String      @unique
  model          String?
  brand          String?
  description    String?     @db.Text
  specifications Json?       # Structured key-value pairs
  images         Json        # Array of image URLs
  categoryId     String
  category       Category    @relation(fields: [categoryId], references: [id])
  metaTitle      String?
  metaDescription String?
  featured       Boolean     @default(false)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
}

model SiteSettings {
  id              String  @id @default(cuid())
  key             String  @unique
  value           String
}
```

### API Design

#### Products
- `GET /api/products` - List products (with pagination, filters)
- `GET /api/products/[slug]` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

#### Categories
- `GET /api/categories` - List all categories (tree structure)
- `GET /api/categories/[slug]` - Get category with products
- `POST /api/categories` - Create category
- `PUT /api/categories/[id]` - Update category

#### Upload
- `POST /api/upload/folder` - Folder/ZIP upload
- `POST /api/upload/excel` - Excel + image upload
- `GET /api/upload/status/[jobId]` - Check upload job status

#### Search
- `GET /api/search?q=xxx` - Search products

### Deployment

#### Option 1: Vercel (Recommended)
- Connect GitHub repo
- Auto-deploy on push
- SQLite works with read replica

#### Option 2: Traditional Server
- Node.js server
- PM2 for process management
- Nginx for static files and proxy
- SQLite database file

#### Environment Variables
```
DATABASE_URL="file:./dev.db"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="secure_password"
SITE_NAME="Industrial Parts Co."
SELLER_EMAIL="sales@example.com"
SELLER_PHONE="+65 XXXX XXXX"
```

---

## 7. Implementation Notes

### SEO Optimization
- Server-side rendering for all public pages
- Dynamic meta tags per product
- Semantic HTML structure
- Structured data (JSON-LD) for products
- Sitemap generation
- robots.txt

### Image Handling
- Resize large images on upload (max 1200px)
- Generate thumbnails (300px)
- WebP conversion if supported
- Lazy loading for gallery images

### Performance
- Static generation for category pages where possible
- ISR for product pages (revalidate every hour)
- Image optimization with next/image
- Database indexes on frequently queried fields

### Error Handling
- Upload errors captured and reported
- Invalid product data skipped with reason
- Failed images logged but don't block other products
- User-friendly error messages in admin
