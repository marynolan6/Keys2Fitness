// Check the rendered screens, including new routes that have no existing snapshot.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const output = process.argv[2];
const pages = readdirSync(output, { recursive: true, encoding: "utf8" }).map((p) => p.replaceAll("\\", "/")).filter((p) => p.endsWith(".html"));
if (!pages.length) throw new Error(`No exported screens found in ${output}`);
const routingOnly = new Set(["/", "/client/workout", "/_sitemap"]);
const messaging = new Set(["/client/messages", "/coach/messages", "/coach-client/[clientId]/conversation"]);
let checked = 0;
const errors = [];

// React Native Web exports dynamic dimensions inline and shared typography as CSS classes.
function pixels(tag, property, html) {
  const declaration = new RegExp(`(?:^|;)\\s*${property}:\\s*([\\d.]+)px`);
  const inline = declaration.exec(tag.match(/\bstyle="([^"]*)"/)?.[1] ?? "");
  if (inline) return Number(inline[1]);
  const classes = tag.match(/\bclass="([\w -]+)"/)?.[1].split(" ") ?? [];
  for (const name of classes) {
    const rule = new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`).exec(html);
    const value = rule && declaration.exec(rule[1]);
    if (value) return Number(value[1]);
  }
  return 0;
}

for (const page of pages) {
  const route = ("/" + page.slice(0, -5)).replace(/\/index$/, "") || "/";
  if (routingOnly.has(route)) continue;
  checked++;
  const html = readFileSync(join(output, page), "utf8");
  const body = html.split("<body").at(-1)
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  const marks = [...body.matchAll(/<[^>]*\bdata-testid="k2f-(section|welcome)-brand"[^>]*>/g)];
  const fail = (message) => errors.push(`${route}: ${message}`);
  const titles = [...body.matchAll(/<[^>]*\bdata-testid="k2f-page-title"[^>]*>([\s\S]*?)<\//g)];
  if (titles.length !== 1 || !titles[0][0].includes('role="heading"') || !titles[0][1].replace(/<[^>]+>/g, "").trim()) {
    fail("Expected one visible, accessible PageTitle.");
    continue;
  }
  if (messaging.has(route)) {
    if (marks.length) fail("Messaging must use its conversation header without a brand row.");
    continue;
  }
  const welcome = route.startsWith("/auth/");
  const coach = /^\/coach(?:[/-]|$)/.test(route);
  if (marks.length !== 1) { fail(`Expected one K2FBrand; found ${marks.length}.`); continue; }
  const [mark] = marks;
  if (mark[1] !== (welcome ? "welcome" : "section")) fail("Wrong brand variant.");
  if (!mark[0].includes('role="img"') || !mark[0].includes(`aria-label="${coach ? "Keys2Fitness, coach" : "Keys2Fitness"}"`)) fail("Wrong brand accessibility label or role.");
  if (mark.index >= titles[0].index) { fail("Place K2FBrand before PageTitle."); continue; }
  const beforeHeading = body.slice(mark.index + mark[0].length, titles[0].index);
  const logo = beforeHeading.match(/<[^>]*\bdata-testid="k2f-logo"[^>]*>/)?.[0];
  const word = beforeHeading.match(/(<[^>]*\bdata-testid="k2f-wordmark"[^>]*>)([\s\S]*?)<\//);
  if (!logo) fail("Missing logo before the page heading.");
  const wordmark = word?.[2].replace(/<!--.*?-->/gs, "").trim();
  const expected = welcome ? /^Keys2Fitness$/ : coach ? /^KEYS2FITNESS\s+\/?\s*COACH$/ : /^KEYS2FITNESS$/;
  if (!wordmark || !expected.test(wordmark)) fail("Wrong visible wordmark before the page heading.");
  if (!welcome && logo && word && (pixels(logo, "width", html) < 40 || pixels(logo, "height", html) < 40 || pixels(word[1], "font-size", html) < 18)) {
    fail("Section header is undersized: use at least a 40 dp logo and an 18 sp base wordmark.");
  }
}
if (!checked || errors.length) throw new Error(errors.join("\n") || "No content screens checked.");
console.log(`Brand and heading checks passed on ${checked} exported screens.`);
