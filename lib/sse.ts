type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
};

const clients = new Map<string, Set<SSEClient>>();

export function addClient(pin: string, id: string, controller: ReadableStreamDefaultController) {
  if (!clients.has(pin)) {
    clients.set(pin, new Set());
  }
  clients.get(pin)!.add({ id, controller });
}

export function removeClient(pin: string, id: string) {
  const pinClients = clients.get(pin);
  if (pinClients) {
    const client = [...pinClients].find((c) => c.id === id);
    if (client) {
      pinClients.delete(client);
    }
    if (pinClients.size === 0) {
      clients.delete(pin);
    }
  }
}

export function broadcast(pin: string, event: string, data: unknown) {
  const pinClients = clients.get(pin);
  if (pinClients) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);

    pinClients.forEach((client) => {
      try {
        client.controller.enqueue(encoded);
      } catch {
        pinClients.delete(client);
      }
    });
  }
}

export function getClientCount(pin: string): number {
  return clients.get(pin)?.size ?? 0;
}
