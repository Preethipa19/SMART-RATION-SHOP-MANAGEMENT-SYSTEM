import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FaBox,
  FaDollarSign,
  FaCubes,
  FaCalendarAlt,
  FaPlusCircle,
  FaBarcode,
  FaSave,
  FaTimes,
  FaSpinner,
  FaDownload,
  FaSync,
  FaEye,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import JsBarcode from "jsbarcode";
import { v4 as uuidv4 } from "uuid";

const AddProduct = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false); // Track if the user is an admin
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    quantity: "",
    expiryDate: "",
    barcode: uuidv4().substring(0, 13), // Generate initial barcode
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [barcodeImage, setBarcodeImage] = useState("");
  const [newProductId, setNewProductId] = useState(null);
  const canvasRef = useRef(null);

  // Check if the user is an admin
  useEffect(() => {
    const shopData = JSON.parse(localStorage.getItem("shopData"));
    if (shopData && shopData.email === "admin@example.com") {
      setIsAdmin(true); // User is an admin
    } else {
      setIsAdmin(false); // User is not an admin
    }
  }, []);

  // Generate barcode when component mounts or barcode changes
  useEffect(() => {
    if (formData.barcode && canvasRef.current) {
      generateBarcode();
    }
  }, [formData.barcode]);

  const generateBarcode = () => {
    try {
      JsBarcode(canvasRef.current, formData.barcode, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
      });
      setBarcodeImage(canvasRef.current.toDataURL("image/png"));
    } catch (error) {
      console.error("Barcode generation error:", error);
      toast.error("Failed to generate barcode");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Product name is required";
    if (!formData.price) {
      newErrors.price = "Price is required";
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number";
    }
    if (!formData.quantity) {
      newErrors.quantity = "Quantity is required";
    } else if (isNaN(formData.quantity) || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = "Quantity must be a positive integer";
    }
    if (!formData.expiryDate) newErrors.expiryDate = "Expiry date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("shopToken");
      const shopData = JSON.parse(localStorage.getItem("shopData"));

      if (!token || !shopData) {
        toast.error("Authentication required. Please login again.");
        navigate("/shops/login");
        return;
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        shopId: shopData.id,
      };

      const response = await axios.post(
        "http://localhost:5000/api/products",
        productData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNewProductId(response.data.id);
      toast.success(
        <div>
          Product added successfully!
          <button
            onClick={() => navigate(`/products/${response.data.id}`)}
            className="ml-2 text-blue-400 hover:text-blue-300 underline"
          >
            View Product
          </button>
        </div>
      );

      // Reset form with new barcode
      setFormData({
        title: "",
        price: "",
        quantity: "",
        expiryDate: "",
        barcode: uuidv4().substring(0, 13),
      });
    } catch (error) {
      console.error("Add product error:", error);
      let errorMessage = "Failed to add product";

      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Session expired. Please login again.";
          navigate("/shops/login");
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadBarcode = () => {
    if (!barcodeImage) return;

    const link = document.createElement("a");
    link.href = barcodeImage;
    link.download = `barcode_${formData.title || "product"}_${
      formData.barcode
    }.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateNewBarcode = () => {
    const newBarcode = uuidv4().substring(0, 13);
    setFormData((prev) => ({ ...prev, barcode: newBarcode }));
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6 bg-gray-900 rounded-lg shadow-xl text-center">
        <h2 className="text-2xl font-bold text-red-500">Access Denied</h2>
        <p className="text-gray-400 mt-2">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 bg-gray-900 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
          <FaPlusCircle /> Add New Product
        </h2>
        <button
          onClick={() => navigate("/products")}
          className="text-gray-400 hover:text-white flex items-center gap-1"
        >
          <FaTimes /> Cancel
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Form */}
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Product Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaBox className="text-gray-500" />
                </div>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 bg-gray-800 border ${
                    errors.title ? "border-red-500" : "border-gray-700"
                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter product name"
                />
              </div>
              {errors.title && (
                <p className="mt-1 text-sm text-red-400">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Price (₹) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaDollarSign className="text-gray-500" />
                </div>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`w-full pl-10 pr-4 py-2 bg-gray-800 border ${
                    errors.price ? "border-red-500" : "border-gray-700"
                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="0.00"
                />
              </div>
              {errors.price && (
                <p className="mt-1 text-sm text-red-400">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Quantity *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCubes className="text-gray-500" />
                </div>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  className={`w-full pl-10 pr-4 py-2 bg-gray-800 border ${
                    errors.quantity ? "border-red-500" : "border-gray-700"
                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="1"
                />
              </div>
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-400">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Expiry Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="text-gray-500" />
                </div>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 bg-gray-800 border ${
                    errors.expiryDate ? "border-red-500" : "border-gray-700"
                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
              {errors.expiryDate && (
                <p className="mt-1 text-sm text-red-400">{errors.expiryDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Barcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaBarcode className="text-gray-500" />
                </div>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
                <button
                  type="button"
                  onClick={generateNewBarcode}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300 text-sm"
                >
                  Regenerate
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <FaSave /> Save Product
                </>
              )}
            </button>
          </form>
        </div>

        {/* Barcode Preview */}
        <div className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-lg font-medium text-gray-300 mb-4 flex items-center gap-2">
            <FaBarcode /> Product Barcode
          </h3>

          {/* Hidden canvas for barcode generation */}
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {barcodeImage ? (
            <div className="flex flex-col items-center">
              <img
                src={barcodeImage}
                alt="Product Barcode"
                className="w-full max-w-xs h-auto border border-gray-600 rounded p-2 bg-white"
              />
              <div className="mt-4 flex gap-2 w-full">
                <button
                  onClick={downloadBarcode}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded flex items-center justify-center gap-2"
                >
                  <FaDownload /> Download
                </button>
                <button
                  onClick={generateNewBarcode}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded flex items-center justify-center gap-2"
                >
                  <FaSync /> Regenerate
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Barcode: {formData.barcode}
              </p>

              {newProductId && (
                <button
                  onClick={() => navigate(`/products/${newProductId}`)}
                  className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center justify-center gap-2"
                >
                  <FaEye /> View Created Product
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FaSpinner className="animate-spin mx-auto text-2xl mb-2" />
              <p>Generating barcode...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
