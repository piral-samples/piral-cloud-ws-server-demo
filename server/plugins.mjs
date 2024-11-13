import { WebSocket } from "ws";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";
import { on, off, broadcast, sendTo, emit } from "./events.mjs";

const feed = "https://feed.dev.piral.cloud/api/v1/pilet/reactive-server-demo";
const changeEventTypes = ["add-pilet", "update-pilet", "remove-pilet"];
const current = [];

async function linkNodeModule(specifier, context) {
  const content = await import(specifier);
  const exports = Object.keys(content);
  return new SyntheticModule(
    exports,
    function () {
      for (const name of exports) {
        this.setExport(name, content[name]);
      }
    },
    {
      context,
    }
  );
}

async function linkModule(url, context) {
  const res = await fetch(url);
  const content = await res.text();
  const mod = new SourceTextModule(content, {
    context,
  });
  await mod.link((specifier) => {
    if (specifier.startsWith("node:")) {
      return linkNodeModule(specifier, context);
    }

    const newUrl = new URL(specifier, url);
    return linkModule(newUrl.href, context);
  });
  await mod.evaluate();
  return mod;
}

async function loadModule(url) {
  const context = createContext();

  try {
    const res = await linkModule(url, context);
    return res.namespace;
  } catch (ex) {
    console.warn(`Failed to evaluate "${url}":`, ex);
    return {};
  }
}

function makeId(item) {
  return `${item.name}@${item.version}`;
}

async function installPlugin(item) {
  const { name, link } = item;
  const { setup, teardown } = await loadModule(link);
  const disposers = [];
  const attach = (name, handler) => {
    disposers.push({ name, handler, dispose: () => off(name, handler) });
    on(name, handler);
  };
  const detach = (name, handler) => {
    const ref = disposers.find(m => m.name === name && m.handler === handler);

    if (ref) {
      ref.dispose(name, handler);
      disposers.splice(disposers.indexOf(ref), 1);
    }
  }; 
  const item = {
    id: makeId(item),
    name,
    api: {
      on: attach,
      off: detach,
      broadcast,
      sendTo,
      emit,
      handle(command, handler) {
        attach(`command:${command}`, handler);
      },
    },
    remove() {
      typeof teardown === 'function' && teardown(item.api);
      current.splice(current.indexOf(item), 1);
      disposers.forEach(({ dispose }) => dispose());
    },
  };
  typeof setup === "function" && setup(item.api);
  current.push(item);
}

function watchPlugins() {
  console.log("Watching plugins ...");
  const ws = new WebSocket(feed.replace("http", "ws"));

  ws.on("error", console.error);

  ws.on("message", async (data) => {
    const msg = JSON.parse(Buffer.from(data).toString("utf8"));

    if (changeEventTypes.includes(msg.type)) {
      const res = await fetch(feed);
      const { items } = await res.json();
      const removeItems = current.filter(
        ({ id }) => !items.some((n) => makeId(n) === id)
      );
      const addItems = items.filter(
        (item) => !current.some(({ id }) => id === makeId(item))
      );

      for (const item of removeItems) {
        item.remove();
      }

      for (const item of addItems) {
        await installPlugin(item);
      }
    }
  });
}

export async function loadPlugins() {
  console.log("Loading plugins ...");
  const res = await fetch(feed);
  const { items } = await res.json();

  for (const item of items) {
    const id = makeId(item);
    console.log(`Integrating plugin "${id}" ...`);
    await installPlugin(item);
    console.log(`Integrated plugin "${id}"!`);
  }

  watchPlugins();
}
