const fs = require("fs");
const path = require("path");

function getAllKeys(obj, prefix = "") {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const messagesDir = path.join(__dirname, "..", "messages");
const en = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"));
const enKeys = getAllKeys(en);

console.log("Total English keys:", enKeys.length);

const langs = ["fr", "vi", "de", "es", "ja", "ko", "ru", "zh", "th", "ms", "id"];
let allComplete = true;

langs.forEach((lang) => {
  const langFile = JSON.parse(
    fs.readFileSync(path.join(messagesDir, `${lang}.json`), "utf8")
  );
  const langKeys = getAllKeys(langFile);
  const missing = enKeys.filter((k) => !langKeys.includes(k));

  if (missing.length > 0) {
    allComplete = false;
    console.log(`\n${lang.toUpperCase()}: ${langKeys.length} keys`);
    console.log(`  Missing (${missing.length}):`);
    missing.slice(0, 10).forEach((k) => console.log("    - " + k));
    if (missing.length > 10)
      console.log("    ... and " + (missing.length - 10) + " more");
  }
});

if (allComplete) {
  console.log("\n✓ All 11 language files have complete translations!");
  console.log("  Each file contains", enKeys.length, "translation keys.");
}
