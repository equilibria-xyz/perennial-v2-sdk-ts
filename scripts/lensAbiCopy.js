/* eslint-disable */
const fs = require('fs')
const path = require('path')

const lenses = ['Lens', 'VaultLens']

lenses.forEach((lens) => {
  const lensJsonPath = path.join(__dirname, `../artifacts/contracts/Lens.sol/${lens}.json`)
  const lensJson = JSON.parse(fs.readFileSync(lensJsonPath, 'utf-8'))
  const tsCode = `
    export const ${lens}Abi = ${JSON.stringify(lensJson.abi)} as const;
    export const ${lens}DeployedBytecode = ${JSON.stringify(lensJson.deployedBytecode)} as const;
  `
  const tsFilePath = path.join(__dirname, `../src/abi/${lens}.abi.ts`)
  fs.writeFileSync(tsFilePath, tsCode)
  console.log(`${lens} ABI copied to src/abi/${lens}.abi.ts`)
})
