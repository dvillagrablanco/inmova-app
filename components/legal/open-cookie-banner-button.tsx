'use client';

export function OpenCookieBannerButton() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
      <p className="font-semibold mb-2">Configurar Cookies</p>
      <button
        onClick={() => {
          window.dispatchEvent(new CustomEvent('open-cookie-banner'));
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Abrir Panel de Cookies
      </button>
    </div>
  );
}
