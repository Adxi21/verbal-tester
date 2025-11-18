import { SignInButton, SignUpButton } from "@clerk/clerk-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-indigo-600">Rajaram Gurukul</h2>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Welcome to <span className="text-indigo-600">Rajaram Gurukul</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Embark on your learning journey with us. Join our community of learners and unlock your potential.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto border border-gray-100">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Get Started Today</h3>
            <p className="text-gray-600 mb-8">Please sign up or sign in to proceed</p>
            
            <div className="space-y-4">
              <SignUpButton>
                <button className="w-full bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 shadow-lg hover:shadow-xl">
                  Sign Up
                </button>
              </SignUpButton>
              <SignInButton>
                <button className="w-full bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition-colors duration-200">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">© 2024 Rajaram Gurukul. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}