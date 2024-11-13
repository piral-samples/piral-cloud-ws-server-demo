export function setup(api) {
  api.handle("foo", ({ connectionId, correlationId }) => {
    api.sendTo(connectionId, {
      correlationId,
      message: "Hello from app1 v2: foo",
    });
  });
}
