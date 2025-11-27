# API Reference

Complete API documentation for DoodlePad backend.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

---

## Authentication Endpoints

### Verify Token

Verify Firebase authentication token and get/create user.

**Endpoint:** `POST /api/auth/verify`

**Headers:** None required

**Request Body:**
```json
{
  "token": "firebase_id_token"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "uid": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://...",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
}
```

---

## Resource Endpoints

### Save Resource

Save a new resource (lesson, worksheet, etc.).

**Endpoint:** `POST /api/resources`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "resource_type": "lesson",
  "title": "Introduction to Photosynthesis",
  "content": {
    "title": "Introduction to Photosynthesis",
    "subtitle": "Learn how plants make food",
    "introduction": { ... },
    "key_concepts": [ ... ],
    ...
  },
  "images": {
    "introduction": "https://...",
    ...
  },
  "topic": "Photosynthesis",
  "version": 1
}
```

**Valid Resource Types:**
- `lesson`
- `worksheet`
- `presentation`
- `curriculum`
- `flashcard`
- `quiz`

**Response:**
```json
{
  "success": true,
  "resource_id": "resource123",
  "message": "Resource saved successfully"
}
```

### Get Resource

Get a specific resource by ID.

**Endpoint:** `GET /api/resources/:resourceId`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "resource": {
    "id": "resource123",
    "user_id": "user123",
    "resource_type": "lesson",
    "title": "Introduction to Photosynthesis",
    "content": { ... },
    "images": { ... },
    "assigned_students": ["student1", "student2"],
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
}
```

### Update Resource

Update an existing resource.

**Endpoint:** `PUT /api/resources/:resourceId`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": { ... },
  "images": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Resource updated successfully"
}
```

### Delete Resource

Delete a resource.

**Endpoint:** `DELETE /api/resources/:resourceId`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Resource deleted successfully"
}
```

### Get User Resources

Get all resources for the authenticated user.

**Endpoint:** `GET /api/resources`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `type` (optional): Filter by resource type
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example:** `GET /api/resources?type=lesson&limit=10&offset=0`

**Response:**
```json
{
  "success": true,
  "resources": [
    {
      "id": "resource123",
      "resource_type": "lesson",
      "title": "Introduction to Photosynthesis",
      ...
    }
  ],
  "count": 10
}
```

### Assign Resource to Student

Assign a resource to a student.

**Endpoint:** `POST /api/resources/:resourceId/assign`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "student_id": "student123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Resource assigned successfully"
}
```

### Unassign Resource from Student

Remove a resource assignment from a student.

**Endpoint:** `POST /api/resources/:resourceId/unassign`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "student_id": "student123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Resource unassigned successfully"
}
```

---

## Student Endpoints

### Add Student

Add a new student.

**Endpoint:** `POST /api/students`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Alice Johnson",
  "grade": "5th",
  "age": "10",
  "notes": "Loves science"
}
```

**Response:**
```json
{
  "success": true,
  "student_id": "student123",
  "message": "Student added successfully"
}
```

### Get Student

Get a specific student by ID.

**Endpoint:** `GET /api/students/:studentId`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "student": {
    "id": "student123",
    "user_id": "user123",
    "name": "Alice Johnson",
    "grade": "5th",
    "age": "10",
    "notes": "Loves science",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
}
```

### Update Student

Update a student's information.

**Endpoint:** `PUT /api/students/:studentId`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Alice Johnson",
  "grade": "6th",
  "age": "11",
  "notes": "Excelling in math"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student updated successfully"
}
```

### Delete Student

Delete a student.

**Endpoint:** `DELETE /api/students/:studentId`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Student deleted successfully"
}
```

### Get User Students

Get all students for the authenticated user.

**Endpoint:** `GET /api/students`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "students": [
    {
      "id": "student123",
      "name": "Alice Johnson",
      "grade": "5th",
      "age": "10",
      ...
    }
  ],
  "count": 5
}
```

### Get Student Resources

Get all resources assigned to a student.

**Endpoint:** `GET /api/students/:studentId/resources`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "resources": [
    {
      "id": "resource123",
      "title": "Introduction to Photosynthesis",
      ...
    }
  ],
  "count": 3
}
```

---

## Lesson Generation Endpoints (Existing)

### Generate Lesson

Generate a new lesson on a topic.

**Endpoint:** `POST /api/generate-lesson`

**Headers:** None required

**Request Body:**
```json
{
  "topic": "Photosynthesis"
}
```

**Response:**
```json
{
  "lesson_id": "lesson123",
  "lesson": {
    "title": "Introduction to Photosynthesis",
    "subtitle": "...",
    ...
  },
  "images": {
    "introduction": "base64_image_data",
    ...
  }
}
```

### Edit Lesson

Edit a lesson using natural language.

**Endpoint:** `POST /api/edit-lesson/:lessonId`

**Headers:** None required

**Request Body:**
```json
{
  "request": "Make the introduction shorter"
}
```

**Response:**
```json
{
  "lesson": { ... },
  "images": { ... }
}
```

---

## Error Responses

All endpoints may return error responses:

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "No authorization token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. In production, consider:
- Rate limiting per user/IP
- Request throttling
- API key management

---

## CORS

CORS is enabled for all origins in development. Configure appropriately for production.

---

## Best Practices

1. **Always include Authorization header** for protected endpoints
2. **Handle token expiration** - Refresh Firebase tokens when needed
3. **Validate input** on client side before sending requests
4. **Handle errors gracefully** - Check response status codes
5. **Use pagination** for large result sets
6. **Cache responses** when appropriate

---

## Example Usage (JavaScript)

```javascript
import axios from 'axios';

// Get auth token
const token = await firebase.auth().currentUser.getIdToken();

// Save a resource
const response = await axios.post(
  'http://localhost:5000/api/resources',
  {
    resource_type: 'lesson',
    title: 'My Lesson',
    content: lessonData,
    images: imageData
  },
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

console.log('Resource ID:', response.data.resource_id);
```

---

## Testing

Use tools like:
- **Postman** - For manual API testing
- **curl** - For command-line testing
- **Jest/Pytest** - For automated testing

Example curl command:
```bash
curl -X POST http://localhost:5000/api/resources \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resource_type":"lesson","title":"Test","content":{}}'
```
