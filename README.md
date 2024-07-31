# Auth SDK by Web3Auth

> [Web3Auth](https://web3auth.io) is where passwordless auth meets non-custodial key infrastructure for Web3 apps and wallets. By aggregating OAuth (Google, Twitter, Discord) logins, different wallets and innovative Multi Party Computation (MPC) - Web3Auth provides a seamless login experience to every user on your application.

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
![npm](https://img.shields.io/npm/dw/@web3auth/auth) |

## Introduction

Your Web3Auth account is a cryptographic key that acts as a proxy to traditional SSOs. Accounts are secured across user devices and authentication methods - there is no central server, no data honey pot.
It combines both [CustomAuth](https://github.com/torusresearch/CustomAuth) and [tKey](https://github.com/tkey/tkey) and provides you with a nice UI and UX flows

## Features

- Typescript compatible. Includes Type definitions

Please refer to docs for API Reference available [here](https://docs.tor.us/open-login/api-reference/installation).

## Installation

### Bundling

Each sub package is distributed in 3 formats

- `esm` build `dist/<MODULE_NAME>.esm.js` in es6 format
- `commonjs` build `dist/<MODULE_NAME>.cjs.js` in es5 format
- `umd` build `dist/<MODULE_NAME>.umd.min.js` in es5 format without polyfilling corejs minified

By default, the appropriate format is used for your specified usecase
You can use a different format (if you know what you're doing) by referencing the correct file

The cjs build is not polyfilled with core-js.
It is upto the user to polyfill based on the browserlist they target

### Directly in Browser

CDN's serve the non-core-js polyfilled version by default. You can use a different

jsdeliver

```js
<script src="https://cdn.jsdelivr.net/npm/<MODULE_NAME>"></script>
```

unpkg

```js
<script src="https://unpkg.com/<MODULE_NAME>"></script>
```

## Build

Ensure you have a `Node.JS` development environment setup:

```
git clone https://github.com/web3auth/auth.git
cd auth
npm i
npm run build
```

To run tests:

```
npm test
```

## Requirements

- This package requires a peer dependency of `@babel/runtime`
- Node 16+
- You will need to whitelist your domain on [developer dashboard](https://dashboard.web3auth.io)

## 💬 Troubleshooting and Discussions

- Have a look at our [GitHub Discussions](https://github.com/Web3Auth/Web3Auth/discussions?discussions_q=sort%3Atop) to see if anyone has any questions or issues you might be having.
- Checkout our [Troubleshooting Documentation Page](https://web3auth.io/docs/troubleshooting) to know the common issues and solutions
- Join our [Discord](https://discord.gg/web3auth) to join our community and get private integration support or help with your integration.

## License

`AuthSdk` is [MIT Licensed](LICENSE)

TODO: fix demo app ci
