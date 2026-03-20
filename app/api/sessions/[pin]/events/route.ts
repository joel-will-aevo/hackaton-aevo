import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcast, addClient, removeClient } from "@/lib/sse";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  const clientId = request.headers.get("x-client-id") || crypto.randomUUID();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      addClient(pin, clientId, controller);

      controller.enqueue(
        encoder.encode(`event: connected\ndata: {"clientId":"${clientId}"}\n\n`)
      );

      const sendPing = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(sendPing);
        }
      }, 30000);

      request.signal.addEventListener("abort", () => {
        clearInterval(sendPing);
        removeClient(pin, clientId);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Client-Id": clientId,
    },
  });
}
