import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaExchangeAlt, 
  FaHistory, 
  FaStore,
  FaBox,
  FaArrowRight,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaFilter
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import moment from 'moment';

const ShopTransfer = () => {
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [filteredTransfers, setFilteredTransfers] = useState([]);
  const [loading, setLoading] = useState({
    products: true,
    shops: true,
    transfers: true,
    processing: false
  });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('new');
  const [formData, setFormData] = useState({
    fromShopId: '',
    toShopId: '',
    productId: '',
    quantity: 1,
    notes: ''
  });
  const [validationErrors, setValidationErrors] = useState({
    toShop: '',
    product: '',
    quantity: ''
  });
  const [selectedShopDetails, setSelectedShopDetails] = useState(null);
  const [currentShop, setCurrentShop] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDateRange, setFilterDateRange] = useState({
    start: '',
    end: ''
  });
  const [transferTypeFilter, setTransferTypeFilter] = useState('all');

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('shopToken');
      const shopData = JSON.parse(localStorage.getItem('shopData'));
      
      if (!shopData || !shopData.id) {
        throw new Error('Shop data not found');
      }

      setCurrentShop(shopData);
      setFormData(prev => ({ 
        ...prev, 
        fromShopId: shopData.id 
      }));

      const [productsRes, shopsRes, transfersRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/products?shopId=${shopData.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/shops-with-location`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/api/transfers-with-locations?shopId=${shopData.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      // Validate responses
      if (!productsRes.data || !shopsRes.data || !transfersRes.data) {
        throw new Error('Invalid data received from server');
      }

      setProducts(productsRes.data);
      setShops(shopsRes.data.filter(shop => shop.id !== shopData.id));
      setTransfers(transfersRes.data);
      setFilteredTransfers(transfersRes.data);
      setLoading({ products: false, shops: false, transfers: false, processing: false });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error);
      setLoading({ products: false, shops: false, transfers: false, processing: false });
      toast.error(`Failed to load data: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters to transfers
  useEffect(() => {
    let result = transfers;
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(transfer => 
        transfer.productName.toLowerCase().includes(term) ||
        transfer.fromShopName.toLowerCase().includes(term) ||
        transfer.toShopName.toLowerCase().includes(term) ||
        transfer.notes?.toLowerCase().includes(term)
      );
    }
    
    // Apply date range filter
    if (filterDateRange.start || filterDateRange.end) {
      result = result.filter(transfer => {
        const transferDate = moment(transfer.transferDate);
        const startDate = filterDateRange.start ? moment(filterDateRange.start) : null;
        const endDate = filterDateRange.end ? moment(filterDateRange.end) : null;
        
        return (
          (!startDate || transferDate.isSameOrAfter(startDate, 'day')) &&
          (!endDate || transferDate.isSameOrBefore(endDate, 'day'))
        );
      });
    }
    
    // Apply transfer type filter
    if (transferTypeFilter !== 'all' && currentShop) {
      result = result.filter(transfer => {
        if (transferTypeFilter === 'sent') {
          return transfer.fromShopId === currentShop.id;
        } else if (transferTypeFilter === 'received') {
          return transfer.toShopId === currentShop.id;
        }
        return true;
      });
    }
    
    setFilteredTransfers(result);
  }, [transfers, searchTerm, filterDateRange, transferTypeFilter, currentShop]);

  // Handle shop selection
  const handleShopSelect = (shopId) => {
    const shop = shops.find(s => s.id === parseInt(shopId));
    setSelectedShopDetails(shop);
    setFormData({
      ...formData,
      toShopId: shopId
    });
    setValidationErrors({
      ...validationErrors,
      toShop: ''
    });
  };

  // Validate form
  const validateForm = () => {
    const errors = {
      toShop: '',
      product: '',
      quantity: ''
    };
    let isValid = true;

    if (!formData.toShopId) {
      errors.toShop = 'Please select a destination shop';
      isValid = false;
    } else if (formData.toShopId === formData.fromShopId) {
      errors.toShop = 'Cannot transfer to the same shop';
      isValid = false;
    }

    if (!formData.productId) {
      errors.product = 'Please select a product to transfer';
      isValid = false;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity)) {
      errors.quantity = 'Please enter a valid quantity';
      isValid = false;
    } else if (quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
      isValid = false;
    } else {
      const selectedProduct = products.find(p => p.id === parseInt(formData.productId));
      if (selectedProduct && selectedProduct.quantity < quantity) {
        errors.quantity = `Only ${selectedProduct.quantity} units available`;
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
  
    setLoading({ ...loading, processing: true });
  
    try {
      

      const token = localStorage.getItem('shopToken');
      /*if (!token) {
        throw new Error('Authorization token is missing');
    }*/
      const product = products.find(p => p.id === parseInt(formData.productId));
      const toShop = shops.find(s => s.id === parseInt(formData.toShopId));
  
      if (!product || !toShop) {
        throw new Error('Product or shop not found');
      }
  
      const transferData = {
        fromShopId: formData.fromShopId,
        toShopId: formData.toShopId,
        productId: formData.productId,
        productName: product.title,
        quantity: parseInt(formData.quantity),
        unitPrice: product.price,
        totalValue: product.price * parseInt(formData.quantity),
        notes: formData.notes
      };
  
      console.log("Transfer Data to be sent:", transferData); // ✅ ADDED: Check if data is valid
  
      const response = await axios.post(
        'http://localhost:5000/api/transfers',
        transferData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (!response.data || !response.data.transferId) {
        throw new Error('Invalid response from server');
      }
  
      const newTransfer = {
        ...response.data,
        fromShopName: currentShop.name,
        toShopName: toShop.name,
        fromShopLocation: currentShop.location,
        toShopLocation: toShop.location,
        productName: product.title,
        unitPrice: product.price,
        totalValue: product.price * parseInt(formData.quantity)
      };
  
      // Update state
      setProducts(products.map(p => 
        p.id === parseInt(formData.productId) 
          ? { ...p, quantity: p.quantity - parseInt(formData.quantity) } 
          : p
      ));
      
      setTransfers([newTransfer, ...transfers]);
      setFilteredTransfers([newTransfer, ...filteredTransfers]);
  
      // Reset form
      setFormData({
        fromShopId: currentShop.id,
        toShopId: '',
        productId: '',
        quantity: 1,
        notes: ''
      });
      setSelectedShopDetails(null);
      
      // Show success notification
      toast.success (
        <div className="flex items-start">
          <FaCheckCircle className="text-green-500 mt-1 mr-2" />
          <div>
            <div className="font-semibold">Transfer successful!</div>
            <div className="text-sm">
              {transferData.quantity} × {product.title} transferred to {toShop.name}
            </div>
            {toShop.location && (
              <div className="text-xs flex items-center mt-1">
                <FaMapMarkerAlt className="mr-1" />
                {toShop.location}
              </div>
            )}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Transfer failed:', error);
  
      let errorMessage = 'Failed to process transfer';
      if (error.response) {
        errorMessage = error.response.data.error || 
                     error.response.data.message || 
                     'Transfer failed with server error';
        
        if (error.response.data.code === 'PRODUCT_NOT_FOUND') {
          errorMessage = 'Selected product was not found in your inventory';
        } else if (error.response.data.code === 'INSUFFICIENT_STOCK') {
          errorMessage = `Insufficient stock (${error.response.data.currentStock} available)`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
  
      toast.error(
        <div className="flex items-start">
          <FaTimesCircle className="text-red-500 mt-1 mr-2" />
          <div>
            <div className="font-semibold">Transfer Failed</div>
            <div className="text-sm">{errorMessage}</div>
          </div>
        </div>
      );
    } finally {
      setLoading({ ...loading, processing: false });
    }
  };
  
      

    /*  const newTransfer = {
        ...response.data,
        fromShopName: currentShop.name,
        toShopName: toShop.name,
        fromShopLocation: currentShop.location,
        toShopLocation: toShop.location,
        productName: product.title,
        unitPrice: product.price,
        totalValue: product.price * parseInt(formData.quantity)
      };

      // Update state
      setProducts(products.map(p => 
        p.id === parseInt(formData.productId) 
          ? { ...p, quantity: p.quantity - parseInt(formData.quantity) } 
          : p
      ));
      
      setTransfers([newTransfer, ...transfers]);
      setFilteredTransfers([newTransfer, ...filteredTransfers]);

      // Reset form
      setFormData({
        fromShopId: currentShop.id,
        toShopId: '',
        productId: '',
        quantity: 1,
        notes: ''
      });
      setSelectedShopDetails(null);
      
      // Show success notification
      toast.success (
        <div className="flex items-start">
          <FaCheckCircle className="text-green-500 mt-1 mr-2" />
          <div>
            <div className="font-semibold">Transfer successful!</div>
            <div className="text-sm">
              {transferData.quantity} × {product.title} transferred to {toShop.name}
            </div>
            {toShop.location && (
              <div className="text-xs flex items-center mt-1">
                <FaMapMarkerAlt className="mr-1" />
                {toShop.location}
              </div>
            )}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Transfer failed:', error);
      
      let errorMessage = 'Failed to process transfer';
      if (error.response) {
        errorMessage = error.response.data.error || 
                     error.response.data.message || 
                     'Transfer failed with server error';
        
        if (error.response.data.code === 'PRODUCT_NOT_FOUND') {
          errorMessage = 'Selected product was not found in your inventory';
        } else if (error.response.data.code === 'INSUFFICIENT_STOCK') {
          errorMessage = `Insufficient stock (${error.response.data.currentStock} available)`;
        }
      }

      toast.error(
        <div className="flex items-start">
          <FaTimesCircle className="text-red-500 mt-1 mr-2" />
          <div>
            <div className="font-semibold">Transfer Failed</div>
            <div className="text-sm">{errorMessage}</div>
          </div>
        </div>
      );
    } finally {
      setLoading({ ...loading, processing: false });
    }
  };*/

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilterDateRange({ start: '', end: '' });
    setTransferTypeFilter('all');
  };

  // Show error boundary if error exists
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaTimesCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading transfer data</h3>
            <div className="mt-2 text-sm text-red-700">
              {error.message}
              <button
                onClick={() => {
                  setError(null);
                  setLoading({ products: true, shops: true, transfers: true, processing: false });
                  fetchData();
                }}
                className="ml-2 underline text-red-800 font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <FaExchangeAlt /> Shop-to-Shop Transfers
          </h2>
          {currentShop && (
            <div className="text-gray-600 mt-1">
              <div className="flex items-center">
                <FaStore className="mr-2 text-blue-500" />
                <span className="font-medium">{currentShop.name}</span>
              </div>
              {currentShop.location && (
                <div className="flex items-center text-sm mt-1">
                  <FaMapMarkerAlt className="mr-1 text-blue-400" />
                  {currentShop.location}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
              activeTab === 'new' 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            New Transfer
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
              activeTab === 'history' 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray- 300'
            }`}
          >
            <FaHistory /> Transfer History
          </button>
        </div>
      </div>

      {activeTab === 'new' ? (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Create New Transfer</h3>
          
          <form onSubmit={handleTransfer} className="space-y-4">
            {/* From Shop (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Shop</label>
              <div className="bg-gray-100 p-3 rounded-lg border border-gray-300">
                <div className="flex items-center text-gray-800">
                  <FaStore className="mr-2 text-blue-500" />
                  <div>
                    <div className="font-medium">{currentShop?.name}</div>
                    {currentShop?.location && (
                      <div className="text-sm text-gray-600 flex items-center mt-1">
                        <FaMapMarkerAlt className="mr-1" />
                        {currentShop.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* To Shop Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Shop *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaStore className="text-gray-400" />
                </div>
                <select
                  name="toShopId"
                  value={formData.toShopId}
                  onChange={(e) => handleShopSelect(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 bg-white border ${
                    validationErrors.toShop ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  required
                >
                  <option value="">Select destination shop</option>
                  {shops.map(shop => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name} - {shop.location}
                    </option>
                  ))}
                </select>
              </div>
              {validationErrors.toShop && (
                <p className="mt-1 text-sm text-red-500">
                  {validationErrors.toShop}
                </p>
              )}
            </div>

            {/* Selected Shop Details */}
            {selectedShopDetails && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-sm text-gray-700">
                  <div className="font-medium text-blue-700 mb-1">Destination Shop Details</div>
                  {selectedShopDetails.location && (
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-blue-500" />
                      <span>{selectedShopDetails.location}</span>
                    </div>
                  )}
                  {selectedShopDetails.contactNumber && (
                    <div className="flex items-center mt-1">
                      <FaPhone className="mr-2 text-blue-500" />
                      <span>{selectedShopDetails.contactNumber}</span>
                    </div>
                  )}
                  {selectedShopDetails.email && (
                    <div className="flex items-center mt-1">
                      <FaEnvelope className="mr-2 text-blue-500" />
                      <span>{selectedShopDetails.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaBox className="text-gray-400" />
                </div>
                <select
                  name="productId"
                  value={formData.productId}
                  onChange={(e) => {
                    setFormData({...formData, productId: e.target.value});
                    setValidationErrors({...validationErrors, product: ''});
                  }}
                  className={`w-full pl-10 pr-4 py-2 bg-white border ${
                    validationErrors.product ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  disabled={products.length === 0}
                >
                  <option value=""> Select product to transfer</option>
                  {products.length > 0 ? (
                    products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.title} (Stock: {product.quantity}, Price: {formatCurrency(product.price)})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No products available in inventory</option>
                  )}
                </select>
              </div>
              {validationErrors.product && (
                <p className="mt-1 text-sm text-red-500">
                  {validationErrors.product}
                </p>
              )}
            </div>

            {/* Quantity and Value */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => {
                    setFormData({...formData, quantity: e.target.value});
                    setValidationErrors({...validationErrors, quantity: ''});
                  }}
                  className={`w-full px-4 py-2 bg-white border ${
                    validationErrors.quantity ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                {validationErrors.quantity && (
                  <p className="mt-1 text-sm text-red-500">
                    {validationErrors.quantity}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Value
                </label>
                <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-green-600 font-medium">
                  {formData.productId && formData.quantity > 0 ? (
                    formatCurrency(
                      (products.find(p => p.id === parseInt(formData.productId))?.price || 0) * 
                      parseInt(formData.quantity)
                    )
                  ) : '₹0.00'}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes *
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Optional transfer notes..."
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading.processing || products.length === 0}
              className={`w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 ${
                loading.processing || products.length === 0 ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading.processing ? (
                <>
                  <FaSpinner className="animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <FaExchangeAlt /> Process Transfer
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Transfer History */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-800">Transfer History</h3>
              
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                {/* Search Input */}
                <div className="relative flex-grow md:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search transfers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Transfer Type Filter */}
                <select
                  value={transferTypeFilter}
                  onChange={(e) => setTransferTypeFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Transfers</option>
                  <option value="sent">Sent</option>
                  <option value="received">Received</option>
                </select>
                
                {/* Date Range Filter */}
                <div className="flex gap-2">
                  <input
                    type="date"
                    placeholder="Start Date"
                    value={filterDateRange.start}
                    onChange={(e) => setFilterDateRange({...filterDateRange, start: e.target.value})}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="date"
                    placeholder="End Date"
                    value={filterDateRange.end}
                    onChange={(e) => setFilterDateRange({...filterDateRange, end: e.target.value})}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={resetFilters}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-1"
                  >
                    <FaFilter /> Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {loading.transfers ? (
            <div className="flex justify-center items-center h-64">
              <FaSpinner className="animate-spin text-4xl text-blue-500" />
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="flex justify-center mb-4">
                <FaExchangeAlt className="text-4xl text-gray-300" />
              </div>
              <p className="text-lg">No transfer history found</p>
              <p className="text-sm mt-1">
                {transfers.length === 0 
                  ? "Your shop-to-shop transfers will appear here" 
                  : "No transfers match your current filters"}
              </p>
              {transfers.length > 0 && (
                <button
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transfer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity/Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{transfer.productName}</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(transfer.unitPrice)} per unit
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900 font-medium">
                            {transfer.fromShopName}
                          </div>
                          <FaArrowRight className="mx-2 text-gray-400" />
                          <div className="text-sm text-gray-900 font-medium">
                            {transfer.toShopName}
                          </div>
                        </div>
 {transfer.toShopLocation && (
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <FaMapMarkerAlt className="mr-1" />
                            <span>{transfer.toShopLocation}</span>
                          </div>
                        )}
                        {transfer.notes && (
                          <div className="text-xs text-gray-500 mt-1 italic">
                            "{transfer.notes}"
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {transfer.quantity} units
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(transfer.totalValue)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {moment(transfer.transferDate).format('DD MMM YYYY')}
                        </div>
                        <div className="text-xs text-gray-400">
                          {moment(transfer.transferDate).format('h:mm A')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          transfer.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : transfer.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {transfer.status || 'completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShopTransfer;