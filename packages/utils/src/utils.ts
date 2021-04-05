import nacl from "@toruslabs/tweetnacl-js";
import base64urlLib from "base64url";
import keccakLib from "keccak";

export type SECP256K1KeyType = "secp256k1";
export type ED25519KeyType = "ed25519";

export type SECP256K1Key = Buffer;
export type ED25519Key = Buffer;

const l = (nacl as any).lowlevel;

export function getED25519Key(
  privateKey: string | Buffer
): {
  sk: Buffer;
  pk: Buffer;
} {
  let privKey: Buffer;
  if (typeof privateKey === "string") {
    privKey = Buffer.from(privateKey, "hex");
  } else {
    privKey = privateKey;
  }
  // Implementation copied from tweetnacl

  const d = new Uint8Array(64);
  const sk = new Uint8Array([...new Uint8Array(privKey), ...new Uint8Array(32)]);
  const pk = new Uint8Array(32);
  const p = [l.gf(), l.gf(), l.gf(), l.gf()];
  for (let i = 0; i < 32; i += 1) d[i] = sk[i];
  // eslint-disable-next-line no-bitwise
  d[0] &= 248;
  // eslint-disable-next-line no-bitwise
  d[31] &= 127;
  // eslint-disable-next-line no-bitwise
  d[31] |= 64;
  l.scalarbase(p, d);
  l.pack(pk, p);
  for (let i = 0; i < 32; i += 1) sk[i + 32] = pk[i];

  return { sk: Buffer.from(sk), pk: Buffer.from(pk) };
}

export const keccak = keccakLib;

export type BufferEncoding = "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex";

export const base64url = base64urlLib;

export function base64toJSON(b64str: string): Record<string, unknown> {
  return JSON.parse(base64url.decode(b64str));
}

export function jsonToBase64(json: Record<string, unknown>): string {
  return base64url.encode(JSON.stringify(json));
}

// TODO: not all of the options are implemented
export interface BaseLoginOptions {
  /**
   * - `'page'`: displays the UI with a full page view
   * - `'popup'`: displays the UI with a popup window
   * - `'touch'`: displays the UI in a way that leverages a touch interface
   * - `'wap'`: displays the UI with a "feature phone" type interface
   */
  display?: "page" | "popup" | "touch" | "wap" | string;
  /**
   * - `'none'`: do not prompt user for login or consent on reauthentication
   * - `'login'`: prompt user for reauthentication
   * - `'consent'`: prompt user for consent before processing request
   * - `'select_account'`: prompt user to select an account
   */
  prompt?: "none" | "login" | "consent" | "select_account" | string;
  /**
   * Maximum allowable elasped time (in seconds) since authentication.
   * If the last time the user authenticated is greater than this value,
   * the user must be reauthenticated.
   */
  max_age?: string | number;
  /**
   * The space-separated list of language tags, ordered by preference.
   * For example: `'fr-CA fr en'`.
   */
  ui_locales?: string;
  /**
   * Previously issued ID Token.
   */
  id_token_hint?: string;
  /**
   * The user's email address or other identifier. When your app knows
   * which user is trying to authenticate, you can provide this parameter
   * to pre-fill the email box or select the right session for sign-in.
   *
   * This currently only affects the classic Lock experience.
   */
  login_hint?: string;
  acr_values?: string;
  /**
   * The default scope to be used on authentication requests.
   * The defaultScope defined in the Auth0Client is included
   * along with this scope
   */
  scope?: string;
  /**
   * The default audience to be used for requesting API access.
   */
  audience?: string;
  /**
   * The name of the connection configured for your application.
   * If null, it will redirect to the Auth0 Login Page and show
   * the Login Widget.
   */
  connection?: string;

  /**
   * If you need to send custom parameters to the Authorization Server,
   * make sure to use the original parameter name.
   */
  [key: string]: unknown;
}

export interface ExtraLoginOptions extends BaseLoginOptions {
  /**
   * Your Auth0 account domain such as `'example.auth0.com'`,
   * `'example.eu.auth0.com'` or , `'example.mycompany.com'`
   * (when using [custom domains](https://auth0.com/docs/custom-domains))
   */
  domain: string;
  /**
   * The Client ID found on your Application settings page
   */
  client_id?: string;
  /**
   * The default URL where Auth0 will redirect your browser to with
   * the authentication result. It must be whitelisted in
   * the "Allowed Callback URLs" field in your Auth0 Application's
   * settings. If not provided here, it should be provided in the other
   * methods that provide authentication.
   */
  redirect_uri?: string;
  /**
   * The value in seconds used to account for clock skew in JWT expirations.
   * Typically, this value is no more than a minute or two at maximum.
   * Defaults to 60s.
   */
  leeway?: number;
  /**
   * The field in jwt token which maps to verifier id
   */
  verifierIdField?: string;
  /**
   * Whether the verifier id field is case sensitive
   * @default true
   */
  isVerifierIdCaseSensitive?: boolean;
}
