import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaBox, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaSort, 
  FaSortUp, 
  FaSortDown,
  FaInfoCircle,
  FaBarcode,
  FaPlus
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ProductTable = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'title', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('shopToken');
        const shopData = JSON.parse(localStorage.getItem('shopData'));
        
        const response = await axios.get(
          `http://localhost:5000/api/products?shopId=${shopData.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setProducts(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle product deletion
  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const token = localStorage.getItem('shopToken');
      await axios.delete(`http://localhost:5000/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProducts(products.filter(product => product.id !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  // Sorting functionality
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = [...products].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Search functionality
  const filteredProducts = sortedProducts.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm)
  );

  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  // Check if product is expired
  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
          <FaBox /> Product Inventory
        </h2>
        <button
          onClick={() => navigate('/products/add')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FaPlus /> Add Product
        </button>
      </div>

      {/* Search bar */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Product table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-750">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('title')}
                >
                  <div className="flex items-center">
                    Product
                    {sortConfig.key === 'title' ? (
                      sortConfig.direction === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                    ) : <FaSort className="ml-1 opacity-30" />}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('quantity')}
                >
                  <div className="flex items-center">
                    Qty
                    {sortConfig.key === 'quantity' ? (
                      sortConfig.direction === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                    ) : <FaSort className="ml-1 opacity-30" />}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('price')}
                >
                  <div className="flex items-center">
                    Price
                    {sortConfig.key === 'price' ? (
                      sortConfig.direction === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                    ) : <FaSort className="ml-1 opacity-30" />}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('expiryDate')}
                >
                  <div className="flex items-center">
                    Expiry
                    {sortConfig.key === 'expiryDate' ? (
                      sortConfig.direction === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                    ) : <FaSort className="ml-1 opacity-30" />}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Barcode
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {currentProducts.length > 0 ? (
                currentProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{product.title}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm ${
                        product.quantity <= 5 ? 'text-yellow-400 font-bold' : 'text-gray-300'
                      }`}>
                        {product.quantity}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {formatCurrency(product.price)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm ${
                        isExpired(product.expiryDate) ? 'text-red-400' : 'text-gray-300'
                      } font-medium`}>
                        {formatDate(product.expiryDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-400 flex items-center">
                        <FaBarcode className="mr-1" /> {product.barcode}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/products/${product.id}`)}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="View"
                        >
                          <FaInfoCircle size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/products/edit/${product.id}`)}
                          className="text-yellow-400 hover:text-yellow-300 p-1"
                          title="Edit"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-gray-400">
                    {searchTerm ? 'No matching products found' : 'No products available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {filteredProducts.length > productsPerPage && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-400">
            Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-700 text-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
              <button
                key={number}
                onClick={() => setCurrentPage(number)}
                className={`px-3 py-1 rounded ${
                  currentPage === number ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                {number}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-gray-700 text-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTable;