import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { X, HelpCircle, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

export function AuthTroubleshooting() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Help Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-2xl hover:scale-110 transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <HelpCircle className="w-6 h-6" />
      </motion.button>

      {/* Troubleshooting Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 m-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl">
                      <HelpCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl text-gray-900 dark:text-white">
                        Login Troubleshooting
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Common issues and solutions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  {/* Issue 1 */}
                  <Alert className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <AlertDescription>
                      <p className="text-gray-900 dark:text-white mb-2">
                        <strong>"Invalid login credentials" error</strong>
                      </p>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-4 list-disc">
                        <li>Make sure you've created an account first</li>
                        <li>Click "Create an Account" if you're a new user</li>
                        <li>Double-check your email and password spelling</li>
                        <li>Passwords are case-sensitive</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  {/* Issue 2 */}
                  <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <AlertDescription>
                      <p className="text-gray-900 dark:text-white mb-2">
                        <strong>First time users</strong>
                      </p>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-4 list-disc">
                        <li>Start by clicking "Create an Account"</li>
                        <li>Fill in your details (name, email, password)</li>
                        <li>You'll be automatically logged in after signup</li>
                        <li>Use the same credentials to login next time</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  {/* Issue 3 */}
                  <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                    <HelpCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <AlertDescription>
                      <p className="text-gray-900 dark:text-white mb-2">
                        <strong>Email confirmation</strong>
                      </p>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-4 list-disc">
                        <li>Check your inbox for a confirmation email</li>
                        <li>Look in your spam/junk folder if not in inbox</li>
                        <li>Click the confirmation link before logging in</li>
                        <li>Wait a few minutes for the email to arrive</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  {/* Issue 4 */}
                  <Alert className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                    <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <AlertDescription>
                      <p className="text-gray-900 dark:text-white mb-2">
                        <strong>Password requirements</strong>
                      </p>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-4 list-disc">
                        <li>Minimum 6 characters required</li>
                        <li>Use a mix of letters and numbers</li>
                        <li>Remember your password or use a password manager</li>
                        <li>Use "Forgot password?" link if you forgot it</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  {/* Quick Steps */}
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-2xl border-2 border-purple-200 dark:border-purple-800">
                    <p className="text-gray-900 dark:text-white mb-3">
                      <strong>✨ Quick Start Guide:</strong>
                    </p>
                    <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-2 ml-4 list-decimal">
                      <li>Click "Create an Account" button</li>
                      <li>Enter your name, email, and password (min 6 chars)</li>
                      <li>Click "Create Account"</li>
                      <li>You'll be logged in automatically</li>
                      <li>Start uploading and visualizing your CSV files!</li>
                    </ol>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Still having issues? Make sure you're connected to the internet and try refreshing the page.
                  </p>
                </div>

                {/* Close Button */}
                <div className="mt-4">
                  <Button
                    onClick={() => setIsOpen(false)}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    Got it, thanks!
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
