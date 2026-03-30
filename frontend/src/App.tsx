import { useEffect, useState } from 'react';
import axios from 'axios';
import ResortMap from './map';

function App() {
  const [status, setStatus] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3000/api/health')
      .then(res => setStatus(res.data.status))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        boxSizing: 'border-box',
      }}
    >
      <p
        style={{
          marginBottom: 12,
          color: '#6b4f1f',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Backend: {status}
      </p>
      <ResortMap />
    </div>
  );
}

export default App;
