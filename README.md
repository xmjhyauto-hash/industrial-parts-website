# Industrial Parts E-Commerce Website

A professional industrial automation components display platform with bulk upload functionality.

## Features

- **Product Display**: Showcase industrial automation products with images, specs, and descriptions
- **Category Navigation**: Hierarchical category structure with search
- **Inquiry System**: Price-by-inquiry model with customizable seller contact
- **Admin Dashboard**: Manage products, categories, and site settings
- **Bulk Upload**:
  - Method 1: Folder-based upload (ZIP with product folders)
  - Method 2: Excel spreadsheet with virtual image

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **File Storage**: Local filesystem

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Initialize the database:
```bash
npm run db:push
npm run db:seed
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Default Credentials

- **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Username**: admin
- **Password**: admin123

## Bulk Upload Guide

### Method 1: Folder Upload

Upload a ZIP file with the following structure:
```
CategoryName.zip
├── ProductName1/
│   ├── photo1.jpg
│   ├── photo2.jpg
│   └── ...
├── ProductName2/
│   ├── photo1.jpg
│   └── ...
```

- ZIP filename becomes the category name
- Subfolder names become product names
- Each product supports 1-10 images (JPG, PNG, WEBP)

### Method 2: Excel Upload

Upload an Excel file with columns:
| 序号 | 产品名称 | 型号 | 品牌 | 规格参数 | 描述 |

All products will use the same virtual image you upload.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables:
   - `DATABASE_URL`: `file:./dev.db`
   - `NEXTAUTH_SECRET`: Your secret key
   - `ADMIN_USERNAME`: admin
   - `ADMIN_PASSWORD`: Your password

### Docker

```bash
docker-compose up -d
```

### Manual Server

1. Build: `npm run build`
2. Start: `npm start`

## SEO

The site is optimized for search engines with:
- Server-side rendering
- Dynamic meta tags per product
- Semantic HTML structure
- Sitemap generation ready

## License

MIT
