import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaShoppingCart, 
  FaHistory, 
  FaSearch, 
  FaSort, 
  FaSortUp, 
  FaSortDown,
  FaUser,
  FaMoneyBillWave,
  FaStore,
  FaBox
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import moment from 'moment';

const SalesManagement = () => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState({ products: true, sales: true });
  const [activeTab, setActiveTab] = useState('record');
  const [formData, setFormData] = useState({
    productId: '',
    quantitySold: 1,
    customerName: 'Anonymous',
    paymentMethod: 'Cash'
  });
  const [sortConfig, setSortConfig] = useState({ key: 'saleDate', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentShop, setCurrentShop] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('shopToken');
        const shopData = JSON.parse(localStorage.getItem('shopData'));
        setCurrentShop(shopData);

        const [productsRes, salesRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/products?shopId=${shopData.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/sales-with-shop', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setProducts(productsRes.data);
        setSales(salesRes.data);
        setLoading({ products: false, sales: false });
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
        setLoading({ products: false, sales: false });
      }
    };

    fetchData();
  }, []);

  // Record a new sale
  const handleRecordSale = async (e) => {
    e.preventDefault();
    
    if (!formData.productId) {
      toast.error('Please select a product');
      return;
    }

    if (formData.quantitySold <= 0 || isNaN(formData.quantitySold)) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      const token = localStorage.getItem('shopToken');
      const product = products.find(p => p.id === formData.productId);

      if (!product) {
        toast.error('Selected product not found');
        return;
      }

      if (product.quantity < formData.quantitySold) {
        toast.error(`Insufficient stock. Only ${product.quantity} available`);
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/sales',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setProducts(products.map(p => 
        p.id === formData.productId 
          ? { ...p, quantity: response.data.product.newQuantity } 
          : p
      ));
      
      setSales([{
        ...response.data.sale,
        productTitle: product.title,
        unitPrice: product.price,
        shopName: currentShop.name
      }, ...sales]);

      // Reset form
      setFormData({
        productId: '',
        quantitySold: 1,
        customerName: 'Anonymous',
        paymentMethod: 'Cash'
      });
      
      toast.success(
        <div>
          Sale recorded successfully!
          <div className="text-sm mt-1">
            {formData.quantitySold} × {product.title} at {formatCurrency(product.price)} each
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error recording sale:', error);
      toast.error(error.response?.data?.error || 'Failed to record sale');
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

  const sortedSales = [...sales].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Search functionality
  const filteredSales = sortedSales.filter(sale =>
    sale.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.shopName && sale.shopName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
            <FaShoppingCart /> Sales Management
          </h2>
          {currentShop && (
            <div className="flex items-center text-gray-400 mt-1">
              <FaStore className="mr-1" /> {currentShop.name}
              {currentShop.location && (
                <span className="ml-3 text-sm">
                  <FaMapMarkerAlt className="inline mr-1" /> {currentShop.location}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('record')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === 'record' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            Record Sale
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            <FaHistory /> Sales History
          </button>
        </div>
      </div>

      {activeTab === 'record' ? (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Record New Sale</h3>
          <form onSubmit={handleRecordSale} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Product *</label>
              <select
                name="productId"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.title} (Stock: {product.quantity}, Price: {formatCurrency(product.price)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Quantity *</label>
              <input
                type="number"
                name="quantitySold"
                min="1"
                value={formData.quantitySold}
                onChange={(e) => setFormData({ ...formData, quantitySold: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Customer Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-500" />
                </div>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Anonymous"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Payment Method</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaMoneyBillWave className="text-gray-500" />
                </div>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              Record Sale
            </button>
          </form>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {loading.sales ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FaStore className="mr-1" /> Shop
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FaBox className="mr-1" /> Product
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('quantitySold')}
                    >
                      <div className="flex items-center">
                        Qty
                        {sortConfig.key === 'quantitySold' ? (
                          sortConfig.direction === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                        ) : <FaSort className="ml-1 opacity-30" />}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('saleDate')}
                    >
                      <div className="flex items-center">
                        Date
                        {sortConfig.key === 'saleDate' ? (
                          sortConfig.direction === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                        ) : <FaSort className="ml-1 opacity-30" />}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('customerName')}
                    >
                      <div className="flex items-center">
                        <FaUser className="mr-1" /> Customer
                        {sortConfig.key === 'customerName' ? (
                          sortConfig.direction === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                        ) : <FaSort className="ml-1 opacity-30" />}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('paymentMethod')}
                    >
                      <div className="flex items-center">
                        <FaMoneyBillWave className="mr-1" /> Payment
                        {sortConfig.key === 'paymentMethod' ? (
                          sortConfig.direction === 'asc' ? <FaSortUp className="ml-1" /> : <FaSortDown className="ml-1" />
                        ) : <FaSort className="ml-1 opacity-30" />}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredSales.length > 0 ? (
                    filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-750 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            {sale.shopName || currentShop?.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{sale.title || sale.productTitle}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{sale.quantitySold}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{formatCurrency(sale.price || sale.unitPrice)}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-400">
                            {formatCurrency(sale.totalCost || (sale.price * sale.quantitySold))}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {moment(sale.saleDate).format('DD/MM/YYYY hh:mm A')}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{sale.customerName}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{sale.paymentMethod}</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-6 text-center text-gray-400">
                        {searchTerm ? 'No matching sales found' : 'No sales recorded yet'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SalesManagement;