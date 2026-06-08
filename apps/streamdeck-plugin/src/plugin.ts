import streamDeck from "@elgato/streamdeck";
import { allActions } from "./actions";

for (const a of allActions) {
  streamDeck.actions.registerAction(a);
}

await streamDeck.connect();
