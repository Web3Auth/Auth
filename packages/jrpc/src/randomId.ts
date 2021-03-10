// TODO: should be crypto safe
export const randomId = (): number => Math.floor((Math.random() * Number.MAX_SAFE_INTEGER) / 2) + 1;
