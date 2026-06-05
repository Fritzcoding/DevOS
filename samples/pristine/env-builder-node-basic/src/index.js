export function message() {
  return "env-builder sample ok";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(message());
}
