import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  NavLink,
  useLocation,
} from "react-router-dom";
import {
  FaTachometerAlt,
  FaBox,
  FaPlus,
  FaShoppingCart,
  FaHistory,
} from "react-icons/fa";
import AddProduct from "./components/AddProduct";
import ProductList from "./components/ProductList";
import Dashboard from "./components/Dashboard";
import SaleProduct from "./components/SaleProduct";
import SaleHistory from "./components/SaleHistory";
import ShopsRegister from "./components/ShopsRegister";
//import ShopsLogin from "./components/ShopsLogin";
import Admin from "./components/admin";
import NotFound from "./components/NotFound"; // Create this component
import MasterWelcome from "./components/MasterWelcome";
import ShopsLogin from "./components/ShopsLogin"; 

// Layout component to manage NavBar
const Layout = ({ children }) => {
  const location = useLocation();
  const hideNavPaths = ["/", "/shops/login", "/shops/register"];

  const shouldHideNav = hideNavPaths.includes(location.pathname);

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <h1 className="text-center text-3xl font-bold py-6">Ration Shop</h1>

      {!shouldHideNav && (
        <nav className="flex justify-center gap-6 p-4 bg-gray-800 shadow-lg">
          <NavLink to="/dashboard" className="nav-link">
            <FaTachometerAlt size={20} /> Dashboard
          </NavLink>
          <NavLink to="/products" className="nav-link">
            <FaBox size={20} /> Products
          </NavLink>
          <NavLink to="/add-product" className="nav-link">
            <FaPlus size={20} /> Add Product
          </NavLink>
          <NavLink to="/sale-product" className="nav-link">
            <FaShoppingCart size={20} /> Sale Product
          </NavLink>
          <NavLink to="/admin" className="nav-link">
            <FaHistory size={20} /> Admin
          </NavLink>
        </nav>
      )}

      <div className="p-4">{children}</div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
        <Route path="/" element={<MasterWelcome />} />
          <Route path="/welcome" element={<Navigate to="/shops/login" />} />
          <Route path="/product-list" element={<ProductList />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/sale-product" element={<SaleProduct />} />
          <Route path="/sale-history" element={<SaleHistory />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/products/add" element={<AddProduct />} />
          <Route path="/dashboard/add" element={<AddProduct />} />

          <Route path="/welcome" element={<ShopsLogin />} />
          {/* Auth Routes */}
          <Route path="/shops/register" element={<ShopsRegister />} />
          <Route path="/shops/login" element={<ShopsLogin />} />

          {/* 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
