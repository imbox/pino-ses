const assert = require('assert')
const build = require('pino-abstract-transport')
const aws = require('@aws-sdk/client-ses')
const { defaultProvider } = require('@aws-sdk/credential-provider-node')
const nodemailer = require('nodemailer')

const LEVELS = {
  default: 'USERLVL',
  60: 'FATAL',
  50: 'ERROR',
  40: 'WARN',
  30: 'INFO',
  20: 'DEBUG',
  10: 'TRACE'
}

function createSubject (obj) {
  let str = `[${LEVELS[obj.level]}] ${obj.name}`
  if (obj.ip) {
    str += ` on ${obj.ip}`
  } else {
    str += ` on ${obj.hostname}`
  }
  return str
}

function createBody (obj) {
  let str =
    `* name: ${obj.name}\n` +
    `* hostname: ${obj.hostname}\n` +
    `* pid: ${obj.pid}\n` +
    `* time: ${new Date(obj.time).toISOString()}\n`
  if (obj.ip) str += `* ip: ${obj.ip}\n`
  if (obj.stack) {
    str += `* msg: ${obj.stack}\n`
  } else {
    str += `* msg: ${obj.msg}\n`
  }
  return str
}

module.exports = opts => {
  assert(opts.to, 'to required')
  assert(opts.from, 'from required')

  const sesOptions = {
    apiVersion: '2010-12-01',
    region: opts.region || 'eu-west-1'
  }

  if (opts.accessKeyId) {
    sesOptions.accessKeyId = opts.accessKeyId
    sesOptions.secretAccessKey = opts.secretAccessKey
  } else {
    sesOptions.defaultProvider = defaultProvider
  }

  const emailTransport = nodemailer.createTransport({
    SES: {
      ses: new aws.SES(sesOptions),
      aws
    }
  })

  return build(async function (source) {
    for await (let obj of source) {
      console.log('send something!', obj)
      try {
      await emailTransport.sendMail({
        to: opts.to,
        from: opts.from,
        subject: opts.subject || createSubject(obj),
        text: createBody(obj)
      })
    } catch (err) {
      console.log('err', err)
    }
      console.log('email sent!')
    }
  })
}
