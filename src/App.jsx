import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/landing_page";
import Homepage from "./components/homepage";
import Registrations from "./components/registrations";
import CRUD_Registrations from "./components/CRUD_registrations";
import ShaadsSecretSauceVertex from "./components/shaadssecretsaucevertex";
import Location from "./components/location";
import ShopBooks from "./components/shopBooks";
import ViewOrders from "./components/view_orders";

export default function App() {
  return (
    <Router>
      <SignedOut>
        <LandingPage />
      </SignedOut>

      <SignedIn>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/registrations" element={<Registrations />} />
          <Route path="/edit-registrations" element={<CRUD_Registrations />} />
          <Route path="/admin" element={<ShaadsSecretSauceVertex />} />
          <Route path="/location" element={<Location />} />
          <Route path="/shop-books" element={<ShopBooks />} />
          <Route path="/view-orders" element={<ViewOrders />} />
        </Routes>
      </SignedIn>
    </Router>
  );
}
