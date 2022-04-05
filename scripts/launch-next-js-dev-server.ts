import { execa } from "execa";

const script = async () => {
  await execa(
    "next-remote-watch",
    [
      // @todo Add resource paths that should refresh Next.js page
    ],
    {
      stdio: "inherit",
    },
  );
};

await script();
