'use strict'
const { SESv2Client } = require('@aws-sdk/client-sesv2')
const { test } = require('node:test')
const pinoSes = require('../pino-ses')

test('processes a log and emails it', async t => {
  const now = Date.UTC(2026, 0, 1, 12, 0, 0)
  t.mock.timers.enable({ apis: ['Date'], now })

  let onSent
  const sent = new Promise(resolve => { onSent = resolve })
  const send = t.mock.method(SESv2Client.prototype, 'send', async () => {
    onSent()
    return { MessageId: 'test-message-id' }
  })

  const transport = pinoSes({ to: 'to@example.com', from: 'from@example.com' })

  transport.write(
    JSON.stringify({
      level: 60,
      time: Date.now(),
      name: 'test-app',
      hostname: 'test-host',
      pid: 4242,
      msg: 'something went wrong'
    }) + '\n'
  )
  await sent

  t.assert.equal(send.mock.callCount(), 1)

  const { input } = send.mock.calls[0].arguments[0]
  const mail = input.Content.Raw.Data.toString()

  const [, messageId] = mail.match(/^Message-ID: <([0-9a-f-]+)@example\.com>$/m)

  t.assert.deepStrictEqual(mail.split('\r\n'), [
    'From: from@example.com',
    'To: to@example.com',
    'Subject: [FATAL] test-app on test-host',
    `Message-ID: <${messageId}@example.com>`,
    'Content-Transfer-Encoding: 7bit',
    'Date: Thu, 01 Jan 2026 12:00:00 +0000',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    '* name: test-app',
    '* hostname: test-host',
    '* pid: 4242',
    '* time: 2026-01-01T12:00:00.000Z',
    '* msg: something went wrong',
    ''
  ])
})
