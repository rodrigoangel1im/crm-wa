const fs = require("fs");
const content = fs.readFileSync("src/pages/AdicionarContrato/AdicionarContrato.jsx", "utf8");
const lines = content.split("\n");
lines.forEach((line, i) => {
  const count = (line.match(/`/g) || []).length;
  if (count % 2 !== 0) console.log("Odd backticks at line " + (i+1));
});
const opens = (content.match(/\x7b/g) || []).length;
const closes = (content.match(/\x7d/g) || []).length;
console.log("{ count: " + opens + ", } count: " + closes);
const popen = (content.match(/\(/g) || []).length;
const pclose = (content.match(/\)/g) || []).length;
console.log("( count: " + popen + ", ) count: " + pclose);
const lbracket = (content.match(/\[/g) || []).length;
const rbracket = (content.match(/\]/g) || []).length;
console.log("[ count: " + lbracket + ", ] count: " + rbracket);
