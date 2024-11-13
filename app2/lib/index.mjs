import { compute } from "./other.mjs";

export function setup(api) {
  api.handle("compute", ({ connectionId, correlationId, data }) => {
    const { a, b } = data;

    // simulate async computation
    setTimeout(() => {
      const result = compute(+a, +b);

      if (!isNaN(result)) {
        api.sendTo(connectionId, {
          correlationId,
          result,
        });
      } else {
        api.sendTo(connectionId, {
          correlationId,
          error: `Only numbers allowed.`,
        });
      }
    }, 2000);
  });
}
