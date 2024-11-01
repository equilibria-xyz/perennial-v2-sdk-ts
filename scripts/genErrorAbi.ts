/* eslint-disable */
import fs from 'fs'
import path from 'path'

const allAbis = fs.readdirSync(path.join(__dirname, '../src/abi'))

const allErrors: any[] = []
allAbis.forEach((abi) => {
  const abiPath = path.join(__dirname, `../src/abi/${abi}`)
  const abiRaw = require(abiPath)

  const errors = Object.values(abiRaw)
    .flat()
    .filter((item: any) => item.type === 'error')
  allErrors.push(...errors)
})

const tsCode = `export const AllErrorsAbi = ${JSON.stringify(allErrors)} as const;`
fs.writeFileSync(path.join(__dirname, '../src/abi/AllErrors.abi.ts'), tsCode)
console.log('AllErrors ABI generated')
