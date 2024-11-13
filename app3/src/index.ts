import MarkdownIt from "markdown-it";
import { v4 } from "uuid";

interface Item {
  id: string;
  src: string;
  html: string;
}

const db: Array<Item> = [];

interface Api {
  on(name: string, handler: any): void;
  off(name: string, handler: any): void;
  broadcast(message: any): void;
  sendTo(connectionId: string, message: any): void;
  emit(name: string, message: any): void;
  handle(command: string, handler: any): void;
}

export function setup(api: Api) {
  const md = MarkdownIt();

  api.handle('list-documents', ({ connectionId, correlationId}) => {
    api.sendTo(connectionId, {
      correlationId,
      documents: db.map((item) => item.id),
    });
  });

  api.handle('get-document', ({ connectionId, correlationId, data }) => {
    const { id } = data;
    const document = db.find((m) => m.id === id);

    if (!document) {
      api.sendTo(connectionId, {
        correlationId,
        error: 'Document not found',
      });
    } else {
      api.sendTo(connectionId, {
        correlationId,
        document,
      });
    }
  });

  api.handle('delete-document', ({ connectionId, correlationId, data }) => {
    const { id } = data;
    const index = db.findIndex((m) => m.id === id);

    if (index === -1) {
      api.sendTo(connectionId, {
        correlationId,
        error: 'Document not found',
      });
    } else {
      db.splice(index, 1);
      api.broadcast({
        correlationId,
        type: 'document-deleted',
        documentId: id,
      });
    }
  });

  api.handle('create-document', ({ connectionId, correlationId, data }) => {
    const { src } = data;

    if (!src || typeof src !== "string") {
      api.sendTo(connectionId, {
        correlationId,
        error: 'Expected the "src" field to be a non-empty string.',
      });
    } else {
      const id = v4();
      const html = md.render(src);
      db.push({
        id,
        src,
        html,
      });
      api.broadcast({
        correlationId,
        type: 'document-created',
        documentId: id,
      });
    }
  });
}
