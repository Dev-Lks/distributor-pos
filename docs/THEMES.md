# Sistema de Temas NitroBeer

## Visão Geral

O sistema suporta **10 temas minimalistas** com diferentes paletas de cores e bordas arredondadas.

## Temas Disponíveis

### 🌞 Temas Light (4)

#### 1. Light Minimal
- **Nome:** `light-minimal`
- **Descrição:** Clean and minimalist light theme
- **Cores:** Tons neutros de preto e branco
- **Radius:** 0.5rem
- **Melhor para:** Interface limpa e profissional

#### 2. Light Warm
- **Nome:** `light-warm`
- **Descrição:** Warm and cozy light theme with orange accents
- **Cores:** Laranja caloroso (#fbbf24)
- **Radius:** 0.75rem
- **Melhor para:** Ambientes acolhedores e energéticos

#### 3. Light Ocean
- **Nome:** `light-ocean`
- **Descrição:** Fresh and calm light theme with blue tones
- **Cores:** Azul oceano fresco
- **Radius:** 0.6rem
- **Melhor para:** Interface calma e produtiva

#### 4. Light Rose
- **Nome:** `light-rose`
- **Descrição:** Elegant light theme with pink and purple accents
- **Cores:** Rosa e roxo elegante
- **Radius:** 0.8rem
- **Melhor para:** Interface elegante e moderna

### 🌙 Temas Dark (6)

#### 5. Dark Minimal
- **Nome:** `dark-minimal`
- **Descrição:** Elegant and soft dark theme
- **Cores:** Tons neutros de cinza escuro
- **Radius:** 0.5rem
- **Melhor para:** Interface limpa em modo escuro
- **Padrão:** ✅ Tema padrão do sistema

#### 6. Dark Slate
- **Nome:** `dark-slate`
- **Descrição:** Professional dark theme with blue-gray tones
- **Cores:** Azul-acinzentado profissional
- **Radius:** 0.4rem
- **Melhor para:** Ambiente de trabalho profissional

#### 7. Dark Purple
- **Nome:** `dark-purple`
- **Descrição:** Rich dark theme with purple and violet accents
- **Cores:** Roxo e violeta rico
- **Radius:** 0.7rem
- **Melhor para:** Interface criativa e vibrante

#### 8. Dark Forest
- **Nome:** `dark-forest`
- **Descrição:** Natural dark theme with green and earthy tones
- **Cores:** Verde floresta natural
- **Radius:** 0.6rem
- **Melhor para:** Interface orgânica e natural

#### 9. Dark Amber
- **Nome:** `dark-amber`
- **Descrição:** Warm dark theme with amber and gold accents
- **Cores:** Âmbar e dourado quente
- **Radius:** 0.65rem
- **Melhor para:** Interface calorosa em modo escuro

#### 10. Lucao (Personalizado)
- **Nome:** `lucao`
- **Descrição:** Custom theme with green accents
- **Cores:** Verde personalizado
- **Radius:** 0.5rem
- **Melhor para:** Seu tema pessoal! 💚

## Como Usar

### Interface do Usuário

1. Clique no ícone de paleta 🎨 na barra lateral
2. Escolha entre **Light Themes** ou **Dark Themes**
3. Selecione o tema desejado
4. O tema é aplicado imediatamente e salvo no localStorage

### Programaticamente

```typescript
import { useTheme } from '@/components/ThemeProvider'

function MyComponent() {
  const { theme, setTheme } = useTheme()
  
  // Obter tema atual
  console.log(theme) // 'dark-minimal'
  
  // Mudar tema
  setTheme('light-ocean')
}
```

## Características Técnicas

### Cores (OKLCH)

Todos os temas usam o espaço de cores **OKLCH** para:
- ✅ Cores perceptualmente uniformes
- ✅ Melhor interpolação de cores
- ✅ Acessibilidade consistente
- ✅ Cores mais vibrantes em displays modernos

### Variáveis CSS

Cada tema define variáveis CSS como:
- `--background` - Cor de fundo principal
- `--foreground` - Cor do texto principal
- `--primary` - Cor primária (botões, links)
- `--border` - Cor das bordas
- `--radius` - Raio das bordas arredondadas
- E muitas outras...

### Persistência

Os temas são salvos automaticamente no `localStorage` do navegador e restaurados na próxima visita.

## Estrutura de Arquivos

```
lib/
  themes.ts              # Definições dos temas
components/
  ThemeProvider.tsx      # Context provider
  ThemeTogglePopover.tsx # Seletor de temas
app/
  globals.css           # Estilos base
```

## Criando Novos Temas

Para adicionar um novo tema:

1. Adicione o nome ao tipo `ThemeName` em `lib/themes.ts`
2. Adicione a definição do tema no objeto `themes`
3. Atualize a função `applyTheme` para incluir a nova classe
4. (Opcional) Adicione CSS customizado em `globals.css`

```typescript
export type ThemeName = 
  | 'light-minimal' 
  | 'seu-novo-tema' // ← Adicione aqui

export const themes: Record<ThemeName, Theme> = {
  'seu-novo-tema': {
    name: 'seu-novo-tema',
    label: 'Seu Novo Tema',
    description: 'Descrição do seu tema',
    type: 'dark',
    cssVars: {
      background: 'oklch(0.12 0 0)',
      foreground: 'oklch(0.95 0 0)',
      // ... outras variáveis
    }
  }
}
```

## Paleta de Cores OKLCH

Formato: `oklch(lightness chroma hue)`

- **Lightness:** 0 (preto) até 1 (branco)
- **Chroma:** 0 (sem cor) até ~0.4 (muito saturado)
- **Hue:** 0-360 (roda de cores)

Exemplos:
- Vermelho: `oklch(0.55 0.20 25)`
- Verde: `oklch(0.60 0.15 150)`
- Azul: `oklch(0.50 0.14 240)`

## Suporte

Para problemas ou sugestões de novos temas, entre em contato com o time de desenvolvimento.

---

**Versão:** 2.0  
**Última atualização:** Outubro 2025
