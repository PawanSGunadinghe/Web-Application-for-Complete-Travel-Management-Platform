import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./features/auth/AuthContext";
import RequireAuth from "./features/auth/RequireAuth";

// Layouts
import PublicLayout from "./Pages/layouts/PublicLayouts";
import CustomerLayout from "./Pages/layouts/CustomerLayouts";
import AdminLayout from "./Pages/layouts/AdminLayouts";
import GuideLayout from "./Pages/layouts/GuideLayout";

// Public pages
import Home from "./Pages/public/Home";
import Login from "./Pages/public/Login";
import Signup from "./Pages/public/Signup";
import PublicBookingPage from "./Pages/Customer/public/PublicBooking";
import PublicGuideJobs from "./Pages/Customer/public/PublicGuideJobs";
import PublicFeedback from "./Pages/Customer/public/PublicFeedback";

// App pages (protected)
import BookingPage from "./Pages/Customer/Booking/BookingPage";
import UserProfile from "./Pages/Customer/UserProfile";
import BookingDetail from "./Pages/Customer/Booking/BookingDetail";
import CheckoutSuccess from "./Pages/Customer/CheckoutSuccess";
import JobsGallery from "./Pages/Customer/TourGuide/Careers";
import FeedbackPage from "./Pages/Customer/FeedbackPage";
import CustomerGuideApplicationForm from "./Pages/Customer/TourGuide/GuideApplicationUser";
import ViewGuideJobApplication from "./Pages/Customer/TourGuide/ViewJobApplications";
import CustomizePackage from "./Pages/Customer/CustomizePackage";
import CustomRequestBookView from "./Pages/Customer/Booking/CustomizeReqestList";
import CustomRequestDetails from "./Pages/Customer/Booking/CustomReqeustDetail";



// Admin pages (protected)
import PackageDashboard from "./Pages/Admin/MarkertingManager/PackageDashboard";
import AddPackage from "./Pages/Admin/MarkertingManager/AddPackage";
import GuideAdminD from "./Pages/Admin/ToureGuide/GuideAdminD";
import TransportAdminD from "./Pages/Admin/Transport/TransportAdminD";
import FinanceAdminD from "./Pages/Admin/FinanceManager/FinanceAdminD";
import TourJobsPostForm from "./Pages/Admin/ToureGuide/TourGuidJobPost";
import DriverForm from "./Pages/Admin/Transport/DriversForm";
import VehicleForm from "./Pages/Admin/Transport/VehicleRegistration";
import GuideJobReport from "./Pages/Admin/ToureGuide/GuideReport";
import GuideApplicationForm from "./Pages/Admin/ToureGuide/GuideApplication";
import GuideList from "./Pages/Admin/ToureGuide/GuideList";
import GuideApplicationDetail from "./Pages/Admin/ToureGuide/GuideApplicationDetail";
import PackageDetail from "./Pages/Admin/MarkertingManager/PackageDetail";
import DriverDetail from "./Pages/Admin/Transport/DriverDetail";
import VehicleDetail from "./Pages/Admin/Transport/VehicleDetail";
import CustomerHome from "./Pages/Customer/CustomerHome";
import CheckoutDetails from "./Pages/Customer/CheckoutDetails";
import CheckoutConfirm from "./Pages/Customer/CheckoutConform";
import GuideJobEdit from "./Pages/Admin/ToureGuide/GuideJobEdit";
import SalariesList from "./Pages/Admin/FinanceManager/SalariesList";
import SalaryCreate from "./Pages/Admin/FinanceManager/SalaryCreate";
import CustomeBookDetails from "./Pages/Admin/BookingManager/CustomeBookDetails";
import CustomBookView from "./Pages/Admin/BookingManager/CustomeBookView";
import AddOffers from "./Pages/Admin/MarkertingManager/AddOffers";
import AdminBookingsPage from "./Pages/Admin/BookingManager/ShowBooking";
import AdminBookingHub from "./Pages/Admin/BookingManager/BookingHub";
import ViewBookingsAdminPage from "./Pages/Admin/BookingManager/ViewBookingsAdmin";
import OffersList from "./Pages/Admin/MarkertingManager/OffersList";
import OfferDetail from "./Pages/Admin/MarkertingManager/OffersDetail";
import OffersEdit from "./Pages/Admin/MarkertingManager/OffersEdit";





