import OBR from "@owlbear-rodeo/sdk";
import { NS } from "./owlbear/layout.js";
import { createBroadcastTokens } from "./owlbear/tokenCreator.js";
import { obrErrorMessage } from "./owlbear/sceneService.js";

export const CREATE_CHANNEL = `${NS}/create`;

function reply(payload) {
  return OBR.broadcast.sendMessage(CREATE_CHANNEL, payload, { destination: "LOCAL" });
}

OBR.onReady(() => {
  OBR.broadcast.onMessage(CREATE_CHANNEL, (message) => {
    const data = message?.data;
    if (data?.type !== "CREATE_TOKENS" || !data.requestId) return;

    void (async () => {
      await reply({ type: "CREATE_TOKENS_ACK", requestId: data.requestId });
      try {
        const count = await createBroadcastTokens(data.tokens);
        await reply({ type: "CREATE_TOKENS_RESULT", requestId: data.requestId, ok: true, count });
      } catch (error) {
        await reply({
          type: "CREATE_TOKENS_RESULT",
          requestId: data.requestId,
          ok: false,
          error: obrErrorMessage(error) || "Unable to create tokens.",
        });
      }
    })();
  });
});
