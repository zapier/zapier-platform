# Installing Development Version of Zapier Platform CLI

## Prerequisites

Before installing the development version of the Zapier Platform CLI, ensure you have:

- Node.js (refer to `.tool-versions` for the recommended version)
- pnpm (`npm install -g pnpm`)
- Git

We recommend using `asdf` to manage Node.js and pnpm versions consistently.


To try out the latest development version of the Zapier Platform CLI tool, you can pull the source code from GitHub and run it directly. Follow the instructions below.

## First Time Setup

Clone the zapier-platform repo and install the dependencies:

```
cd ~/projects  # or wherever you want to clone the repo
git clone git@github.com/zapier/zapier-platform.git
cd zapier-platform
pnpm install
```

Then add this line to your shell configuration file, such as `~/.bashrc` or `~/.zshrc`:

```
# Replace `/absolute/path/to/zapier-platform` with the actual path where you cloned the repository.
alias zapier-dev="node /absolute/path/to/zapier-platform/packages/cli/src/bin/run"
```

Restart your shell with `exec $SHELL` and `zapier-dev` should be available. Test it out by running `zapier-dev` in your terminal. You should see output similar to:

```
$ zapier-dev
The CLI for managing integrations in Zapier Developer Platform.

VERSION
  zapier-platform-cli/15.16.0 darwin-arm64 node-v21.7.1

USAGE
  $ zapier [COMMAND]
```

## Updating the CLI

To update, pull from the main branch or any feature branch, and update the dependencies:

```
cd ~/projects/zapier-platform
git fetch origin main  # or a feature branch
git pull origin main   # or a feature branch
pnpm install
```
