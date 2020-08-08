const config = require("./config.js");
const telegram = require("telegram-bot-api");
const SimpleNodeLogger = require("simple-node-logger");
const telegramApi = new telegram({ token: config.telegram.token });
const schedule = require("node-schedule");
const mqtt = require("mqtt");
const _map = _buildMap(config.monitor);

let opts = {
  logFilePath: config.app.logFilePath,
  timestampFormat: "DD/MM/YYYY-HH:mm:ss.SSS >",
};

log = SimpleNodeLogger.createSimpleLogger(opts);
log.setLevel(config.app.logLevel);
log.info("node-mqtt2telegram > starting... broker:", config.broker.address);

for (let t of config.app.schedule) {
  if (t.crontab.length > 0) {
    log.info("node-mqtt2telegram > adding schedule job:", t);
    schedule.scheduleJob(t.crontab, function () {
      _publish(t.title, t.message);
    });
  }
}

let client = mqtt.connect(`mqtt://${config.broker.address}`);
client.on("connect", function () {
  _mqttSubscribe();
  _error("Connected to broker");
});

client.on("message", function (topic, message) {
  message = message.toString();
  if (_map[topic] != undefined) {
    _process(_map[topic], message);
  }
});

client.on("error", function (error) {
  log.error("node-mqtt2telegram > mqtt.error", error);
});

function _mqttSubscribe() {
  for (let i of config.monitor) {
    client.subscribe(i.mqttTopic);
    log.info("node-mqtt2telegram > _mqttSubscribe()", i.mqttTopic);
  }
}

function _publish(title, message) {
  telegramApi
    .sendMessage({
      chat_id: config.telegram.chatId,
      text: `${title}\r\n${message}`,
    })
    .then((e) => {
      log.error("node-mqtt2telegram > _publish(success)", e);
    })
    .catch((e) => {
      log.error("node-mqtt2telegram > _publish(error)", e);
    });
}

function _process(target, message) {
  let _value = message + "";
  if (target.mqttTarget.jsonData == true) {
    let _payload = JSON.parse(message);
    _value = _payload[target.mqttTarget.jsonKey];
    if (_value == undefined) {
      log.error("node-mqtt2telegram > _process(target, message) JSON Key not found!", target, message);
      _error("JSON Key not found!");
    }
  }

  switch (target.mqttTarget.triggerCondition) {
    case "change":
      if (target.mqttTarget.currentValue == _value) {
        log.info("node-mqtt2telegram > _process(target, message) Value not changed!", target, message);
        return;
      }
      log.info("node-mqtt2telegram > _process(currentValue, message) Changed!", target.mqttTarget.currentValue, message);
      break;

    case "always":
    default:
  }

  for (let i of target.mqttTarget.trigger) {
    log.info("node-mqtt2telegram > _process(target, message) Looking for trigger...", i.targetValue, _value);
    if (i.targetValue == _value) {
      log.info("node-mqtt2telegram > _process(target, message) Trigger match!", i.targetValue, _value);
      target.mqttTarget.currentValue = _value;
      i.title = target.mqttTarget.title;
      let _title = _templateProcess(i.title, i);
      let _message = _templateProcess(i.message, i);
      _publish(_title, _message);
      return;
    }
  }
}

function _templateProcess(template, trigger) {
  let _position = _getTemplatePositions(template);
  while (_position.length > 1) {
    let _substr = template.substring(_position[0] + 1, _position[1]);
    switch (_substr) {
      case "TITLE":
        template = template.replace("%TITLE%", trigger.title);
        _position = _getTemplatePositions(template);
        break;

      default:
        break;
    }
  }
  return template;
}

function _getTemplatePositions(template) {
  let _position = [];
  let _index = 0;
  _index = template.indexOf("%", _index);
  while (_index >= 0) {
    _position.push(_index);
    _index = template.indexOf("%", _index + 1);
  }
  return _position;
}

function _buildMap(monitorArray) {
  var map = {};
  for (let i of monitorArray) {
    if (i.mqttTarget.triggerInitialValue != undefined) {
      //OSLL: Internally all parameters will be treat as String
      i.mqttTarget.currentValue = i.mqttTarget.triggerInitialValue + "";
      for (let t of i.mqttTarget.trigger) {
        t.targetValue = t.targetValue + "";
      }
    }
    map[i.mqttTopic] = i;
  }
  return map;
}

function _error(message) {
  _publish(config.app.appTitle, message);
}
