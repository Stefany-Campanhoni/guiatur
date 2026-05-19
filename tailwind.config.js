const { hairlineWidth } = require('nativewind/theme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/app/**/*.{js,jsx,ts,tsx}', './src/components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        rose: {
          DEFAULT: '#E8A0B4', // blush rose — botões, tabs ativas
          light: '#F7C5D8', // baby pink — badges, bordas
          subtle: '#FDF0F5', // rosado visível — backgrounds de tela
          dark: '#C47A97', // mauve — textos em destaque
        },
        sage: {
          DEFAULT: '#B2CFC4', // verde sálvia — acento fresco
          light: '#DDF0E8', // menta clarinha — chips, tags
        },
        sand: {
          DEFAULT: '#E8D8C4', // areia quente — bordas, divisores
          light: '#FAF4EC', // creme — fundo de cards
        },
        periwinkle: '#C4C8E4', // azul lavanda — ícones, detalhes
        ink: {
          DEFAULT: '#4A3840', // quase preto com tom rosado — texto
          muted: '#A890A0', // cinza rosado — placeholder
          soft: '#C8B0BC', // para labels, captions
        },
        success: '#B2CFC4', // mesmo que sage
        error: '#EDADAD', // vermelho bem pastel
        warning: '#F5D4A8', // âmbar pastel
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
      },
      fontFamily: {
        sans: ['Nunito_400Regular'],
        medium: ['Nunito_600SemiBold'],
        bold: ['Nunito_700Bold'],
      },
    },
  },
  plugins: [],
}
