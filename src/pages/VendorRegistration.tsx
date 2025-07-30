const VendorRegistration = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
          Vendor Registration
        </h1>
        <p style={{ fontSize: '16px', color: '#666' }}>
          This is a basic test. If you can see this, the route is working!
        </p>
        <a 
          href="/" 
          style={{ 
            display: 'inline-block', 
            marginTop: '20px', 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '4px' 
          }}
        >
          Back to Home
        </a>
      </div>
    </div>
  );
};

export default VendorRegistration;