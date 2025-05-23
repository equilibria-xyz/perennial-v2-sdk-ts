/* eslint-disable */
import fs from 'fs'
import path from 'path'

const allAbis = fs.readdirSync(path.join(__dirname, '../src/abi'))

const allEvents: any[] = []
allAbis.forEach((abi) => {
  if (abi === 'AllEvents.abi.ts') return
  const abiPath = path.join(__dirname, `../src/abi/${abi}`)
  const abiRaw = require(abiPath)

  const events = Object.values(abiRaw)
    .flat()
    .filter((item: any) => item.type === 'event')
    .filter((item: any) => !allEvents.find((ev) => ev.name === item.name))
  allEvents.push(...events)
})

const tsCode = `export const AllEventsAbi = ${JSON.stringify(allEvents)} as const;`
fs.writeFileSync(path.join(__dirname, '../src/abi/AllEvents.abi.ts'), tsCode)
console.log('AllEvents ABI generated')
