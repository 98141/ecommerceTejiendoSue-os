import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPages";
import RegisterPage from "./pages/RegisterPages";
import ProductList from "./pages/ProductList";
import { AuthProvider } from "./contexts/AuthContext";
import AdminDashboard from "./pages/AdminDashboard";
import Navbar from "./components/Navbar";
import AdminProductManager from "./pages/AdminProductManager";
import CartPage from "./pages/CartPage";
import ProductDetail from "./pages/ProductDetail";
import MyOrders from "./pages/Myorders";
import AdminOrderPage from "./pages/AdminOrderPage";
import RegisterProductPage from "./pages/RegisterProductPage";
import EditProductPage from "./pages/EditProductPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<ProductList />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProductManager />} />
          <Route path="/admin/orders" element={<AdminOrderPage />} />
          <Route path="/admin/products/new" element={<RegisterProductPage />} />
          <Route path="/admin/products/edit/:id" element={<EditProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/my-orders" element={<MyOrders />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
