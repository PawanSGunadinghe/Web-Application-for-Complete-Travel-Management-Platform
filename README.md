# TripNest - Complete Travel Management Platform

![TripNest Logo](https://via.placeholder.com/200x80/3B82F6/FFFFFF?text=TripNest)

**TripNest** is a comprehensive travel booking and management platform that provides end-to-end solutions for travel agencies, tour operators, and customers. The platform features multi-role authentication, real-time booking management, financial tracking, and integrated communication tools.

## 🌟 Key Features

### 🎯 **Multi-Role System**
- **Customers**: Browse packages, make bookings, customize tours
- **Tour Guides**: Apply for jobs, manage applications
- **Vehicle Owners**: Register vehicles, manage transport services
- **Administrators**: Complete platform management with specialized dashboards

### 📦 **Package Management**
- Create and manage tour packages with detailed information
- Image uploads and gallery management
- Pricing and availability tracking
- Promotion and offer management
- Custom package requests from customers

### 🚌 **Transport Management**
- Vehicle registration and tracking
- Driver management with license verification
- Real-time vehicle status monitoring
- Insurance and permit tracking
- **WhatsApp Integration** for instant communication

### 💰 **Financial Management**
- Real-time income and expense tracking
- Salary management for employees
- Tax calculation and reporting
- PDF report generation
- Interactive financial dashboards with charts

### 📋 **Booking System**
- Payment processing integration
- Booking confirmation and management
- Custom package booking requests
- Real-time booking status updates

### 🗣️ **Communication & Feedback**
- Customer feedback system with ratings
- Category-based feedback (vehicle, guide, package, driver)
- **Full WhatsApp Web Integration** for real-time communication
- Support ticket system

## 🏗️ Architecture

### Backend (Node.js + Express)
```
Trip_Nest/backend/
├── controllers/          # Business logic controllers
├── models/              # MongoDB schemas
├── routes/              # API route definitions
├── middleware/          # Authentication & validation
├── uploads/             # File storage
└── validators/          # Input validation
```

### Frontend (React + Tailwind CSS)
```
Trip_Nest/trip-nest/src/
├── Pages/               # Page components
│   ├── Admin/          # Admin dashboard pages
│   ├── Customer/       # Customer interface
│   └── public/         # Public pages
├── components/         # Reusable components
├── features/           # Feature modules
└── Assets/            # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TripNest
   ```

2. **Backend Setup**
   ```bash
   cd Trip_Nest/backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../trip-nest
   npm install
   ```

4. **Environment Configuration**
   
   Create `.env` file in `Trip_Nest/backend/`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/tripnest
   JWT_SECRET=your_jwt_secret_key
   PORT=4000
   CORS_ORIGIN=http://localhost:3000
   COOKIE_SECURE=false
   ```

   Create `.env` file in `Trip_Nest/trip-nest/`:
   ```env
   REACT_APP_API_URL=http://localhost:4000/api
   ```

5. **Start the Application**
   
   **Backend:**
   ```bash
   cd Trip_Nest/backend
   npm run dev
   ```
   
   **Frontend:**
   ```bash
   cd Trip_Nest/trip-nest
   npm start
   ```

## 📱 Screenshots

### 🏠 **Homepage**
![Homepage](screenshots/homepage.png)
*Landing page with hero section, promotional offers, and recommended packages*

### 🔐 **Authentication**
![Login Page](screenshots/login.png)
*User login with multi-role support*

![Signup Page](screenshots/signup.png)
*Registration with role selection (Customer, Guide, Vehicle Owner)*

### 👤 **Customer Dashboard**
![Customer Home](screenshots/customer-home.png)
*Customer dashboard with booking history and quick actions*

![Package Booking](screenshots/package-booking.png)
*Package browsing and booking interface*

![Checkout Process](screenshots/checkout.png)
*Multi-step checkout with payment integration*

### 🛠️ **Admin Dashboards**

#### **Package Management**
![Package Dashboard](screenshots/admin-packages.png)
*Package management with CRUD operations*

![Add Package](screenshots/add-package.png)
*Package creation form with image uploads*

#### **Transport Management**
![Transport Dashboard](screenshots/admin-transport.png)
*Vehicle and driver management with WhatsApp integration*

![WhatsApp Integration](screenshots/whatsapp-integration.png)
*Real WhatsApp Web integration for instant communication*

#### **Financial Management**
![Finance Dashboard](screenshots/admin-finance.png)
*Financial overview with charts and real-time data*

![Salary Management](screenshots/salary-management.png)
*Employee salary tracking and management*

#### **Guide Management**
![Guide Dashboard](screenshots/admin-guides.png)
*Tour guide job posting and application management*

![Guide Applications](screenshots/guide-applications.png)
*Guide application review and approval system*

### 📊 **Booking Management**
![Booking Hub](screenshots/booking-hub.png)
*Centralized booking management system*

![Custom Requests](screenshots/custom-requests.png)
*Custom package request handling*

### 💬 **Feedback System**
![Feedback Page](screenshots/feedback.png)
*Customer feedback with rating system*

## 🎯 User Roles & Permissions

### 👥 **Customer**
- Browse and book tour packages
- Create custom package requests
- Manage bookings and profile
- Submit feedback and ratings
- Apply for tour guide positions

### 🧭 **Tour Guide**
- Apply for guide job postings
- Manage application status
- Access guide-specific dashboard
- View assigned bookings

### 🚗 **Vehicle Owner**
- Register vehicles and drivers
- Manage transport services
- Track vehicle status
- Access owner dashboard

### 👨‍💼 **Administrator**
- **Marketing Manager**: Package and offer management
- **Transport Manager**: Vehicle and driver management
- **Finance Manager**: Financial tracking and payroll
- **Booking Manager**: Booking oversight and custom requests
- **Guide Manager**: Job postings and applications

## 🔧 Technical Features

### **Backend Technologies**
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** authentication with httpOnly cookies
- **Multer** for file uploads
- **Socket.io** for real-time communication
- **bcrypt** for password hashing

### **Frontend Technologies**
- **React 19** with functional components and hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Recharts** for data visualization
- **jsPDF** for report generation
- **Socket.io Client** for real-time updates

### **Key Integrations**
- **WhatsApp Web API** - Full WhatsApp integration
- **File Upload System** - Image and document management
- **Real-time Updates** - Live booking and status updates
- **PDF Generation** - Financial and booking reports

## 📁 Project Structure

```
TripNest/
├── Trip_Nest/
│   ├── backend/                 # Node.js Backend
│   │   ├── controllers/         # Business logic
│   │   ├── models/             # Database schemas
│   │   ├── routes/             # API endpoints
│   │   ├── middleware/         # Auth & validation
│   │   ├── uploads/            # File storage
│   │   └── validators/         # Input validation
│   └── trip-nest/              # React Frontend
│       ├── src/
│       │   ├── Pages/          # Page components
│       │   ├── components/     # Reusable components
│       │   ├── features/       # Feature modules
│       │   └── Assets/         # Static assets
│       └── public/             # Public assets
└── WHATSAPP_INTEGRATION_GUIDE.md
```

## 🔐 Security Features

- **JWT Authentication** with httpOnly cookies
- **Role-based Access Control** (RBAC)
- **Password Hashing** with bcrypt
- **Input Validation** and sanitization
- **CORS Configuration** for secure API access
- **File Upload Security** with type validation

## 📊 Database Schema

### **Core Models**
- **User**: Multi-role user management
- **Package**: Tour package information
- **Booking**: Customer bookings with payment details
- **Vehicle**: Transport vehicle management
- **Driver**: Driver information and licensing
- **GuideJob**: Tour guide job postings
- **Feedback**: Customer feedback and ratings
- **Offer**: Promotional offers and discounts

## 🚀 Deployment

### **Production Environment Variables**

**Backend (.env):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tripnest
JWT_SECRET=your_production_jwt_secret
PORT=4000
CORS_ORIGIN=https://yourdomain.com
COOKIE_SECURE=true
```

**Frontend (.env):**
```env
REACT_APP_API_URL=https://api.yourdomain.com/api
```

### **Build Commands**
```bash
# Backend
cd Trip_Nest/backend
npm start

# Frontend
cd Trip_Nest/trip-nest
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- **WhatsApp Integration**: See `WHATSAPP_INTEGRATION_GUIDE.md`
- **Email**: support@tripnest.com
- **Documentation**: [Project Wiki](link-to-wiki)

## 🎉 Acknowledgments

- **WhatsApp Web API** for seamless communication integration
- **MongoDB Atlas** for cloud database hosting
- **Tailwind CSS** for modern UI components
- **React Community** for excellent documentation and tools

---

**TripNest** - Where every journey becomes an unforgettable experience! 🌍✈️

## 📸 Screenshot Instructions

To add screenshots to this README:

1. **Create a `screenshots/` folder** in your project root
2. **Take screenshots** of key pages and features
3. **Rename screenshots** using the suggested names:
   - `homepage.png` - Landing page
   - `login.png` - Login page
   - `signup.png` - Registration page
   - `customer-home.png` - Customer dashboard
   - `package-booking.png` - Package browsing
   - `checkout.png` - Checkout process
   - `admin-packages.png` - Package management
   - `add-package.png` - Add package form
   - `admin-transport.png` - Transport dashboard
   - `whatsapp-integration.png` - WhatsApp integration
   - `admin-finance.png` - Finance dashboard
   - `salary-management.png` - Salary management
   - `admin-guides.png` - Guide management
   - `guide-applications.png` - Guide applications
   - `booking-hub.png` - Booking management
   - `custom-requests.png` - Custom requests
   - `feedback.png` - Feedback system

4. **Update image paths** in the README to match your actual screenshot files
5. **Ensure images are optimized** (recommended: 1200x800px, under 500KB each)

The placeholder images will be replaced with your actual screenshots once you add them to the `screenshots/` folder.
