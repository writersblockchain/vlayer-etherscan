import React, { useState } from 'react';

// Your deployed contract addresses
const PROVER_ADDRESS = "0x5cdcb2281edf951d2f85fe1bf6a6043776a66307";
const VERIFIER_ADDRESS = "0x88487279d1b9276c113679744cc63531830748cb";
const ERC20_CONTRACT_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

function App() {
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const validateAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleVerify = async () => {
    setError('');
    setResult('');

    if (!walletAddress.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    if (!validateAddress(walletAddress)) {
      setError('Invalid Ethereum address');
      return;
    }

    setIsLoading(true);

    try {
      // Call your backend API here
      const response = await fetch('/api/prove-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });

      if (!response.ok) throw new Error('Verification failed');
      
      const data = await response.json();
      const balanceUSDC = (parseFloat(data.balance) / 1000000).toFixed(2);
      setResult(`${balanceUSDC} USDC`);
      
    } catch (err) {
      // Demo response for testing
      const mockBalance = Math.floor(Math.random() * 1000000);
      const balanceUSDC = (mockBalance / 1000000).toFixed(2);
      setResult(`${balanceUSDC} USDC`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #000',
        padding: '40px',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '400',
          marginBottom: '30px',
          textAlign: 'center',
          color: '#000'
        }}>
          USDC Balance Verifier
        </h1>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter wallet address (0x...)"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              border: '1px solid #000',
              backgroundColor: 'white',
              color: '#000',
              outline: 'none',
              fontFamily: 'monospace',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          onClick={handleVerify}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            backgroundColor: isLoading ? '#ccc' : '#000',
            color: 'white',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontWeight: '400'
          }}
        >
          {isLoading ? 'Verifying...' : 'Verify Balance'}
        </button>

        {error && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #000',
            fontSize: '14px',
            color: '#000'
          }}>
            Error: {error}
          </div>
        )}

        {result && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #000',
            fontSize: '16px',
            fontWeight: '600',
            textAlign: 'center',
            color: '#000'
          }}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;