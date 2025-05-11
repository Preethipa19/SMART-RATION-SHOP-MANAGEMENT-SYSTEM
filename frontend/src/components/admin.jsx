import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaStore,
  FaBox,
  FaSpinner,
  FaBarcode,
  FaExclamationTriangle,
  FaDownload,
  FaSearch,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AdminInventoryView = () => {
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState({ shops: true, products: true });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("shops");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch data periodically (polling)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("shopToken");
        const [shopsRes, productsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/shops", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:5000/api/all-products", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setShops(shopsRes.data);
        setProducts(productsRes.data);
        setLoading({ shops: false, products: false });
      } catch (err) {
        console.error("Error:", err);
        setError(err.response?.data?.error || "Failed to load data");
        setLoading({ shops: false, products: false });
      }
    };

    fetchData();

    // Polling: Fetch data every 5 seconds
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const renderBarcode = (barcode) => {
    if (!barcode) return <span className="text-gray-400">-</span>;
    return (
      <div className="flex items-center">
        <FaBarcode className="mr-1 text-blue-400" />
        <span className="font-mono text-xs text-gray-300">{barcode}</span>
      </div>
    );
  };

  const stockStatus = (quantity) => {
    if (quantity === 0)
      return <span className="bg-red-500 text-white px-2 py-1 rounded">Out of Stock</span>;
    if (quantity < 10)
      return <span className="bg-yellow-500 text-white px-2 py-1 rounded">Low Stock</span>;
    return <span className="bg-green-500 text-white px-2 py-1 rounded">In Stock</span>;
  };

  // Chart Data: Shop-wise product count
  const shopProductCount = shops.map((shop) => ({
    name: shop.name,
    productCount: products.filter((p) => p.shopId === shop.id).length,
  }));

  // Top Products by Quantity
  const topProducts = [...products]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
    .map((p) => ({ name: p.title, quantity: p.quantity }));

  const handleExportCSV = (data, filename) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        Object.keys(data[0]).join(","),
        ...data.map((row) => Object.values(row).join(",")),
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredShops = shops.filter((shop) =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="p-4 bg-red-900 border border-red-700 text-red-100 rounded">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg p-6 text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Admin Inventory Dashboard</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("shops")}
            className={`px-4 py-2 rounded ${
              activeTab === "shops" ? "bg-blue-600" : "bg-gray-700"
            } transition hover:bg-blue-500`}
          >
            Shops
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 rounded ${
              activeTab === "products" ? "bg-blue-600" : "bg-gray-700"
            } transition hover:bg-blue-500`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-4 py-2 rounded ${
              activeTab === "analysis" ? "bg-blue-600" : "bg-gray-700"
            } transition hover:bg-blue-500`}
          >
            Analysis
          </button>
        </div>
      </div>

      {loading.shops || loading.products ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-4xl text-blue-500" />
        </div>
      ) : activeTab === "shops" ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold flex items-center">
              <FaStore className="mr-2 text-blue-400" /> All Shops
            </h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search shops..."
                className="bg-gray-700 px-4 py-2 rounded-lg text-white focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                onClick={() => handleExportCSV(filteredShops, "shops.csv")}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center"
              >
                <FaDownload className="mr-2" /> Export CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-800 rounded-lg">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredShops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-gray-700 transition">
                    <td className="px-6 py-4 text-sm text-gray-300">{shop.id}</td>
                    <td className="px-6 py-4 text-white font-medium">{shop.name}</td>
                    <td className="px-6 py-4 text-gray-300">{shop.location}</td>
                    <td className="px-6 py-4 text-gray-300">{shop.contactNumber || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : activeTab === "products" ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold flex items-center">
              <FaBox className="mr-2 text-blue-400" /> All Products
            </h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search products..."
                className="bg-gray-700 px-4 py-2 rounded-lg text-white focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                onClick={() => handleExportCSV(filteredProducts, "products.csv")}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center"
              >
                <FaDownload className="mr-2" /> Export CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-800 rounded-lg">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">Barcode</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">Shop</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-300 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-700 transition">
                    <td className="px-6 py-4 text-gray-300">{product.id}</td>
                    <td className="px-6 py-4 text-white">{product.title}</td>
                    <td className="px-6 py-4">{renderBarcode(product.barcode)}</td>
                    <td className="px-6 py-4 text-gray-300">
                      {product.shopName} <span className="text-gray-500">(ID: {product.shopId})</span>
                    </td>
                    <td className="px-6 py-4 text-blue-400">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-4 text-gray-300">{product.quantity}</td>
                    <td className="px-6 py-4">{stockStatus(product.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <FaExclamationTriangle className="mr-2 text-yellow-400" /> Inventory Analysis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-gray-800 p-4 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-4">Shop-wise Product Count</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={shopProductCount}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="productCount" fill="#60A5FA" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg shadow-md">
              <h4 className="text-lg font-semibold mb-4">Top Products by Stock</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#34D399" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminInventoryView;