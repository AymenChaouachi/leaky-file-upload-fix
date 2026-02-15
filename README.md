# Secure File Upload System

## Description

This project fixes the issues of an insecure file upload system.

The system prevents:

- Server crashes due to large file uploads
- Uploading malicious file types
- Disk space exhaustion
- Duplicate file storage
- Poor error handling

---

## Features

- Maximum file size: 5MB
- Accepts only image files (jpg, png, gif, webp)
- Duplicate detection using file hashing
- Automatic deletion of files older than 24 hours
- Clear error messages for rejected uploads
- Simple web interface for testing

---

## Technologies Used

- Node.js
- Express
- Multer (file upload handling)
- Crypto (duplicate detection via hashing)
- fs-extra (file management)

---

## How to Run

1. Install Node.js  
   https://nodejs.org

2. Install dependencies:

npm install


3. Start the server:

node server.js


4. Open in browser:

http://localhost:3000


---

## Security Measures

- File size limit (5MB)
- MIME type validation
- Duplicate file prevention
- Automatic cleanup mechanism

---

This implementation ensures secure, efficient, and controlled file uploads.
