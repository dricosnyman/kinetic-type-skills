# kinetic-type-skills

Two skills for Claude Code that help you make kinetic typography videos (words that move, slam, fade and slide) with [Remotion](https://www.remotion.dev).

- **kinetic-type** helps you choose an animation style for your text.
- **kinetic-type-director** takes a whole script and directs it into a video, scene by scene.

There is also a gallery page that shows every style moving, so you can look before you choose:
https://dricosnyman.github.io/kinetic-type-skills/

## Install on a new PC

First, tell Claude Code where this collection lives:

```bash
claude plugin marketplace add dricosnyman/kinetic-type-skills
```

Then install the plugin from it:

```bash
claude plugin install kinetic-type@kinetic-type-skills
```

Restart Claude Code and the two skills are ready.

## Update

First, fetch the latest version of the collection:

```bash
claude plugin marketplace update kinetic-type-skills
```

Then update the plugin itself:

```bash
claude plugin update kinetic-type@kinetic-type-skills
```

Updates only show up after you restart Claude Code.

## Try the styles yourself

This repo is also a small Remotion project. After `npm i`, run `npm run lab` to open Remotion Studio and play with the styles.

## Licence

MIT. Free to use and change.
