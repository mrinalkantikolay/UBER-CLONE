import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner';
import { LandingPage } from "../features/rider/components/LandingPage";
import { LoginOTP } from "../features/auth/components/LoginOTP";
import { RiderDashboard } from "../features/rider/components/RiderDashboard";
import { RideTracking } from "../features/rider/components/RideTracking";
import { PaymentSummary } from "../features/payment/components/PaymentSummary";
import { RiderHistory } from "../features/rider/components/RiderHistory";
import { RiderPromos } from "../features/rider/components/RiderPromos";
import { RiderPayments } from "../features/rider/components/RiderPayments";
import { RiderSupport } from "../features/rider/components/RiderSupport";
import { RiderProfile } from "../features/rider/components/RiderProfile";

// Driver Components
import DriverLogin from "../features/driver/components/DriverLogin";
import DriverRegistration from "../features/driver/components/DriverRegistration";
import DriverDashboard from "../features/driver/components/DriverDashboard";
import IncomingRide from "../features/driver/components/IncomingRide";
import ActiveTrip from "../features/driver/components/ActiveTrip";
import DriverEarnings from "../features/driver/components/DriverEarnings";
import DriverActivity from "../features/driver/components/DriverActivity";
import DriverProfile from "../features/driver/components/DriverProfile";
import DriverDocuments from "../features/driver/components/DriverDocuments";

// Admin Components
import AdminLogin from "../features/admin/components/AdminLogin";
import DashboardOverview from "../features/admin/components/DashboardOverview";
import UsersManagement from "../features/admin/components/UsersManagement";
import DriversManagement from "../features/admin/components/DriversManagement";
import RidesManagement from "../features/admin/components/RidesManagement";
import PaymentsTransactions from "../features/admin/components/PaymentsTransactions";
import AnalyticsReports from "../features/admin/components/AnalyticsReports";

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Toaster />
        <Routes>
          {/* Rider / General Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginOTP />} />
          <Route path="/dashboard" element={<RiderDashboard />} />
          <Route path="/history" element={<RiderHistory />} />
          <Route path="/promos" element={<RiderPromos />} />
          <Route path="/payments" element={<RiderPayments />} />
          <Route path="/support" element={<RiderSupport />} />
          <Route path="/profile" element={<RiderProfile />} />
          <Route path="/tracking" element={<RideTracking />} />
          <Route path="/payment" element={<PaymentSummary />} />

          {/* Driver Portal Routes */}
          <Route path="/driver/login" element={<DriverLogin />} />
          <Route path="/driver/registration" element={<DriverRegistration />} />
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route path="/driver/incoming-ride" element={<IncomingRide />} />
          <Route path="/driver/active-trip" element={<ActiveTrip />} />
          <Route path="/driver/earnings" element={<DriverEarnings />} />
          <Route path="/driver/activity" element={<DriverActivity />} />
          <Route path="/driver/documents" element={<DriverDocuments />} />
          <Route path="/driver/profile" element={<DriverProfile />} />

          {/* Admin Dashboard Routes */}
          <Route path="/admin" element={<DashboardOverview />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<DashboardOverview />} />
          <Route path="/admin/users" element={<UsersManagement />} />
          <Route path="/admin/drivers" element={<DriversManagement />} />
          <Route path="/admin/rides" element={<RidesManagement />} />
          <Route path="/admin/payments" element={<PaymentsTransactions />} />
          <Route path="/admin/analytics" element={<AnalyticsReports />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