export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public area (no auth) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />           {/* default open here */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/unauthorized" element={<div className="p-6">Unauthorized</div>} />
            <Route path="/public-booking" element={<PublicBookingPage />} />
            <Route path="/public-guide-jobs" element={<PublicGuideJobs />} />
            <Route path="/public-feedback" element={<PublicFeedback />} />
          </Route>

          {/* Customer/General protected */}
          <Route element={<RequireAuth roles={['customer','guide','vehicle_owner','admin']} />}>
            <Route element={<CustomerLayout />}>
              <Route path="/home" element={<CustomerHome />} />
              <Route path="/user-profile" element={<UserProfile />} />
              <Route path="/packages/:id" element={<BookingDetail />} />
              <Route path="/checkout" element={<CheckoutDetails />} />
              <Route path="/checkout/confirm" element={<CheckoutConfirm />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/guide-jobs" element={<JobsGallery />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/guide-application-public" element={<CustomerGuideApplicationForm />} />
              <Route path="/view-guide-job/:id" element={<ViewGuideJobApplication />} />
              <Route path="/customize-package" element={<CustomizePackage />} />
              <Route path="/custom-request-view" element={<CustomRequestBookView />} />
              <Route path="/custom-request/:id" element={<CustomRequestDetails />} />
              
            </Route>
          </Route>

          {/* Guide protected */}
          <Route element={<RequireAuth roles={['guide']} />}>
            <Route element={<GuideLayout />}>
              <Route path="/guide/dashboard" element={<div className="p-6">Guide dashboard</div>} />
            </Route>
          </Route>

          {/* Vehicle Owner protected */}
          <Route element={<RequireAuth roles={['vehicle_owner']} />}>
            <Route element={<CustomerLayout />}>
              <Route path="/owner/dashboard" element={<div className="p-6">Vehicle owner dashboard</div>} />
            </Route>
          </Route>

          {/* Admin protected */}
          <Route element={<RequireAuth roles={['admin']} />}>
            <Route
              path="/admin"
              element={
                <AdminLayout
                  onLogout={() => {
                    // optional: wire to AuthContext.logout via a hook,
                    // or navigate('/login') after calling it
                    // (see next tip below)
                  }}
                />
              }
            >
              <Route index element={<PackageDashboard />} />
              <Route path="add-package" element={<AddPackage />} />
              <Route path="guide-admin" element={<GuideAdminD />} />
              <Route path="transport-admin" element={<TransportAdminD />} />
              <Route path="finance-admin" element={<FinanceAdminD />} />
              <Route path="tour-jobs-post-form" element={<TourJobsPostForm />} />
              <Route path="driver-form" element={<DriverForm />} />
              <Route path="vehicle-form" element={<VehicleForm />} />
              <Route path="guide-job/:id" element={<GuideJobReport />} />
              <Route path="guide-application" element={<GuideApplicationForm />} />
              <Route path="guide-applications" element={<GuideList />} />
              <Route path="guide-application/:id" element={<GuideApplicationDetail />} />
              <Route path="package-details/:id" element={<PackageDetail />} />
              <Route path="drivers-detail/:id" element={<DriverDetail />} />
              <Route path="vehicles-detail/:id" element={<VehicleDetail />} />
              <Route path="guide-job/:id/edit" element={<GuideJobEdit />} />
              <Route path="payroll/salaries" element={<SalariesList />} />
              <Route path="payroll/salaries/new" element={<SalaryCreate />} />
              <Route path="payroll/salaries/:id/edit" element={<SalaryCreate />} />
              <Route path="custom-bookings" element={<CustomeBookDetails />} />
              <Route path="custom-bookings/:id" element={<CustomBookView />} />
              <Route path="add-offers" element={<AddOffers />} />
              <Route path="show-bookings-admin" element={<AdminBookingsPage />} />
              <Route path="booking-hub" element={<AdminBookingHub />} />
              <Route path="view-bookings/:id" element={<ViewBookingsAdminPage />} />
              <Route path="offers" element={<OffersList />} />
              <Route path="offers/:id" element={<OfferDetail />} />
              <Route path="offers/:id/edit" element={<OffersEdit />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<div className="p-6">Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
