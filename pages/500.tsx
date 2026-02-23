export default function Custom500() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '4rem 1rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>500 - Error del servidor</h1>
      <p style={{ color: '#666' }}>Se ha producido un error interno. Por favor, inténtelo de nuevo más tarde.</p>
      <a href="/" style={{ color: '#4F46E5', marginTop: '2rem', display: 'inline-block' }}>Volver al inicio</a>
    </div>
  );
}
