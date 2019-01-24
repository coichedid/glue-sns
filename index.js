const AWS = require("aws-sdk");
const Transform = require('stream').Transform;

class SNSError {
  constructor(message, code) {
    this.message = message;
    this.code = code
  }
  toString() {
    return `Error ${this.code}: ${this.message}`;
  }
}

class SNSClient {
  constructor(awsRegion) {
    this.region = awsRegion;
    AWS.config.update({region:awsRegion});
    this.sns = new AWS.SNS();
  }

  sendMessage(message, attributes, topicName) {
    return new Promise( (resolve, reject) => {
      var processingEvent = JSON.stringify(message);
      var params = {
        Message: processingEvent,
        Subject: 'Message simulation',
        TopicArn: topicName,
        MessageAttributes: attributes
      }
      this.sns.publish(params, (err, data) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        return resolve();
      });
    });
  }
}

module.exports = SNSClient;
