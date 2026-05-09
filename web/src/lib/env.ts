/** クライアント・サーバー共通で参照する環境変数の収集口（必要に応じて拡張）。 */
export function getPublicEnv(key: `NEXT_PUBLIC_${string}`): string | undefined {
  if (typeof process === 'undefined' || !process.env) {
    return undefined;
  }
  return process.env[key];
}
