📚 BookNook – Backend Server

This is the backend API for BookNook – A Small Online Library. It provides RESTful APIs for managing books, user authentication, borrowing records, and book returns.

🚀 Features

- RESTful API built with Express.js.
- MongoDB database integration using Mongoose.
- User registration and login with password hashing.
- JWT-based authentication middleware.
- Add, view, update, and delete books.
- Borrow books with availability management.
- Prevent duplicate active borrowing.
- Return borrowed books and update available copies.
- User-specific book and borrowing records.
- Protected API routes.

🛠️ Technologies Used

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcryptjs
- jose

📡 API Endpoints

Method| Endpoint| Description
GET| "/api/books"| Get all books
GET| "/api/books/:id"| Get book details
POST| "/api/books"| Add a book
PATCH| "/api/books/:id"| Update a book
DELETE| "/api/books/:id"| Delete a book
GET| "/api/borrows"| Get user's borrow records
POST| "/api/borrows/:bookId"| Borrow a book
PATCH| "/api/borrows/:borrowId/return"| Return a borrowed book
POST| "/api/auth/register"| Register a user
POST| "/api/auth/login"| Login a user

📦 Installation and Setup

1. Clone the repository:
   
   git clone https://github.com/sarachowdhury26/booknook-server.git

2. Navigate to the server directory:
   
   cd booknook-server

3. Install dependencies:
   
   npm install

4. Create a ".env" file and configure your environment variables:
   
   PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

5. Start the development server:
   
   npm run dev

🔗 Related Repository

Frontend Repository:
https://github.com/sarachowdhury26/booknook-client

👩‍💻 Project Information

Project Name: BookNook – A Small Online Library
Backend: Express.js, TypeScript, MongoDB
Repository: https://github.com/sarachowdhury26/booknook-server