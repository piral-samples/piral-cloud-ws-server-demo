[![Piral Logo](https://github.com/smapiot/piral/raw/develop/docs/assets/logo.png)](https://piral.io)

# [Piral Cloud Sample](https://piral.cloud) &middot; [![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/smapiot/piral/blob/main/LICENSE) [![Gitter Chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/piral-io/community)

> Sample project to illustrate a plugin discovery with a custom WebSocket server.

:zap: Use the Piral Feed Service for plugin discovery - creating an extensible reactive WebSocket server.

Feel free to play around with the code using StackBlitz.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/piral-samples/piral-cloud-ws-server-demo)

## Example Flow

Let's say you start a quick session:

```js
const ws = new WebSocket('ws://localhost:3000');
ws.onmessage = (e) => {
  console.log(JSON.parse(e.data));
};
ws.send(JSON.stringify({ type: 'foo' })); // response will be from app1: "Hello from app1 v2: foo"
ws.send(JSON.stringify({ type: 'compute', a: 5, b: 8, correlationId: 'abcdef' })); ; // response will be from app2: -39 (incl. the correlationId)
ws.send(JSON.stringify({ type: 'list-documents' })); // also check out create-document and delete-document; they all come from app3
```

Only the `type` and `correlationId` fields are given. All others are dynamically passed to the command handlers.

## License

Piral and this sample code is released using the MIT license. For more information see the [license file](./LICENSE).
