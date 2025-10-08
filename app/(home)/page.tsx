'use client'

import { Instagram, Facebook, Phone, MapPin, ExternalLink, LayoutDashboard, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { useState, useEffect } from "react"
import QRCode from "react-qr-code"
import { ExternalLink as LinkIcon, Maximize2, Minimize2 } from 'lucide-react'
import { useSession } from "next-auth/react"
import Link from "next/link"


export default function NitroBeerLinktree() {
  const [currentUrl, setCurrentUrl] = useState('')
  const [mapLoaded, setMapLoaded] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showFAB, setShowFAB] = useState(true)
  const { data: session, status } = useSession()


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

        {/* Dashboard Access Button for Authenticated Users */}
        {status === 'authenticated' && session && (
          <div className="mb-6 sm:mb-8 animate-fade-in">
            <Button
              asChild
              className="w-full h-12 sm:h-14 gap-2 bg-primary/90 hover:bg-primary text-primary-foreground"
            >
              <a href="/dashboard">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                Acessar Dashboard
              </a>
            </Button>
          </div>
        )}
     

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

      {/* Floating Dashboard Button - Only visible when authenticated */}
      {status === 'authenticated' && session && showFAB && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {/* Close FAB button */}
          <button
            onClick={() => setShowFAB(false)}
            className="ml-auto mb-1 p-1 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background transition-all"
            aria-label="Ocultar botão"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          
          {/* Dashboard FAB */}
          <Link href="/dashboard">
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse" />
              <button className="relative flex items-center justify-center w-16 h-16 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95">
                <LayoutDashboard className="w-7 h-7" />
              </button>
            </div>
          </Link>
          
          {/* Label */}
          <div className="text-center">
            <span className="text-xs font-medium text-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full border border-border/50">
              Dashboard
            </span>
          </div>
        </div>
      )}

      {/* Show FAB again button - appears when FAB is hidden */}
      {status === 'authenticated' && session && !showFAB && (
        <button
          onClick={() => setShowFAB(true)}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/50 hover:bg-primary/30 transition-all"
          aria-label="Mostrar botão dashboard"
        >
          <LayoutDashboard className="w-5 h-5 text-primary" />
        </button>
      )}
    </div>
  )
}
