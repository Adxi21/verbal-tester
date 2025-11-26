import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";

export default function ViewOrders() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const userEmail = user?.emailAddresses?.[0]?.emailAddress;
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/shop-orders/${userEmail}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (order) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/shop-order`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_id: order.email_id,
          name: order.name,
          contact: order.contact,
          book_name: order.book_name
        })
      });

      if (response.ok) {
        alert("Order deleted successfully!");
        fetchOrders();
      } else {
        throw new Error('Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert("Error deleting order. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/shop-books')}
                className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                ← Back to Shop
              </button>
              <h2 className="text-2xl font-bold text-indigo-600">My Book Orders</h2>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📚 Your Book Orders</h1>
          <p className="text-gray-600">Manage your spiritual book orders</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Orders Yet</h3>
            <p className="text-gray-600 mb-6">You haven't placed any book orders yet.</p>
            <button
              onClick={() => navigate('/shop-books')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Order Your First Book
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Order #{index + 1}</h3>
                    <button
                      onClick={() => deleteOrder(order)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-1">Customer Name</h4>
                      <p className="text-gray-900">{order.name}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-1">Contact</h4>
                      <p className="text-gray-900">{order.contact}</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h4 className="font-medium text-indigo-700 mb-1">Book</h4>
                      <p className="text-indigo-900 font-semibold">{order.book_name}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-medium text-purple-700 mb-1">Language</h4>
                      <p className="text-purple-900 font-semibold">{order.language}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}