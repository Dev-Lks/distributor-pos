'use client';

import { useState } from 'react';
import { Download, ZoomIn, ZoomOut, Maximize2, Menu, X, FileText } from 'lucide-react';

export default function CatalogoPage() {
  const [scale, setScale] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/panamex-catalogo.pdf';
    link.download = 'Catalogo-Nitrobeer.pdf';
    link.click();
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.6));
  };

  const handleFullscreen = () => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Catálogo Nitrobeer
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  Produtos & Soluções
                </p>
              </div>
            </div>

            {/* Desktop Controls */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Diminuir zoom"
              >
                <ZoomOut className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
              <button
                onClick={handleFullscreen}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Tela cheia"
              >
                <Maximize2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {menuOpen ? (
                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="md:hidden pb-4 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Zoom:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleZoomOut}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px] text-center">
                      {Math.round(scale * 100)}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleFullscreen}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Tela Cheia</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* PDF Viewer */}
      <main className="flex-1 overflow-auto bg-gray-200 dark:bg-gray-900">
        <div className="flex justify-center items-start p-4 sm:p-6 lg:p-8 min-h-full">
          <div 
            className="bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300"
            style={{ 
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
            }}
          >
            <iframe
              src="/panamex-catalogo.pdf#toolbar=1&navpanes=1&scrollbar=1"
              className="w-[90vw] sm:w-[85vw] md:w-[80vw] lg:w-[75vw] xl:w-[70vw] 2xl:w-[65vw]"
              style={{ 
                height: 'calc(100vh - 180px)',
                minHeight: '500px',
                border: 'none',
              }}
              title="Catálogo Nitrobeer"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} Nitrobeer. Todos os direitos reservados.
            </p>
            <div className="flex items-center space-x-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <a href="mailto:contato@nitrobeer.com.br" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Contato
              </a>
              <span>•</span>
              <a href="https://nitrobeer.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Site
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
