const IN_PRODUCTION = process.env.NODE_ENV === 'production'

module.exports = {
  plugins: [
    IN_PRODUCTION && require('@fullhuman/postcss-purgecss')({
      content: [
        `./src/web/html/**/*.html`,
        `./src/web/components/**/*.vue`
      ],
      defaultExtractor (content) {
        const contentWithoutStyleBlocks = content.replace(/<style[^]+?<\/style>/gi, '')
        return contentWithoutStyleBlocks.match(/[A-Za-z0-9-_/:]*[A-Za-z0-9-_/]+/g) || []
      },
      whitelist: [
        '.title:not(.is-spaced)+.subtitle', // Fix subtitle spacing
        // Dynamic merchandise types
        '.merchandise-box.shoes',
        '.merchandise-box.head',
        '.merchandise-box.clothes',
      ],
      whitelistPatterns: [ /-(leave|enter|appear)(|-(to|from|active))$/, /^(?!(|.*?:)cursor-move).+-move$/, /^router-link(|-exact)-active$/, /data-v-.*/ ],
    })
  ],
}
