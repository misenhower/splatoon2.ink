// Which Cloudflare colo this invocation is running in, for comparing scheduling paths.
// A subrequest to a Cloudflare-fronted host is answered from the local colo, so the
// trace endpoint reports where this Worker's code is executing.
export async function currentColo() {
  try {
    let response = await fetch('https://www.cloudflare.com/cdn-cgi/trace');
    let text = await response.text();
    return text.match(/^colo=(\w+)$/m)?.[1] ?? null;
  } catch {
    return null;
  }
}
