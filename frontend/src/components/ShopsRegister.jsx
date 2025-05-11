import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaStore,
  FaMapMarkerAlt,
  FaEnvelope,
  FaLock,
  FaUser,
  FaArrowRight,
  FaSpinner,
} from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ShopsRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Shop name is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/shops/register",
        {
          name: formData.name,
          location: formData.location,
          email: formData.email,
          password: formData.password,
        }
      );

      toast.success("Shop registered successfully! Redirecting to login...");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/shops/login");
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);

      let errorMessage = "Registration failed. Please try again.";
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data.error || errorMessage;
        } else if (error.response.status === 409) {
          errorMessage = "A shop with this email already exists.";
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <FaStore className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Create Your Shop Account
            </h1>
            <p className="text-gray-400 mt-2">
              Start managing your inventory today
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Shop Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Shop Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-500" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`bg-gray-700 text-white w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${
                    errors.name
                      ? "focus:ring-red-500 border-red-500"
                      : "focus:ring-blue-500 border-gray-600"
                  }`}
                  placeholder="Enter shop name"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaMapMarkerAlt className="text-gray-500" />
                </div>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`bg-gray-700 text-white w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${
                    errors.location
                      ? "focus:ring-red-500 border-red-500"
                      : "focus:ring-blue-500 border-gray-600"
                  }`}
                  placeholder="Enter shop location"
                />
              </div>
              {errors.location && (
                <p className="mt-1 text-sm text-red-400">{errors.location}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-500" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`bg-gray-700 text-white w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${
                    errors.email
                      ? "focus:ring-red-500 border-red-500"
                      : "focus:ring-blue-500 border-gray-600"
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-500" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`bg-gray-700 text-white w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${
                    errors.password
                      ? "focus:ring-red-500 border-red-500"
                      : "focus:ring-blue-500 border-gray-600"
                  }`}
                  placeholder="Enter password (min 6 characters)"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-500" />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`bg-gray-700 text-white w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 ${
                    errors.confirmPassword
                      ? "focus:ring-red-500 border-red-500"
                      : "focus:ring-blue-500 border-gray-600"
                  }`}
                  placeholder="Confirm your password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Registering...
                </>
              ) : (
                <>
                  Register Shop <FaArrowRight className="ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/shops/login")}
                className="text-blue-400 hover:text-blue-300 font-medium focus:outline-none"
              >
                Login here
              </button>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>
            By registering, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShopsRegister;
