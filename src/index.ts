import * as _ from "lodash";
import * as dotenv from "dotenv";
import * as yargs from "yargs";
import { VK } from "vk-io";

const DEFAULT_PEER_ID = 2000000069;
const PEER_ID = "peerId";

dotenv.config();

const { api } = new VK({ token: process.env.TOKEN });

yargs
  .command(
    "test",
    "Test command",
    y => {
      y.option("foo", {})
        .option("who", {})
        .check(({ foo, who }) => {
          if (foo === undefined && who === undefined) throw new Error("foo or who option required");
          return true;
        })
        .conflicts("who", "foo");
    },
    argv => {
      console.log(argv);
    }
  )

  .command(
    `message [${PEER_ID}]`,
    "Seinging message to the dialog",
    y => {
      y.positional(PEER_ID, { describe: "peer id for message", default: DEFAULT_PEER_ID })
        .option("content", {
          description: "message text",
          alias: "c"
        })
        .option("attachment", {
          description: "message attachments",
          alias: "a",
          type: "array"
        })
        .check(({ content, attachment }) => {
          if (content === undefined && attachment === undefined) throw new Error("content or attachment option required");
          return true;
        });
    },
    async argv => {
      const { content, attachment, peerId } = argv as typeof argv & { peerId: number; content?: string; attachment?: string[] };
      const parseAttachments = async () => {
        if (!attachment) return "";
        const parsed = await Promise.all(
          attachment.map(async (a, i) => {
            const [type] = /\w+/.exec(a);
            const regexp = /-\d+|\d+/g;
            const [ownerId] = regexp.exec(a),
              [id] = regexp.exec(a);

            switch (type) {
              case "album": {
                const photos = await api.photos.get({ album_id: id, owner_id: Number(ownerId), count: 200 });
                const photo = photos.items[_.random(photos.items.length)];
                a = `photo${photo.owner_id}_${photo.id}`;
                break;
              }
            }
            return a;
          })
        );

        return parsed.join();
      };
      api.messages.send({ peer_id: peerId, message: content || "", attachment: await parseAttachments() });
    }
  ).argv;
