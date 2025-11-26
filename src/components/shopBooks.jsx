import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";

const availableBooks = [
  { name: "Lakshyartha Ramayana", languages: ["Marathi", "Kannada"] },
  { name: "Lakshyartha Gita", languages: ["Marathi", "Kannada"] },
  { name: "Lakshyartha Gita - Part 3", languages: ["Marathi","Kannada"] },
  { name: "Samagraha Charitra", languages: ["Marathi","Kannada"] },
  { name: "Bodhpushpe", languages: ["Marathi","Kannada"] },
  { name: "Shri Sadhguru Saptashiti", languages: ["English", "Kannada"] }
];

export default function ShopBooks() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    contact: ""
  });
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addBook = () => {
    setSelectedBooks([...selectedBooks, { bookName: "", language: "", id: Date.now() }]);
  };

  const removeBook = (id) => {
    setSelectedBooks(selectedBooks.filter(book => book.id !== id));
  };

  const updateBook = (id, field, value) => {
    setSelectedBooks(selectedBooks.map(book => 
      book.id === id ? { ...book, [field]: value } : book
    ));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert("Please enter your name");
      return false;
    }
    if (!formData.contact.trim() || formData.contact.length !== 10) {
      alert("Please enter a valid 10-digit contact number");
      return false;
    }
    if (selectedBooks.length === 0) {
      alert("Please select at least one book");
      return false;
    }
    for (let book of selectedBooks) {
      if (!book.bookName || !book.language) {
        alert("Please complete all book selections");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowOrderSummary(true);
  };

  const confirmOrder = async () => {
    setIsSubmitting(true);
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;

    try {
      for (const book of selectedBooks) {
        const orderData = {
          email_id: userEmail,
          name: formData.name,
          contact: formData.contact,
          book_name: book.bookName,
          language: book.language
        };

        console.log('Sending order data:', orderData);  // Debug log
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/shop-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData)
        });

        const responseData = await response.json();
        console.log('Response:', responseData);  // Debug log

        if (!response.ok) {
          throw new Error(responseData.message || 'Failed to place order');
        }
      }

      alert("Book order placed successfully!");
      setSelectedBooks([]);
      setFormData({ name: "", contact: "" });
      setShowOrderSummary(false);
    } catch (error) {
      console.error('Error placing order:', error);
      alert("Error placing order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showOrderSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <header className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-indigo-600">Order Summary</h2>
              <UserButton />
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center mb-8">📚 Order Summary</h1>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Customer Details</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p><strong>Name:</strong> {formData.name}</p>
                <p><strong>Contact:</strong> {formData.contact}</p>
                <p><strong>Email:</strong> {user?.emailAddresses?.[0]?.emailAddress}</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Books Ordered ({selectedBooks.length})</h3>
              <div className="space-y-3">
                {selectedBooks.map((book, index) => (
                  <div key={book.id} className="flex justify-between items-center bg-indigo-50 rounded-lg p-4">
                    <div>
                      <span className="font-medium">{index + 1}. {book.bookName}</span>
                      <span className="text-gray-600 ml-2">({book.language})</span>
                    </div>
                    <span className="text-indigo-600 font-semibold">📖</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowOrderSummary(false)}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                ← Back to Edit
              </button>
              <button
                onClick={confirmOrder}
                disabled={isSubmitting}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Placing Order...' : '✅ Confirm Order'}
              </button>
            </div>
          </div>
        </main>
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
                onClick={() => navigate('/')}
                className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                ← Back to Home
              </button>
              <h2 className="text-2xl font-bold text-indigo-600">Rajaram Gurukul</h2>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* User Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Shop Books</h1>
            <button
              onClick={() => navigate('/view-orders')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📋 View Past Orders
            </button>
          </div>
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-lg"><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
            <p className="text-lg"><strong>Email:</strong> {user?.emailAddresses?.[0]?.emailAddress}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  value={formData.contact}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 10) {
                      setFormData(prev => ({ ...prev, contact: value }));
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="10-digit phone number"
                  required
                  pattern="[0-9]{10}"
                  maxLength="10"
                />
              </div>
            </div>
          </div>

          {/* Book Selection */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Select Books ({selectedBooks.length})</h3>
              <button
                type="button"
                onClick={addBook}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                + Add Book
              </button>
            </div>

            {selectedBooks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No books selected. Click "Add Book" to start.</p>
            ) : (
              <div className="space-y-4">
                {selectedBooks.map((book, index) => (
                  <div key={book.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-800">Book {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeBook(book.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h5 className="font-medium text-gray-700 mb-2">Available Books:</h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          {availableBooks.map((availableBook, i) => (
                            <div key={i}>• {availableBook.name} (Languages: {availableBook.languages.join(', ')})</div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Book Name *
                          </label>
                          <input
                            type="text"
                            value={book.bookName}
                            onChange={(e) => updateBook(book.id, 'bookName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Type book name..."
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Language *
                          </label>
                          <input
                            type="text"
                            value={book.language}
                            onChange={(e) => updateBook(book.id, 'language', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Type language..."
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button 
              type="submit"
              disabled={isSubmitting || selectedBooks.length === 0}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Placing Order...' : 'Place Order 📚'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}