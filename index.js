const AWS = require("aws-sdk");
const Transform = require('stream').Transform;
const async = require('async');

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

  getTopicArn(topicName) {
    return `arn:aws:sns:us-east-1:117232195543:${topicName}`;
  }

  getTopicAttributes(topicName) {
    return new Promise( (resolve, reject) => {
      const topicArn = this.getTopicArn(topicName);
      const params = {
        TopicArn: topicArn
      }

      this.sns.getTopicAttributes(params, (err, data) => {
        if (err) {
          console.log(err);
          return reject(err);
        }

        return resolve(data.Attributes);
      } );
    });
  }

  createIfNotExists(topicName, displayName, policy, ) { //Idempotent function only creates a topic if not exists
    return new Promise( (resolve, reject) => {
      const params = {
        Name: topicName,
        Attributes: {
          DisplayName: displayName,
          Policy: JSON.stringify(policy)
        }
      }

      this.sns.createTopic(params, (err, data) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        return resolve(data);
      })
    });
  }

  subscribeToTopic(topicName, protocol, endpoint, filterPolicy) {
    return new Promise( (resolve, reject) => {
      const params = {
        Protocol: protocol, /* required */
        TopicArn: this.getTopicArn(topicName), /* required */
        Endpoint: endpoint
      }

      if (filterPolicy)
      params.Attributes = {
        'FilterPolicy': filterPolicy,
      }


      this.sns.subscribe(params, (err, data) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        return resolve(data);
      })
    });
  }

  getSubscriptions() {
    return new Promise(function(resolve, reject) {
      const params = {};

      this.sns.listSubscriptions(params, (err, data) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        async.map(data.Subscriptions, (s, cb) => {
          const getSubAttParams = {
            SubscriptionArn: s.SubscriptionArn
          }
          this.sns.getSubscriptionAttributes(getSubAttParams, (err, data) => {
            if (err) {
              console.log(err);
              return cb(err);
            }
            var ret = Object.assign({},s);
            ret.FilterPolicy = data.FilterPolicy;
            cb(null,ret);
          })
        }, (err, results) => {
          if (err) {
            console.log(err);
            return reject(err);
          }
          var topics = {};
          const topicArnRegex = /(arn):(aws):(.*):(.*):(.*):(.*)/;
          data.ForEach( (d) => {
            const topicNameParts = topicArnRegex.exec(d.TopicArn);
            const topicName = parsed[6];
            if (!topics[topicName]) topics[topicName] = [];
            topics[topicName].push(d);
          })
          return resolve(topics);
        })
      });
    });
  }
}

module.exports = SNSClient;
