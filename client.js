
const ARGS = process.argv.slice(2);
const NAME = ARGS[0]
if (!NAME)
  throw new Error('Name is missing')

const grpc = require('grpc');
const loadDescriptor = require('./definitions')
const TypeRace = loadDescriptor('typerace.proto').TypeRace

const Jetty = require("jetty");
const screen = new Jetty(process.stdout);

const AVG_COUNT = 20

const readline = require('readline');

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

let words = []

process.stdin.on('keypress', (str) => {
  if (str === '\u0003') {
    process.exit()
  } else {
    words.push(str)
  }
})

const metric = {
  add(strokes) {
    const strokesPerMinute = strokes * this.interval * 60
    this.strokes.unshift(strokesPerMinute)
  },
  get() {
    this.strokes = this.strokes.slice(0, this.speedGradient)
    const roundAvg = (numbers) => {
      const sum = numbers.reduce((acc, spm) => acc + spm, 0)
      return (sum / numbers.length) | 0
    }
    return Math.max(roundAvg(this.strokes), roundAvg(this.strokes.slice(0, this.speedGradient / 4)))
  }
}

const createMetric = () => {
  return {
    speedGradient: AVG_COUNT,
    interval: 2,
    strokes: [],
    __proto__: metric
  }
}

const player = {
  metrics: createMetric(),
  name: NAME
}

setInterval(() => {
  const keysSoFar = words.length
  player.metrics.add(keysSoFar)
  words = []
  const spm = player.metrics.get()
}, 500)

setInterval(() => {
  screen.clear()
  screen.moveTo([0, 0]).bold().text(player.name).reset()
  screen.moveTo([1, 0]).text(player.metrics.get() + ' spm')
}, 500)



/*
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', function (line) {
  console.log(line);
})
*/

const client = new TypeRace("192.168.1.97:9999", grpc.credentials.createInsecure());

/*
client.SayHello({ greeting: "Erwin" }, (error, r) => {
  console.log(r)
})
*/

const call = client.SendMetrics()
let count = 0
call.on('data', ({ reply }) => {
  count++
  console.log(`Msg #${count}: ${reply}`)
})

setInterval(() => call.write({ username: player.name, strokesPerMinute: player.metrics.get() }), 1000)

