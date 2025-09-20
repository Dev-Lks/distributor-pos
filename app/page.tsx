import { Instagram, Facebook, Phone, MapPin, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"

export default function NitroBeerLinktree() {
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
    <div className="min-h-screen bg-background">
      {/* Decorative background pattern */}
      <div className="fixed inset-0 decorative-pattern opacity-30" />

      <div className="relative z-10 container max-w-sm sm:max-w-md lg:max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Profile Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 mx-auto mb-6 sm:mb-8 relative">
            <Image
              src="/nitrobeer-logo.png"
              alt="NitroBeer Logo"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 text-balance">NitroBeer</h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-3 sm:mb-4">Cerveja Artesanal Premium</p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed px-2">
            {"Descubra o sabor único da nossa cerveja artesanal. Qualidade, tradição e inovação em cada gole."}
          </p>
        </div>

        {/* Social Links */}
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          {socialLinks.map((link) => {
            const IconComponent = link.icon
            return (
              <Button
                key={link.name}
                asChild
                variant="outline"
                className={`w-full h-12 sm:h-14 justify-start gap-3 sm:gap-4 bg-card/50 backdrop-blur-sm border-border/50 transition-all duration-300 ${link.color} text-sm sm:text-base`}
              >
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-medium truncate w-full">{link.name}</span>
                    <span className="text-xs sm:text-sm text-muted-foreground truncate w-full">{link.handle}</span>
                  </div>
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 opacity-50 flex-shrink-0" />
                </a>
              </Button>
            )
          })}
        </div>

        {/* Location Section */}
        <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-border/50 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-semibold">Nossa Localização</h2>
          </div>

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

          <div className="w-full h-48 sm:h-64 lg:h-72 rounded-lg overflow-hidden border border-border/50">
            <iframe
              src="https://maps.google.com/maps?q=Av%20Minas%20Gerais%2C%203034%20-%20Centro%2C%20Ituiutaba%20-%20MG%2C%2038300&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização NitroBeer"
            />
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">© 2024 NitroBeer. Todos os direitos reservados.</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {"Beba com moderação. Venda proibida para menores de 18 anos."}
          </p>
        </div>
      </div>
    </div>
  )
}
