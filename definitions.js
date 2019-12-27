

const path = require('path')
path.join(__dirname, './grpc/typerace.proto')

var PROTO_BASE_PATH = 'grpc/';
var protoLoader = require('@grpc/proto-loader');
const grpc = require('grpc');

const loadDescriptor = (packageName) => {
  const packageDefinition = protoLoader.loadSync(
    PROTO_BASE_PATH + packageName,
    {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    });
  return grpc.loadPackageDefinition(packageDefinition)
}

module.exports = loadDescriptor
