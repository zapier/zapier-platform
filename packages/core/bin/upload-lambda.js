#!/usr/bin/env node

var fs = require('fs');
var AWS = require('aws-sdk');

console.log('Uploading zip to test Lambda.');

// run it in real lambda...
var lambda = new AWS.Lambda({ apiVersion: '2015-03-31', region: 'us-east-1' });
var fileName = process.argv.slice(2)[0];
var zipFileLambda = fs.readFileSync(fileName);
console.log(zipFileLambda.length, 'bytes of code');

var params = {
  Code: {
    ZipFile: zipFileLambda,
  },
  FunctionName: 'integration-test-cli',
  Handler: 'index.integrationTestHandler',
  Role: 'arn:aws:iam::996097627176:role/allow_nothing_role',
  Runtime: 'nodejs8.10',
  Description: 'Via node ./lambda-upload.js for dev-platform-cli.',
  MemorySize: 512,
  Timeout: 30,
};

// lambda.createFunction(
//   params,
lambda.updateFunctionCode(
  { FunctionName: params.FunctionName, ZipFile: params.Code.ZipFile },
  (err, data) => {
    console.log('update code:');
    if (err) {
      console.log(err, err.stack); // an error occurred
    } else {
      console.log(data); // successful response
      console.log('Now you can try `npm run lambda-integration-test`.');
    }
  },
);
