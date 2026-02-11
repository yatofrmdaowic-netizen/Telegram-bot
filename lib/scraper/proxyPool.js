const proxies = process.env.PROXIES
  ? process.env.PROXIES.split(",")
  : [];

let index = 0;

export function getProxy() {
  if (!proxies.length) return null;
  const proxy = proxies[index % proxies.length];
  index++;
  return proxy;
}
