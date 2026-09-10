# @imbox/pino-ses
Pino plugin to send email to AWS SES

## Installation
This package is published to the [GitHub Packages](https://docs.github.com/en/packages) registry,
so npm needs to be told where to find the `@imbox` scope. Add this to the `.npmrc` of your project:

```
@imbox:registry=https://npm.pkg.github.com
```

GitHub Packages requires authentication for npm installs,
so authenticate with a GitHub personal access token that has the `read:packages` scope, either by
running `npm login --scope=@imbox --registry=https://npm.pkg.github.com` or by adding the token to
your user level `~/.npmrc`:

```
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Then install as usual:

```bash
$ npm install @imbox/pino-ses
```
