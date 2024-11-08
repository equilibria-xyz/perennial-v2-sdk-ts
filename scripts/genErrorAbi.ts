/* eslint-disable */
import fs from 'fs'
import path from 'path'

const allAbis = fs.readdirSync(path.join(__dirname, '../src/abi'))

const allErrors: any[] = []
allAbis.forEach((abi) => {
  if (abi === 'AllErrors.abi.ts') return
  const abiPath = path.join(__dirname, `../src/abi/${abi}`)
  const abiRaw = require(abiPath)

  const errors = Object.values(abiRaw)
    .flat()
    .filter((item: any) => item.type === 'error')
    .filter((item: any) => !allErrors.find((err) => err.name === item.name))
  allErrors.push(...errors)
})

const tsCode = `export const AllErrorsAbi = ${JSON.stringify(allErrors)} as const;`
fs.writeFileSync(path.join(__dirname, '../src/abi/AllErrors.abi.ts'), tsCode)
console.log('AllErrors ABI generated')
