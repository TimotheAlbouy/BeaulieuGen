module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/beaulieugen/'
    : '/'
  ,
  pages: {
    index: {
      title: 'Générateur de PDF de messe',
      entry: './src/main.js'
    }
  }
}