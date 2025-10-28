'use strict'
const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2')
const assert = require('node:assert')
const nodemailer = require('nodemailer')
const build = require('pino-abstract-transport')

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

  const emailTransport = nodemailer.createTransport({
    SES: {
      sesClient: new SESv2Client({
        accessKeyId: opts.accessKeyId,
        secretAccessKey: opts.secretAccessKey,
        region: opts.region || 'eu-west-1'
      }),
      SendEmailCommand
    }
  })

  return build(async function (source) {
    for await (const obj of source) {
      try {
        await emailTransport.sendMail({
          to: opts.to,
          from: opts.from,
          subject: opts.subject || createSubject(obj),
          text: createBody(obj)
        })
      } catch (err) {
        console.error(err)
      }
    }
  })
}
