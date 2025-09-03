# QR Code API Documentation

## Overview
The QR Code API provides scalable and optimized endpoints for generating, managing, and redeeming QR codes. The system is designed to handle thousands of QR codes efficiently with batch operations and proper indexing.

## Base URL
```
http://localhost:3000/api/qrcodes
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Endpoints

### 1. Generate Bulk QR Codes
**POST** `/generate`

Generate multiple unique QR codes in a single request (up to 10,000).

**Access:** Admin and Manufacturer only

**Request Body:**
```json
{
  "quantity": 1000,
  "length": 12,
  "metadata": {
    "product": "Sample Product",
    "category": "Electronics"
  }
}
```

**Parameters:**
- `quantity` (required): Number of QR codes to generate (1-10,000)
- `length` (optional): Length of each QR code (8-20 characters, default: 12)
- `metadata` (optional): Additional data to store with QR codes

**Response:**
```json
{
  "message": "1000 QR codes generated successfully",
  "batchId": "batch_abc123_def456",
  "quantity": 1000,
  "codes": ["a1b2c3d4e5f6", "b2c3d4e5f6g7", ...],
  "metadata": {
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "generatedBy": "admin@example.com",
    "batchId": "batch_abc123_def456"
  }
}
```

### 2. Get QR Codes
**GET** `/`

Retrieve QR codes with pagination and filtering.

**Access:** Admin and Manufacturer (manufacturers can only see their own)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `status` (optional): Filter by status (`unredeemed` or `redeemed`)
- `batchId` (optional): Filter by batch ID
- `search` (optional): Search in code or batch ID
- `generatedBy` (optional): Filter by generator user ID

**Response:**
```json
{
  "qrCodes": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "code": "a1b2c3d4e5f6",
      "status": "unredeemed",
      "batchId": "batch_abc123_def456",
      "quantity": 1000,
      "batchNumber": 1,
      "generatedBy": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "email": "admin@example.com",
        "firstName": "John",
        "lastName": "Admin"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalQRCodes": 250,
    "qrCodesPerPage": 50
  }
}
```

### 3. Get QR Code by ID
**GET** `/:id`

Retrieve a specific QR code by its ID.

**Access:** Admin and Manufacturer (manufacturers can only see their own)

**Response:**
```json
{
  "qrCode": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "code": "a1b2c3d4e5f6",
    "status": "unredeemed",
    "batchId": "batch_abc123_def456",
    "quantity": 1000,
    "batchNumber": 1,
    "generatedBy": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "email": "admin@example.com",
      "firstName": "John",
      "lastName": "Admin"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Get QR Code Statistics
**GET** `/stats`

Get comprehensive statistics about QR codes.

**Access:** Admin and Manufacturer (manufacturers can only see their own)

**Response:**
```json
{
  "totalQRCodes": 2500,
  "unredeemedCount": 1800,
  "redeemedCount": 700,
  "byStatus": [
    {
      "_id": "unredeemed",
      "count": 1800
    },
    {
      "_id": "redeemed",
      "count": 700
    }
  ],
  "recentBatches": [
    {
      "_id": "batch_abc123_def456",
      "count": 1000,
      "quantity": 1000,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 5. Delete Single QR Code
**DELETE** `/:id`

Delete a specific QR code.

**Access:** Admin and Manufacturer (manufacturers can only delete their own)

**Response:**
```json
{
  "message": "QR code deleted successfully",
  "deletedQRCode": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "code": "a1b2c3d4e5f6",
    "batchId": "batch_abc123_def456"
  }
}
```

### 6. Bulk Delete QR Codes
**DELETE** `/`

Delete multiple QR codes by IDs or entire batch.

**Access:** Admin and Manufacturer (manufacturers can only delete their own)

**Request Body (Option 1 - Delete by IDs):**
```json
{
  "qrCodeIds": [
    "64f8a1b2c3d4e5f6a7b8c9d0",
    "64f8a1b2c3d4e5f6a7b8c9d1"
  ]
}
```

**Request Body (Option 2 - Delete by Batch):**
```json
{
  "batchId": "batch_abc123_def456"
}
```

**Response:**
```json
{
  "message": "2 QR code(s) deleted successfully",
  "deletedCount": 2,
  "deletedQRCodes": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "code": "a1b2c3d4e5f6",
      "batchId": "batch_abc123_def456"
    }
  ]
}
```

### 7. Redeem QR Code
**POST** `/redeem`

Mark a QR code as redeemed.

**Access:** Any authenticated user

**Request Body:**
```json
{
  "code": "a1b2c3d4e5f6"
}
```

**Response:**
```json
{
  "message": "QR code redeemed successfully",
  "qrCode": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "code": "a1b2c3d4e5f6",
    "batchId": "batch_abc123_def456",
    "redeemedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

## cURL Examples

### Generate 1000 QR Codes
```bash
curl -X POST \
  http://localhost:3000/api/qrcodes/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 1000,
    "length": 12,
    "metadata": {
      "product": "Sample Product",
      "category": "Electronics"
    }
  }'
```

### Get QR Codes with Filtering
```bash
curl -X GET \
  "http://localhost:3000/api/qrcodes?status=unredeemed&page=1&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Bulk Delete by Batch
```bash
curl -X DELETE \
  http://localhost:3000/api/qrcodes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "batch_abc123_def456"
  }'
```

### Redeem QR Code
```bash
curl -X POST \
  http://localhost:3000/api/qrcodes/redeem \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "a1b2c3d4e5f6"
  }'
```

## Performance Features

### Database Optimization
- **Indexes**: Compound indexes on common query patterns
- **Bulk Operations**: Efficient bulk insertion and deletion
- **Pagination**: Configurable page sizes for large datasets
- **Lean Queries**: Reduced memory usage for read operations

### Scalability
- **Batch Processing**: Process QR codes in batches of 100
- **Unique Generation**: Collision-resistant unique code generation
- **Batch Grouping**: Logical grouping for easier management
- **Memory Efficient**: Streaming operations for large datasets

### Security
- **Role-based Access**: Different permissions for admin/manufacturer/users
- **Data Isolation**: Manufacturers can only access their own QR codes
- **Input Validation**: Comprehensive validation for all inputs
- **Rate Limiting**: Built-in protection against abuse

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "message": "Quantity must be between 1 and 10,000"
}
```

**401 Unauthorized:**
```json
{
  "message": "Access denied. No token provided."
}
```

**403 Forbidden:**
```json
{
  "message": "Access denied. Insufficient permissions."
}
```

**404 Not Found:**
```json
{
  "message": "QR code not found."
}
```

**500 Internal Server Error:**
```json
{
  "message": "Server error",
  "error": "Error details"
}
```

## Best Practices

1. **Batch Generation**: Generate QR codes in batches rather than one by one
2. **Pagination**: Use pagination for large datasets to improve performance
3. **Batch Management**: Use batch IDs to group related QR codes
4. **Metadata**: Store relevant information in metadata for better organization
5. **Monitoring**: Use statistics endpoint to monitor QR code usage
6. **Cleanup**: Regularly delete unused or expired QR codes

## Rate Limits

- **Generation**: Maximum 10,000 QR codes per request
- **Bulk Operations**: Maximum 1,000 items per bulk operation
- **API Calls**: Recommended maximum 100 requests per minute per user
