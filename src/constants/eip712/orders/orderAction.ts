export const EIP712_OrderAction = [
  {
    name: 'market',
    type: 'address',
  },
  {
    name: 'orderId',
    type: 'uint256',
  },
  {
    name: 'maxFee',
    type: 'uint256',
  },
  {
    name: 'common',
    type: 'Common',
  },
] as const
