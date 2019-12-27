
const grpc = require('grpc');
const loadDescriptor = require('./definitions')
const HelloService = loadDescriptor('ack.proto').HelloService
const TypeRace = loadDescriptor('typerace.proto').TypeRace

const Jetty = require("jetty");
const screen = new Jetty(process.stdout);



function SayHello(call, callback) {
  const response = { reply: 'Hello ' + call.request.greeting }
  callback(null, response);
}

function SayHellos(call) {
  call.on('data', ({ greeting }) => {
    call.write({ reply: 'Hello ' + greeting })
  })
  call.on('end', () => {
    call.end()
  })
}

const scoreboard = {
  update(racer) {
    const { username } = racer
    const index = this.racers.findIndex(racer => racer.username === username)
    if (~index) {
      this.racers[index] = racer
    } else {
      this.racers.push(racer)
    }
    this.racers.sort(({ strokesPerMinute: strokes1 }, { strokesPerMinute: strokes2 }) => strokes2 - strokes1)
    this.racers = this.racers.slice(0, 10)
  },
  list() {
    return this.racers
  }
}

const createScoreboard = () => {
  return {
    racers: [],
    __proto__: scoreboard
  }
}

const raceScoreboard = createScoreboard()

function SendMetrics(call) {
  call.on('data', (metric) => {
    raceScoreboard.update(metric)
  })
  call.on('end', () => {
    call.end()
  })
}
const GOLD = [212, 175, 55]
const SILVER = [192, 192, 192]
const BRONZE = [205, 127, 50]
const COLORS = [GOLD, SILVER, BRONZE]
setInterval(() => {
  screen.clear()
  raceScoreboard.list().forEach(({ username, strokesPerMinute }, i) => {
    const color = COLORS[i]
    if (color)
      screen.rgb(color)
    screen.moveTo([i, 0]).bold().rgb([212, 175, 55]).text(`#${i + 1} - ${username} => ${strokesPerMinute}`).reset()
  })
}, 1000)

function main() {
  var server = new grpc.Server();
  server.addService(HelloService.service, { SayHello, SayHellos });
  server.addService(TypeRace.service, { SendMetrics });
  server.bind('0.0.0.0:9999', grpc.ServerCredentials.createInsecure());
  server.start();
}

main();