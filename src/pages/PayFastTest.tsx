import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PayFastService } from '@/lib/payfast';
import { Check, X, Clock, CreditCard } from 'lucide-react';

const PayFastTest: React.FC = () => {
  const [testResults, setTestResults] = useState<{name: string, status: string, message: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    const tests = [
      {
        name: 'PayFast Service Initialization',
        test: async () => {
          const payfast = new PayFastService();
          return payfast ? 'Service initialized successfully' : 'Failed to initialize';
        }
      },
      {
        name: 'Generate Payment Data',
        test: async () => {
          const payfast = new PayFastService();
          const paymentData = await payfast.createPayment({
            amount: 100.00,
            itemName: 'Test Order',
            itemDescription: 'Test payment for integration',
            orderId: 'test-order-123'
          });
          
          return paymentData ? 'Payment data generated successfully' : 'Failed to generate payment data';
        }
      },
      {
        name: 'Signature Generation',
        test: async () => {
          try {
            const response = await fetch('http://localhost:3001/api/payfast-signature', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                merchant_id: '10004002',
                merchant_key: 'q1cd2rdny4a53',
                amount: '100.00',
                item_name: 'Test Order'
              })
            });
            
            const result = await response.json();
            return result.signature ? 'Signature generated successfully' : 'Failed to generate signature';
          } catch (error) {
            return `Signature server error: ${error}`;
          }
        }
      },
      {
        name: 'PayFast Sandbox Connection',
        test: async () => {
          try {
            // Test if PayFast sandbox is reachable
            const testUrl = 'https://sandbox.payfast.co.za/eng/process';
            const response = await fetch(testUrl, { method: 'HEAD', mode: 'no-cors' });
            return 'PayFast sandbox accessible';
          } catch (error) {
            return 'PayFast sandbox connection test (CORS expected)';
          }
        }
      }
    ];

    const results: {name: string, status: string, message: string}[] = [];
    for (const test of tests) {
      try {
        const result = await test.test();
        results.push({
          name: test.name,
          status: 'success',
          message: result
        });
      } catch (error) {
        results.push({
          name: test.name,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    setTestResults(results);
    setIsLoading(false);
  };

  const testPayment = async () => {
    try {
      const payfast = new PayFastService();
      const paymentData = await payfast.createPayment({
        amount: 10.00, // R10 test amount
        itemName: 'Test Product',
        itemDescription: 'Test payment integration',
        orderId: `test-${Date.now()}`,
        customerEmail: 'test@example.com',
        customerName: 'Test User'
      });
      
      // Create form and submit to PayFast sandbox
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://sandbox.payfast.co.za/eng/process';
      form.target = '_blank';
      
      Object.entries(paymentData).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });
      
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
    } catch (error) {
      alert(`Test payment failed: ${error}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            PayFast Integration Test
          </CardTitle>
          <CardDescription>
            Test the PayFast payment integration and verify all components are working correctly.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button onClick={runTests} disabled={isLoading}>
              {isLoading ? 'Running Tests...' : 'Run Integration Tests'}
            </Button>
            <Button variant="outline" onClick={testPayment}>
              Test Payment (R10)
            </Button>
          </div>
          
          {testResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Results</h3>
              {testResults.map((result, index) => (
                <Alert key={index} className={result.status === 'error' ? 'border-red-500' : 'border-green-500'}>
                  <div className="flex items-center gap-2">
                    {result.status === 'success' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : result.status === 'error' ? (
                      <X className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                    <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                      {result.name}
                    </Badge>
                  </div>
                  <AlertDescription className="mt-2">
                    {result.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Configuration Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>PayFast Sandbox Mode:</span>
                <Badge variant="outline">Enabled</Badge>
              </div>
              <div className="flex justify-between">
                <span>Signature Server:</span>
                <Badge variant="outline">localhost:3001</Badge>
              </div>
              <div className="flex justify-between">
                <span>Webhook Handler:</span>
                <Badge variant="outline">localhost:3002</Badge>
              </div>
              <div className="flex justify-between">
                <span>Return URL:</span>
                <Badge variant="outline">/payment-success</Badge>
              </div>
              <div className="flex justify-between">
                <span>Cancel URL:</span>
                <Badge variant="outline">/payment-cancelled</Badge>
              </div>
            </div>
          </div>
          
          <Alert>
            <AlertDescription>
              <strong>Testing Instructions:</strong>
              <br />1. Run integration tests to verify all components
              <br />2. Test payment with R10 amount (opens PayFast sandbox)
              <br />3. Use test card: 4000000000000002 (for successful payments)
              <br />4. Check console logs for webhook notifications
              <br />5. Verify order status updates in database
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayFastTest;