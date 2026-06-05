function greet(name) {
  consol.log("Hello, " + name)
}

const users = ["Ada", "Grace", "Linus"];
users.forEach((user) => greet(user))

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length

consol.log("Average:", average([2, 4, 6]));
