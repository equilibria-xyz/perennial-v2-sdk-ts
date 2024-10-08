export function generateNonce() {
  return BigInt(Date.now())
}
