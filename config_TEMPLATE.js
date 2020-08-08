/*******************************************************
 * RENAME THIS FILE TO "config.js"
 *******************************************************/
module.exports = {
  broker: {
    /* => MQTT broker connection configuration */
    port: 1883,
    address: "127.0.0.1",
  },

  mqtt: {
    /* => MQTT messages configuration */
    options: {
      qos: 1,
      retain: true,
      dup: false,
    },
  },

  app: {
    appTitle: "mqtt2telegram:" /* Default title for application-generated messages */,
    schedule: [
      /*  => CRONTAB style jobs on 'schedule.crontab' member entries. These entries are useful to have a peridiodicall 'keep-alive' system verification messages.
        
        *    *    *    *    *    *
        ┬    ┬    ┬    ┬    ┬    ┬
        │    │    │    │    │    │
        │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
        │    │    │    │    └───── month (1 - 12)
        │    │    │    └────────── day of month (1 - 31)
        │    │    └─────────────── hour (0 - 23)
        │    └──────────────────── minute (0 - 59)
        └───────────────────────── second (0 - 59, OPTIONAL)        

        */
      {
        crontab: "00 12 * * *",
        message: "12:00 Keep-Alive" /* Message to be sent to Telegram Chat */,
        title: "Crontab:" /* Title for the message on this MQTT Topic */,
      },
    ],
    logFilePath: "app.log" /* Name for application log file */,
    logLevel: "info" /* 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' => See "https://www.npmjs.com/package/simple-node-logger" for details. */,
  },

  telegram: {
    /* => TELEGRAM messenger chat configuration
     */
    token: "telegram-http-token-api-here" /* Obtained when creating new chatbot with command "/newbot" in BotFather Chat */,
    chatId: "telegram-chat-id-here" /* Chat ID string format "-XXXXXXXXX" */,
  },

  monitor: [
    /* => MQTT topic triggers */
    {
      /* => SIMPLE VALUE PAYLOADS */
      mqttTopic: "simple_device/button/one" /* MQTT Topic to subscribe */,
      /* => MQTT topic configuration */
      mqttTarget: {
        jsonData: false /* true | false => defines if payload is JSON type */,
        jsonKey: "keyName" /* For JSON payloads define the JSON key where value is transported, {key: value} => Valid if  'mqttTarget.jsonData === true' */,
        triggerInitialValue:
          "default" /* Initial 'trigger.targetValue' => Set to not valid value to ensure first update will launch the notification if mqttTarget.triggerCondition is set as 'change' */,
        triggerCondition:
          "change" /* 'change' | 'always' => Defines condition to perform the notification; 'change' refers to last received value (or mqttTarget.triggerInitialValue), 'always' will notify on every 'mqttTopic' reception */,
        /* => PAYLOAD TRIGGER VALUES */
        trigger: [
          {
            targetValue: 0 /* Trigger value */,
            message: "VALUE ZERO" /* Message to be sent to Telegram Chat */,
          },
          {
            targetValue: 1,
            message: "VALUE ONE",
          },
        ],
        title: "Button_1:" /* Title for the message on this MQTT Topic */,
      },
    },
    {
      /* => JSON VALUE PAYLOADS */
      mqttTopic: "json_device/switch/data" /* MQTT Topic to subscribe */,
      /* => MQTT topic configuration */
      mqttTarget: {
        jsonData: true /* true | false => defines if payload is JSON type */,
        jsonKey:
          "switch_state" /* For JSON payloads define the JSON key where value is transported, {key: value} => Valid if  'mqttTarget.jsonData === true' */,
        triggerInitialValue:
          "default" /* Initial 'trigger.targetValue' => Set to not valid value to ensure first update will launch the notification if mqttTarget.triggerCondition is set as 'change' */,
        triggerCondition:
          "change" /* 'change' | 'always' => Defines condition to perform the notification; 'change' refers to last received value (or mqttTarget.triggerInitialValue), 'always' will notify on every 'mqttTopic' reception */,
        trigger: [
          {
            targetValue: "ON" /* Trigger value */,
            message: "SWITCH ON" /* Message to be sent to Telegram Chat */,
          },
          {
            targetValue: "OFF",
            message: "SWITCH OFF",
          },
        ],
        title: "Switch_1:",
      },
    },
  ],
};
