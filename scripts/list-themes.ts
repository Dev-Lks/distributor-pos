import { themes } from '../lib/themes'

console.log('='.repeat(60))
console.log('AVAILABLE THEMES')
console.log('='.repeat(60))

Object.values(themes).forEach((theme) => {
  console.log(`\n📦 ${theme.label}`)
  console.log(`   Type: ${theme.type}`)
  console.log(`   Name: ${theme.name}`)
  console.log(`   Description: ${theme.description}`)
  console.log(`   Radius: ${theme.cssVars.radius}`)
})

console.log('\n' + '='.repeat(60))
console.log(`Total themes: ${Object.keys(themes).length}`)
console.log(`Light themes: ${Object.values(themes).filter(t => t.type === 'light').length}`)
console.log(`Dark themes: ${Object.values(themes).filter(t => t.type === 'dark').length}`)
console.log('='.repeat(60))
