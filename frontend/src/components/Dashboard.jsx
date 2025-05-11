import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FaBox,
  FaExclamationTriangle,
  FaClock,
  FaTimesCircle,
  FaUser,
  FaSignOutAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import DateRangePicker from "./DateRangePicker";
import { io } from "socket.io-client";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    expiringSoon: 0,
    expiredProducts: 0,
  });
  const [expiredProducts, setExpiredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [shopInfo, setShopInfo] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("shopToken");
        const shopData = JSON.parse(localStorage.getItem("shopData"));

        if (!token || !shopData) {
          navigate("/shops/login");
          return;
        }

        const [productsResponse] = await Promise.all([
          axios.get(
            `http://localhost:5000/api/products?shopId=${shopData.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
        ]);

        const products = productsResponse.data;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const expired = products.filter((product) => {
          if (!product.expiryDate) return false;
          return new Date(product.expiryDate) < today;
        });

        setExpiredProducts(expired);
        setStats({
          totalProducts: products.length,
          lowStock: products.filter((p) => p.quantity <= 5).length,
          expiringSoon: products.filter((p) => {
            if (!p.expiryDate) return false;
            const expiry = new Date(p.expiryDate);
            return expiry >= today && expiry <= nextWeek;
          }).length,
          expiredProducts: expired.length,
        });
      } catch (error) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, navigate]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Real-time notifications using WebSocket
  useEffect(() => {
    const socket = io("http://localhost:5000"); // Replace with your backend WebSocket URL

    socket.on("product-received", (data) => {
      toast.success(`Product Received: ${data.productName} (Qty: ${data.quantity})`);
    });

    socket.on("product-transferred", (data) => {
      toast.info(`Product Transferred: ${data.productName} to ${data.shopName}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredExpiredProducts = expiredProducts.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-gray-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-400">
            📊 {shopInfo?.name || "Shop"} Dashboard
          </h1>
          <p className="text-gray-400 text-sm">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <DateRangePicker dateRange={dateRange} onChange={setDateRange} />
          <div className="flex items-center bg-gray-800 px-4 py-2 rounded-lg">
            <FaUser className="text-blue-400 mr-2" />
            <span>{shopInfo?.email || "Shop"}</span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("shopToken");
              localStorage.removeItem("shopData");
              navigate("/shops/login");
              toast.info("Logged out successfully");
            }}
            className="flex items-center bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
          >
            <FaSignOutAlt className="mr-2" /> Logout
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { title: "Total Products", value: stats.totalProducts, color: "bg-blue-500", icon: FaBox },
              { title: "Low Stock", value: stats.lowStock, color: "bg-yellow-500", icon: FaExclamationTriangle },
              { title: "Expiring Soon", value: stats.expiringSoon, color: "bg-orange-500", icon: FaClock },
              { title: "Expired Products", value: stats.expiredProducts, color: "bg-red-500", icon: FaTimesCircle },
            ].map((stat, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg shadow-lg text-white ${stat.color}`}
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-gray-800 mr-3">
                    <stat.icon className="text-2xl" />
                  </div>
                  <div>
                    <p className="text-sm">{stat.title}</p>
                    <h3 className="text-xl font-bold">{stat.value}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Expired Products */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">
                <FaTimesCircle className="text-red-400 mr-2" />
                Expired Products ({expiredProducts.length})
              </h2>
              <input
                type="text"
                placeholder="Search expired products..."
                className="bg-gray-700 px-4 py-2 rounded-lg text-white focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {filteredExpiredProducts.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2">Quantity</th>
                    <th className="px-4 py-2">Price</th>
                    <th className="px-4 py-2">Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpiredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-700 transition"
                    >
                      <td className="px-4 py-2">{product.title}</td>
                      <td className="px-4 py-2">{product.quantity}</td>
                      <td className="px-4 py-2">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-4 py-2">{product.expiryDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-400">No expired products found.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;