#!/usr/bin/env node
const args = require('args')
const SES = require('aws-sdk/clients/ses')
const nodemailer = require('nodemailer')
const split = require('split2')
const { pipeline, Transform } = require('stream')

args
  .option('env', 'send email for specific NODE_ENV')
  .option('to', 'Email recipient')
  .option('from', 'Email sender')
  .option('subject', 'Email subject')
  .option('region', 'AWS SES region', 'eu-west-1')
  .option('access-key-id', 'AWS access key id')
  .option('secret-access-key', 'AWS secret access key')

const opts = args.parse(process.argv)

if (!opts.to || !opts.from) {
  args.showHelp()
  process.exit(0)
}

const emailTransport = nodemailer.createTransport({
  SES: new SES({
    apiVersion: '2010-12-01',
    accessKeyId: opts['access-key-id'],
    secretAccessKey: opts['secret-access-key'],
    region: opts.region
  })
})

const transport = new Transform({
  objectMode: true,
  transform (chunk, enc, cb) {
    let obj
    try {
      obj = JSON.parse(chunk)
      if (obj.level === 60) {
        sendEmail(obj)
      }
    } catch (err) {
    } finally {
      cb(null, chunk + '\n')
    }
  }
})

function sendEmail (obj, cb) {
  emailTransport.sendMail(
    {
      to: opts.to,
      from: opts.from,
      subject: opts.subject || createSubject(obj),
      text: createBody(obj)
    },
    err => err && console.error(err)
  )
}

function createSubject (obj) {
  let str = `[FATAL] ${obj.name}`
  if (obj.ip) {
    str += `on ${obj.ip}`
  } else {
    str += `on ${obj.hostname}`
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

function noop () {}

if (!opts.env || opts.env === process.env.NODE_ENV) {
  pipeline(process.stdin, split(), transport, process.stdout, noop)
} else {
  pipeline(process.stdin, process.stdout, noop)
}
