# API Documentation

## Overview

This document describes the REST API endpoints available in the Claudiao system.

## Authentication

All API routes (except `/api/auth/*`) require authentication via NextAuth session.

### Authentication Flow

1. POST `/api/auth/signin` - Login
2. GET `/api/auth/session` - Get current session
3. POST `/api/auth/signout` - Logout

## Permissions

Users must have specific permissions to access certain endpoints:

- `VIEW_PRODUCTS` - View products
- `MANAGE_PRODUCTS` - Create, update, delete products
- `VIEW_INVENTORY` - View inventory
- `MANAGE_INVENTORY` - Manage inventory levels
- `CREATE_SALES` - Create new sales
- `VIEW_OWN_SALES` - View own sales
- `VIEW_ALL_SALES` - View all sales
- `VIEW_ORDERS` - View orders
- `MANAGE_ORDERS` - Manage orders
- `VIEW_REPORTS` - View reports
- `VIEW_SETTINGS` - View settings
- `MANAGE_SETTINGS` - Manage settings

## Endpoints

### Products

#### GET `/api/products`
Get all products with optional filters.

**Query Parameters:**
- `search` - Search by name or SKU
- `category` - Filter by category
- `active` - Filter by active status

**Response:**
```json
{
  "products": [
    {
      "id": "string",
      "name": "string",
      "sku": "string",
      "price": number,
      "category": "string",
      "active": boolean
    }
  ]
}
```

#### POST `/api/products`
Create a new product.

**Required Permission:** `MANAGE_PRODUCTS`

**Body:**
```json
{
  "name": "string",
  "sku": "string",
  "price": number,
  "category": "string"
}
```

### Inventory

#### GET `/api/inventory`
Get inventory levels for all products.

**Required Permission:** `VIEW_INVENTORY`

#### POST `/api/inventory/import`
Import inventory from Excel file.

**Required Permission:** `MANAGE_INVENTORY`

**Body:** `multipart/form-data` with `file` field

#### GET `/api/inventory/import`
Download Excel template for inventory import.

### Sales

#### GET `/api/sales`
Get sales with pagination and filters.

**Required Permission:** `VIEW_OWN_SALES` or `VIEW_ALL_SALES`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `startDate` - Filter by start date
- `endDate` - Filter by end date

#### POST `/api/sales`
Create a new sale.

**Required Permission:** `CREATE_SALES`

**Body:**
```json
{
  "items": [
    {
      "productId": "string",
      "quantity": number,
      "price": number
    }
  ],
  "total": number,
  "paymentMethod": "string"
}
```

#### GET `/api/sales/export/xlsx`
Export sales to Excel file.

**Required Permission:** `VIEW_REPORTS`

#### GET `/api/sales/export/csv`
Export sales to CSV file.

**Required Permission:** `VIEW_REPORTS`

### Orders

#### GET `/api/orders`
Get all orders with filters.

**Required Permission:** `VIEW_ORDERS`

**Query Parameters:**
- `status` - Filter by status (pending, processing, completed, cancelled)
- `priority` - Filter by priority (low, medium, high, urgent)

#### POST `/api/orders`
Create a new order.

**Required Permission:** `MANAGE_ORDERS`

### Reports

#### GET `/api/reports/daily`
Get daily sales report.

**Required Permission:** `VIEW_REPORTS`

**Query Parameters:**
- `date` - Report date (ISO format)

#### GET `/api/reports/[id]/csv`
Export specific report to CSV.

**Required Permission:** `VIEW_REPORTS`

### Users

#### GET `/api/users`
Get all users (Admin only).

**Required Permission:** Admin access

#### PUT `/api/users/[id]`
Update user permissions (Admin only).

**Required Permission:** Admin access

**Body:**
```json
{
  "permissions": ["string"],
  "isAdmin": boolean
}
```

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": []
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

Currently no rate limiting is implemented. This should be added in production.

## Versioning

API is currently unversioned. Future versions will use URL versioning (e.g., `/api/v2/products`).
