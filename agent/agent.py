#!/usr/bin/env python3
"""
Fuxem Host — LiveKit text chat bot
Joins the Members Lounge, greets newcomers, and responds to messages via Groq.
"""

import asyncio
import json
import logging
import os
import random
import uuid
from datetime import datetime

import httpx
from dotenv import load_dotenv
from livekit import api, rtc

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

LIVEKIT_URL       = os.environ["LIVEKIT_URL"]
LIVEKIT_API_KEY   = os.environ["LIVEKIT_API_KEY"]
LIVEKIT_API_SECRET = os.environ["LIVEKIT_API_SECRET"]
GROQ_API_KEY      = os.environ["GROQ_API_KEY"]
ROOM_NAME         = os.environ.get("LIVEKIT_ROOM_NAME", "members-lounge")

BOT_IDENTITY = "fuxem-host"
BOT_NAME     = "Fuxem Host 💋"

SYSTEM_PROMPT = (
    "You are Fuxem Host, the flirty, welcoming host of the Fuxem Members Lounge — "
    "an invite-only adult social platform for crossdressers and their admirers. "
    "You are warm, playful, and a little cheeky. Keep every response to 1-2 sentences max. "
    "Help members feel welcome and answer questions about the platform. "
    "Never be explicit — just flirty and fun. Always stay in character."
)

GREETINGS = [
    "Well hello there, gorgeous 💋 Welcome to the lounge!",
    "Ooh, a new face! Welcome to Fuxem, darling 🌸",
    "Hey hot stuff, glad you made it 💜 Make yourself comfortable!",
    "Welcome to the lounge, beautiful! Don't be shy 😘",
    "Look who just walked in! Hey honey, welcome 🔥",
]


def make_bot_token() -> str:
    token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
    token.with_identity(BOT_IDENTITY)
    token.with_name(BOT_NAME)
    token.with_grants(api.VideoGrants(
        room_join=True,
        room=ROOM_NAME,
        can_publish_data=True,
    ))
    return token.to_jwt()


async def ask_groq(user_message: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                "max_tokens": 120,
                "temperature": 0.9,
            },
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()


def make_message(text: str) -> bytes:
    msg = {
        "id": str(uuid.uuid4()),
        "senderId": BOT_IDENTITY,
        "senderName": BOT_NAME,
        "text": text,
        "sentAt": int(datetime.now().timestamp() * 1000),
    }
    return json.dumps(msg).encode()


async def main():
    room = rtc.Room()

    async def send_greeting(display_name: str) -> None:
        await asyncio.sleep(1.5)  # small natural pause
        greeting = random.choice(GREETINGS)
        await room.local_participant.publish_data(make_message(greeting), reliable=True)
        logger.info(f"Greeted {display_name}")

    async def handle_message(data_packet: rtc.DataPacket) -> None:
        try:
            raw = json.loads(data_packet.data.decode())
            text: str = raw.get("text", "")
            sender_id: str = raw.get("senderId", "")
            sender_name: str = raw.get("senderName", "someone")

            # Never respond to self
            if sender_id == BOT_IDENTITY:
                return

            # Only respond if mentioned or message is a question
            lower = text.lower()
            if "fuxem" not in lower and "host" not in lower and "?" not in text:
                return

            logger.info(f"Responding to {sender_name}: {text}")
            reply = await ask_groq(f"{sender_name} says: {text}")
            await room.local_participant.publish_data(make_message(reply), reliable=True)
        except Exception as exc:
            logger.error(f"Error handling message: {exc}")

    @room.on("participant_connected")
    def on_participant_connected(participant: rtc.RemoteParticipant) -> None:
        logger.info(f"Participant joined: {participant.identity}")
        asyncio.ensure_future(send_greeting(participant.name or participant.identity))

    @room.on("data_received")
    def on_data_received(data_packet: rtc.DataPacket) -> None:
        asyncio.ensure_future(handle_message(data_packet))

    @room.on("disconnected")
    def on_disconnected(reason: str) -> None:
        logger.warning(f"Disconnected: {reason} — reconnecting in 5s...")
        asyncio.ensure_future(reconnect())

    async def reconnect() -> None:
        await asyncio.sleep(5)
        token = make_bot_token()
        await room.connect(LIVEKIT_URL, token)
        logger.info("Reconnected!")

    token = make_bot_token()
    logger.info(f"Connecting to {LIVEKIT_URL}, room={ROOM_NAME}...")
    await room.connect(LIVEKIT_URL, token)
    logger.info(f"Fuxem Host is live in the lounge!")

    # Run forever
    await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
