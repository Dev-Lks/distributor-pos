'use client'

import { Instagram, Facebook, Phone, MapPin, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { useState, useEffect } from "react"
import QRCode from "react-qr-code"
import { ExternalLink as LinkIcon, Maximize2, Minimize2 } from 'lucide-react'


export default function NitroBeerLinktree() {
  const [currentUrl, setCurrentUrl] = useState('')
  const [mapLoaded, setMapLoaded] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)


  useEffect(() => {
    setCurrentUrl(window.location.href)
  }, [])

  const socialLinks = [
    {
      name: "Instagram",
      handle: "@nitrobeer_chopp",
      url: "https://instagram.com/nitrobeer_chopp",
      icon: Instagram,
      color: "hover:bg-pink-600/20 hover:border-pink-500",
    },
    {
      name: "Facebook",
      handle: "/nitrobeerchopp",
      url: "https://facebook.com/nitrobeerchopp",
      icon: Facebook,
      color: "hover:bg-blue-600/20 hover:border-blue-500",
    },
    {
      name: "WhatsApp",
      handle: "+55 34 99682-8214",
      url: "https://wa.me/5534996828214",
      icon: Phone,
      color: "hover:bg-green-600/20 hover:border-green-500",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800">
      {/* Decorative background pattern */}
      <div className="fixed inset-0 decorative-pattern opacity-30" />

      <div className="relative z-10 container max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
        {/* Profile Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className={`w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 mx-auto mb-6 sm:mb-8 relative transition-all duration-500 ${imageLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
            <Image
              src="/MANUAL NITROBEER ID VISUAL.svg"
              alt="NitroBeer Logo"
              fill
              className="object-contain drop-shadow-2xl animate-pulse"
              priority
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 text-balance animate-fade-in">
            NitroBeer
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-3 sm:mb-4 animate-fade-in animation-delay-200">
            Cerveja Artesanal Premium
          </p>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed px-2 animate-fade-in animation-delay-400">
            {"✨ Chopp premium, vibes únicas, para quem não aceita a mesmice! 🍻"}
          </p>
        </div>
     

        {/* Social Links */}
        <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-4 sm:mb-6 md:mb-8">
          {socialLinks.map((link, index) => {
            const IconComponent = link.icon
            return (
              <Button
                key={link.name}
                asChild
                variant="outline"
                className={`w-full h-10 sm:h-12 md:h-14 justify-start gap-2 sm:gap-3 md:gap-4 bg-card/50 backdrop-blur-sm border-border/50 transition-all duration-300 hover-lift ${link.color} text-xs sm:text-sm md:text-base animate-fade-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-medium truncate w-full text-xs sm:text-sm md:text-base">{link.name}</span>
                    <span className="text-xs sm:text-sm text-muted-foreground truncate w-full">{link.handle}</span>
                  </div>
                  <ExternalLink className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 opacity-50 flex-shrink-0 transition-transform duration-200 hover:translate-x-1" />
                </a>
              </Button>
            )
          })}
        </div>

        {/* Location Section */}
        <Card className="p-3 sm:p-4 md:p-6 bg-card/50 backdrop-blur-sm border-border/50 mb-4 sm:mb-6 md:mb-8 hover-lift animate-fade-in animation-delay-200">
          <Button
            asChild
            variant="outline"
            className="w-full mb-3 sm:mb-4 hover:bg-primary/10 hover:border-primary/50 bg-transparent h-10 sm:h-11 text-sm sm:text-base"
          >
            <a
              href="https://maps.app.goo.gl/pse9bgKadtv9QSCbA"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
              Ver no Google Maps
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 ml-auto opacity-50" />
            </a>
          </Button>

          <div className={`w-full h-40 sm:h-48 md:h-56 lg:h-64 xl:h-72 rounded-lg overflow-hidden border border-border/50 map-container ${mapLoaded ? 'map-loaded' : 'map-loading'}`}>
            <div className="map-skeleton" aria-hidden={!mapLoaded}>
              <span className="text-sm text-muted-foreground">Carregando mapa…</span>
            </div>

            <div className="map-overlay" aria-hidden={mapLoaded}>
              <a
                className="map-control"
                href="https://maps.app.goo.gl/pse9bgKadtv9QSCbA"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir em Google Maps"
              >
                <LinkIcon className="w-4 h-4 inline-block mr-1" />
                Abrir
              </a>
              <button
                type="button"
                className="map-control"
                onClick={() => setFullscreen(!fullscreen)}
                aria-pressed={fullscreen}
                aria-label={fullscreen ? 'Sair do modo tela cheia' : 'Entrar em modo tela cheia'}
              >
                {fullscreen ? <Minimize2 className="w-4 h-4 inline-block mr-1" /> : <Maximize2 className="w-4 h-4 inline-block mr-1" />}
                {fullscreen ? 'Fechar' : 'Tela cheia'}
              </button>
            </div>

            <iframe
              className="map-frame"
              src="https://maps.google.com/maps?q=Av%20Minas%20Gerais%2C%203034%20-%20Centro%2C%20Ituiutaba%20-%20MG%2C%2038300&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização NitroBeer"
              onLoad={() => setMapLoaded(true)}
            />

            <div className="map-caption">Avenida Minas Gerais, Natal, 3034 — Ituiutaba - MG</div>
          </div>
        </Card>

        {/* Share Section */}
        <Card className="p-3 sm:p-4 md:p-6 bg-card/50 backdrop-blur-sm border-border/50 mb-4 sm:mb-6 md:mb-8 hover-lift animate-fade-in animation-delay-400">
          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
            <ExternalLink className="w-3 h-3 md:w-4 md:h-4 text-primary flex-shrink-0" />
            <h2 className="text-sm md:text-base md:text-lg font-semibold">Compartilhar</h2>
          </div>

          <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-4">
            Escaneie o QR Code para compartilhar esta página
          </p>

          <div className="flex justify-center">
            {currentUrl && (
              <QRCode value={currentUrl} size={128} />
            )}
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">© 2025 NitroBeer. Todos os direitos reservados.</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {"Beba com moderação. Venda proibida para menores de 18 anos."}
          </p>
        </div>
      </div>
    </div>
  )
}
