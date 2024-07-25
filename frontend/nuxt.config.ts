// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss"],
  css: ["~/assets/main.css"],
  app: {
    head: {
      title: 'MagicWhitelist',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/img/Allay.webp' }
      ]
    },
  },
  runtimeConfig: {
    public: {
      googlerecapcha: "6LfcVAMqAAAAACoS_DakEu0PRT3SHkzCVecevHwZ",
      api: "https://api-skyrealm-register.kfn.moe"
    }
  }
})