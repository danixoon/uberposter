import * as _ from "lodash";
import * as dotenv from "dotenv";
import * as yargs from "yargs";
import { VK } from "vk-io";

const DEFAULT_PEER_ID = 148520186;
const PEER_ID = "peerId";

dotenv.config();

const { api } = new VK({ token: process.env.TOKEN });

yargs
  .command(
    "test",
    "test command",
    () => {},
    async () => {
      // const albim = "album-159223634_249442248";
      const { count } = await api.photos.get({ owner_id: -34223764, album_id: "wall", count: 0 });
      const photoId = _.random(count);
      const {
        items: [photo]
      } = await api.photos.get({ owner_id: -34223764, album_id: "wall", count: 1, offset: photoId });

      console.log(photo.id);
    }
  )
  .command(
    `message [${PEER_ID}]`,
    "Seinging message to the dialog",
    y => {
      y.positional(PEER_ID, { describe: "peer id for message", default: DEFAULT_PEER_ID })
        .option("msg", {
          description: "message text",
          alias: "m",
          type: "string"
        })
        .option("attachment", {
          description: "message attachments",
          alias: "a",
          type: "array"
        })
        .option("timeout", {
          description: "sets timeout between posts",
          alias: "t",
          type: "number",
          default: 2000
        })
        .option("count", {
          description: "repeat count",
          alias: "c",
          type: "number",
          default: 1
        })
        .check(({ msg, attachment }) => {
          if (msg === undefined && attachment === undefined) throw new Error("msg or attachment option required");
          return true;
        });
    },
    async argv => {
      const { msg, attachment, peerId, count, timeout } = argv as typeof argv & { peerId: number; msg?: string; attachment?: string[]; count: number; timeout: number };
      const parseAttachments = async () => {
        if (!attachment) return "";
        const parsed = await Promise.all(
          attachment.map(async (a, i) => {
            // const [type] = /\w+/.exec(a);
            // const [ownerId] = /-\d+|\d+/.exec(a);
            // const [id] = /_(.+)/.exec(a).groups[1];

            const [, type, ownerId, id] = a.match(/([a-z]+)(-?\d+)_(.+)/);

            switch (type) {
              case "album": {
                const { count } = await api.photos.get({ owner_id: Number(ownerId), album_id: id, count: 0 });
                const photoId = _.random(count);
                const response = await api.photos.get({ owner_id: Number(ownerId), album_id: id, count: 1, offset: photoId });
                const {
                  items: [photo]
                } = response;

                a = `photo${photo.owner_id}_${photo.id}`;
                break;
              }
            }
            return a;
          })
        );

        return parsed.join();
      };

      for (let i = 0; i < count; i++) {
        await api.messages.send({ peer_id: peerId, message: msg || "", attachment: await parseAttachments() });
        await new Promise(res => setTimeout(res, timeout));
      }
    }
  ).argv;
